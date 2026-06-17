import { CmdBase } from '@/common';
import {
    createLogisticsSnapshot,
    findConveyorByEntityId,
    findFirstWaitingWorkpiece,
    findLoadingDeviceByKind,
    getConveyorProgress,
    isConveyorAtCapacity,
    isConveyorEntryOccupied,
    LOGISTICS_LOCATIONS,
    LogisticsSnapshotEvent,
} from '../model/logistics';
import { getWorkpieceOnBeltPosition } from '../model/pipeline';
import { SimpleWorkpiece } from '../model/workpiece';
import { TempCanvas } from '../view/temp_canvas';
import { syncWarehouseStatus } from './pipeline_command_utils';

export interface LoadWorkpieceParams {
    conveyorId?: number;
    workpieceId?: number;
    duration?: number;
}

/**
 * 手动上料命令。
 *
 * 从 warehouse_01 取一个 waiting 工件，放到传送带入口；后续移动由 tick 命令推进。
 */
export class LoadWorkpieceCommand extends CmdBase<LoadWorkpieceParams, TempCanvas> {
    public async commit(): Promise<void> {
        const entityList = this._view.app.doc.entityList;
        const conveyor = findConveyorByEntityId(entityList, this._params?.conveyorId);

        if (!conveyor || conveyor.status === 'blocked') {
            this.cancel();

            return;
        }

        const workpiece = this._findTargetWorkpiece();
        const loader = findLoadingDeviceByKind(entityList, 'loader');

        if (
            !workpiece ||
            workpiece.state !== 'waiting' ||
            workpiece.location !== LOGISTICS_LOCATIONS.warehouse ||
            !loader ||
            loader?.status === 'busy' ||
            isConveyorAtCapacity(entityList, conveyor) ||
            isConveyorEntryOccupied(entityList, conveyor)
        ) {
            this.cancel();

            return;
        }

        loader?.setStatus('busy');
        workpiece.setState('loading');
        workpiece.setLocation(LOGISTICS_LOCATIONS.loader);
        workpiece.moveToPosition(getWorkpieceOnBeltPosition(conveyor, 0, workpiece.workpieceType));
        workpiece.setState('moving');
        workpiece.setLocation(conveyor.conveyorId);
        workpiece.setRemaining(this._getRemainingSeconds(workpiece));
        loader?.setStatus('idle');
        syncWarehouseStatus(this._view);

        this._view.dirty();
        this._dispatchLogisticsSnapshot();

        super.commit({
            workpieceId: workpiece.id,
            conveyorId: conveyor.id,
            progress: getConveyorProgress(conveyor, workpiece),
        });
        this._view.select([workpiece.id]);
    }

    private _findTargetWorkpiece(): SimpleWorkpiece | null {
        const workpieceId = this._params?.workpieceId;

        if (workpieceId === undefined) {
            return findFirstWaitingWorkpiece(this._view.app.doc.entityList);
        }

        const entity = this._view.app.doc.getEntity(workpieceId);

        return entity instanceof SimpleWorkpiece ? entity : null;
    }

    private _getRemainingSeconds(workpiece: SimpleWorkpiece): number {
        const conveyor = findConveyorByEntityId(this._view.app.doc.entityList, this._params?.conveyorId);

        if (!conveyor || conveyor.speed <= 0) {
            return 0;
        }

        const progress = getConveyorProgress(conveyor, workpiece);

        return ((1 - progress) * conveyor.length) / conveyor.speed;
    }

    private _dispatchLogisticsSnapshot(): void {
        const conveyor = findConveyorByEntityId(this._view.app.doc.entityList, this._params?.conveyorId);
        const snapshot = createLogisticsSnapshot(this._view.app.doc.entityList, conveyor);
        const event: LogisticsSnapshotEvent = {
            type: 'logisticsSnapshot',
            ...snapshot,
        };

        this._view.app.signalEventBus.dispatch(event);
    }
}

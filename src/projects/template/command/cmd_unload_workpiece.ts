import { CmdBase } from '@/common';
import {
    createLogisticsSnapshot,
    findFirstConveyor,
    findLoadingDeviceByKind,
    getExitWaitingWorkpieces,
    getSimpleWorkpieces,
    getWorktableBusyWorkpiece,
    LOGISTICS_LOCATIONS,
    LogisticsSnapshotEvent,
} from '../model/logistics';
import { getManualUnloadPosition } from '../model/pipeline';
import { SimpleWorkpiece } from '../model/workpiece';
import { TempCanvas } from '../view/temp_canvas';
import { getOrCreateWorktable, syncWorktableStatus } from './pipeline_command_utils';

export interface UnloadWorkpieceParams {
    workpieceId?: number;
    duration?: number;
}

/**
 * 手动下料命令。
 *
 * 从传送带 B 点取下 arrived 工件，并放到 worktable_01。
 */
export class UnloadWorkpieceCommand extends CmdBase<UnloadWorkpieceParams, TempCanvas> {
    public async commit(): Promise<void> {
        const target = this._findTargetWorkpiece();

        if (!target || target.state !== 'arrived' || target.location !== LOGISTICS_LOCATIONS.conveyorExit) {
            this.cancel();

            return;
        }

        if (getWorktableBusyWorkpiece(this._view.app.doc.entityList)) {
            this.cancel();

            return;
        }

        const unloader = findLoadingDeviceByKind(this._view.app.doc.entityList, 'unloader');
        if (!unloader || unloader.status === 'busy') {
            this.cancel();

            return;
        }

        getOrCreateWorktable(this._view);
        unloader?.setStatus('busy');
        target.setState('unloading');
        target.setLocation(LOGISTICS_LOCATIONS.unloader);
        target.moveToPosition(this._getWorktablePosition());
        target.setRemaining(0);
        target.setState('done');
        target.setLocation(LOGISTICS_LOCATIONS.worktable);
        unloader?.setStatus('idle');

        const conveyor = findFirstConveyor(this._view.app.doc.entityList);
        if (conveyor?.status === 'blocked' && getExitWaitingWorkpieces(this._view.app.doc.entityList).length === 0) {
            conveyor.setStatus('running');
        }

        syncWorktableStatus(this._view);
        this._view.dirty();
        this._dispatchLogisticsSnapshot();

        super.commit({
            workpieceId: target.id,
            location: target.location,
            state: target.state,
        });
        this._view.select([target.id]);
    }

    private _findTargetWorkpiece(): SimpleWorkpiece | null {
        const workpieceId = this._params?.workpieceId;

        if (workpieceId === undefined) {
            return getExitWaitingWorkpieces(this._view.app.doc.entityList)[0] ?? null;
        }

        const entity = this._view.app.doc.getEntity(workpieceId);

        return entity instanceof SimpleWorkpiece ? entity : null;
    }

    private _getWorktablePosition(): [number, number, number] {
        const doneCount = getSimpleWorkpieces(this._view.app.doc.entityList).filter(
            (workpiece) => workpiece.location === LOGISTICS_LOCATIONS.worktable && workpiece.state === 'done'
        ).length;

        return getManualUnloadPosition(doneCount);
    }

    private _dispatchLogisticsSnapshot(): void {
        const conveyor = findFirstConveyor(this._view.app.doc.entityList);
        const snapshot = createLogisticsSnapshot(this._view.app.doc.entityList, conveyor);
        const event: LogisticsSnapshotEvent = {
            type: 'logisticsSnapshot',
            ...snapshot,
        };

        this._view.app.signalEventBus.dispatch(event);
    }
}

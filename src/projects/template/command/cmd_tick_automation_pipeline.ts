import { CmdBase } from '@/common';
import { ConveyorEntity } from '../model/conveyor';
import {
    createLogisticsSnapshot,
    findLoadingDeviceByKind,
    getSimpleWorkpieces,
    getWarehouseWorkpieces,
    LogisticsSnapshotEvent,
} from '../model/logistics';
import { PipelineEntity } from '../model/pipeline';
import { SimpleWorkpiece } from '../model/workpiece';
import { TempCanvas } from '../view/temp_canvas';
import { AUTOMATION_PIPELINE_ID, syncWarehouseStatus, syncWorktableStatus } from './pipeline_command_utils';
import type { AutomationPipelineEvent } from './cmd_start_automation_pipeline';

export interface TickAutomationPipelineParams {
    pipelineId?: number;
    deltaSeconds: number;
}

export class TickAutomationPipelineCommand extends CmdBase<TickAutomationPipelineParams, TempCanvas> {
    public async commit(): Promise<void> {
        const pipeline = this._findPipeline();
        const deltaSeconds = Math.max(0, this._params?.deltaSeconds ?? 0);

        if (!pipeline || deltaSeconds <= 0) {
            this.cancel();

            return;
        }

        const conveyor = this._view.app.doc.getEntity(pipeline.conveyorId);

        if (!(conveyor instanceof ConveyorEntity)) {
            this.cancel();

            return;
        }

        const snapshot = pipeline.tick(deltaSeconds, {
            conveyor,
            loader: findLoadingDeviceByKind(this._view.app.doc.entityList, 'loader'),
            unloader: findLoadingDeviceByKind(this._view.app.doc.entityList, 'unloader'),
            getCompletedIndex: () => this._getCompletedWorkpieceCount(),
            getWarehouseWaitingIds: () => this._getWarehouseWaitingIds(),
            getWorkpiece: workpieceId => {
                const entity = this._view.app.doc.getEntity(workpieceId);

                return entity instanceof SimpleWorkpiece ? entity : null;
            }
        });
        syncWarehouseStatus(this._view);
        syncWorktableStatus(this._view);
        const logisticsSnapshot = createLogisticsSnapshot(this._view.app.doc.entityList, conveyor);

        this._view.dirty();
        this._view.app.signalEventBus.dispatch({
            type: 'automationPipelineTick',
            pipelineId: pipeline.id,
            conveyorId: conveyor.id
        } satisfies AutomationPipelineEvent);
        this._view.app.signalEventBus.dispatch({
            type: 'logisticsSnapshot',
            ...logisticsSnapshot
        } satisfies LogisticsSnapshotEvent);

        super.commit({
            ...snapshot,
            logisticsSnapshot
        });
    }

    private _findPipeline(): PipelineEntity | null {
        const pipelineId = this._params?.pipelineId;

        if (pipelineId !== undefined) {
            const entity = this._view.app.doc.getEntity(pipelineId);

            return entity instanceof PipelineEntity ? entity : null;
        }

        const entity = this._view.app.doc.entityList.find(item => {
            return item instanceof PipelineEntity && item.businessId === AUTOMATION_PIPELINE_ID;
        });

        return entity instanceof PipelineEntity ? entity : null;
    }

    private _getCompletedWorkpieceCount(): number {
        return getSimpleWorkpieces(this._view.app.doc.entityList).filter(workpiece => {
            return workpiece.state === 'done';
        }).length;
    }

    private _getWarehouseWaitingIds(): number[] {
        return getWarehouseWorkpieces(this._view.app.doc.entityList).map(workpiece => workpiece.id);
    }
}

import { CmdBase } from '@/common';
import { ConveyorEntity } from '../model/conveyor';
import { createLogisticsSnapshot, getWarehouseWorkpieces } from '../model/logistics';
import { PipelineEntity, PipelineMeta } from '../model/pipeline';
import { TempCanvas } from '../view/temp_canvas';
import {
    AUTOMATION_PIPELINE_ID,
    dispatchLogisticsSnapshot,
    ensureWarehouseWorkpieces,
    getOrCreateConveyor,
    getOrCreateWarehouse,
    getOrCreateLoadingDevices,
    getOrCreateWorktable,
    syncWorktableStatus,
} from './pipeline_command_utils';

export interface StartAutomationPipelineParams {
    minWorkpieceCount?: number;
}

export interface AutomationPipelineEvent {
    type: 'automationPipelineStarted' | 'automationPipelineStopped' | 'automationPipelineTick';
    pipelineId: number;
    conveyorId: number;
}

export class StartAutomationPipelineCommand extends CmdBase<StartAutomationPipelineParams, TempCanvas> {
    public async commit(): Promise<void> {
        getOrCreateWarehouse(this._view);
        const conveyor = getOrCreateConveyor(this._view);
        const devices = getOrCreateLoadingDevices(this._view, conveyor);
        getOrCreateWorktable(this._view);
        const minCount = Math.max(3, this._params?.minWorkpieceCount ?? 3);

        ensureWarehouseWorkpieces(this._view, minCount);

        const workpieceIds = getWarehouseWorkpieces(this._view.app.doc.entityList).map(workpiece => workpiece.id);
        const pipeline = this._getOrCreatePipeline(conveyor, workpieceIds);

        devices.loader.setStatus('idle');
        devices.unloader.setStatus('idle');
        syncWorktableStatus(this._view);
        pipeline.start();
        conveyor.start();

        this._view.dirty();
        dispatchLogisticsSnapshot(this._view, conveyor);
        this._view.app.signalEventBus.dispatch({
            type: 'automationPipelineStarted',
            pipelineId: pipeline.id,
            conveyorId: conveyor.id
        } satisfies AutomationPipelineEvent);

        this._view.runInNewFrame(() => {
            this._view.fitView();
            this._view.select([pipeline.id]);
        });

        super.commit({
            pipelineId: pipeline.id,
            conveyorId: conveyor.id,
            snapshot: createLogisticsSnapshot(this._view.app.doc.entityList, conveyor)
        });
    }

    private _getOrCreatePipeline(conveyor: ConveyorEntity, workpieceIds: number[]): PipelineEntity {
        const existed = this._view.app.doc.entityList.find(entity => {
            return entity instanceof PipelineEntity && entity.businessId === AUTOMATION_PIPELINE_ID;
        });

        if (existed instanceof PipelineEntity) {
            existed.resetWorkpieces(workpieceIds);

            return existed;
        }

        const meta: PipelineMeta = {
            id: AUTOMATION_PIPELINE_ID,
            conveyorId: conveyor.id,
            workpieceIds,
            status: 'idle',
            loaderDuration: 1,
            unloaderDuration: 1,
            worktableDuration: 8
        };
        const pipeline = new PipelineEntity(meta);

        this._view.addModel(pipeline);
        pipeline.dirtyGeometry();

        return pipeline;
    }
}

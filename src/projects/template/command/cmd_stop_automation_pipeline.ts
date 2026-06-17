import { CmdBase } from '@/common';
import { ConveyorEntity } from '../model/conveyor';
import { findLoadingDeviceByKind } from '../model/logistics';
import { PipelineEntity } from '../model/pipeline';
import { TempCanvas } from '../view/temp_canvas';
import { AUTOMATION_PIPELINE_ID, dispatchLogisticsSnapshot } from './pipeline_command_utils';
import type { AutomationPipelineEvent } from './cmd_start_automation_pipeline';

export interface StopAutomationPipelineParams {
    pipelineId?: number;
}

export class StopAutomationPipelineCommand extends CmdBase<StopAutomationPipelineParams, TempCanvas> {
    public async commit(): Promise<void> {
        const pipeline = this._findPipeline();

        if (!pipeline) {
            this.cancel();

            return;
        }

        const conveyor = this._view.app.doc.getEntity(pipeline.conveyorId);

        pipeline.pause();
        if (conveyor instanceof ConveyorEntity) {
            conveyor.stop();
        }
        findLoadingDeviceByKind(this._view.app.doc.entityList, 'loader')?.setStatus('idle');
        findLoadingDeviceByKind(this._view.app.doc.entityList, 'unloader')?.setStatus('idle');

        this._view.dirty();
        dispatchLogisticsSnapshot(this._view, conveyor instanceof ConveyorEntity ? conveyor : null);
        this._view.app.signalEventBus.dispatch({
            type: 'automationPipelineStopped',
            pipelineId: pipeline.id,
            conveyorId: conveyor instanceof ConveyorEntity ? conveyor.id : -1
        } satisfies AutomationPipelineEvent);

        super.commit({
            pipelineId: pipeline.id,
            status: pipeline.status
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
}

import { CmdBase } from '@/common';
import { ConveyorEntity } from '../model/conveyor';
import { PipelineEntity, PipelineStatus } from '../model/pipeline';
import { TempCanvas } from '../view/temp_canvas';

export interface SetPipelineStatusParams {
    pipelineId: number;
    status: Extract<PipelineStatus, 'running' | 'paused'>;
}

export interface PipelineStatusChangeEvent {
    type: 'pipelineStatusChange';
    pipelineId: number;
    status: PipelineStatus;
}

export class SetPipelineStatusCommand extends CmdBase<SetPipelineStatusParams, TempCanvas> {
    public async commit(): Promise<void> {
        const params = this._params;

        if (params?.pipelineId === undefined || !params.status) {
            this.cancel();

            return;
        }

        const pipeline = this._view.app.doc.getEntity(params.pipelineId);

        if (!(pipeline instanceof PipelineEntity)) {
            this.cancel();

            return;
        }

        if (params.status === 'running') {
            pipeline.start();

            if (pipeline.status === 'running') {
                this._findConveyor(pipeline)?.setStatus('running');
            }
        } else {
            pipeline.pause();

            if (pipeline.status === 'paused') {
                this._findConveyor(pipeline)?.setStatus('stopped');
            }
        }

        this._view.dirty();
        this._view.app.signalEventBus.dispatch({
            type: 'pipelineStatusChange',
            pipelineId: pipeline.id,
            status: pipeline.status
        } satisfies PipelineStatusChangeEvent);

        super.commit({
            pipelineId: pipeline.id,
            status: pipeline.status
        });
    }

    private _findConveyor(pipeline: PipelineEntity): ConveyorEntity | null {
        const entity = this._view.app.doc.getEntity(pipeline.conveyorId);

        return entity instanceof ConveyorEntity ? entity : null;
    }
}

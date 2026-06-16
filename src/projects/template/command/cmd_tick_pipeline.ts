import { CmdBase } from '@/common';
import { ConveyorEntity } from '../model/conveyor';
import { PipelineEntity, PipelineSnapshot } from '../model/pipeline';
import { SimpleWorkpiece } from '../model/workpiece';
import { TempCanvas } from '../view/temp_canvas';

export interface TickPipelineParams {
    pipelineId: number;
    deltaSeconds: number;
}

export interface PipelineTickEvent extends PipelineSnapshot {
    type: 'pipelineTick';
}

export class TickPipelineCommand extends CmdBase<TickPipelineParams, TempCanvas> {
    public async commit(): Promise<void> {
        const params = this._params;

        if (params?.pipelineId === undefined || params.deltaSeconds <= 0) {
            this.cancel();

            return;
        }

        const pipeline = this._view.app.doc.getEntity(params.pipelineId);

        if (!(pipeline instanceof PipelineEntity)) {
            this.cancel();

            return;
        }

        const conveyor = this._view.app.doc.getEntity(pipeline.conveyorId);

        if (!(conveyor instanceof ConveyorEntity)) {
            this.cancel();

            return;
        }

        const snapshot = pipeline.tick(params.deltaSeconds, {
            conveyor,
            getWorkpiece: workpieceId => {
                const entity = this._view.app.doc.getEntity(workpieceId);

                return entity instanceof SimpleWorkpiece ? entity : null;
            }
        });

        this._view.dirty();
        this._view.app.signalEventBus.dispatch({
            type: 'pipelineTick',
            ...snapshot
        } satisfies PipelineTickEvent);

        super.commit(snapshot);
    }
}

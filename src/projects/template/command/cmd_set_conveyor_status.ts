import { CmdBase } from '@/common';
import { ConveyorEntity, ConveyorStatus } from '../model/conveyor';
import { TempCanvas } from '../view/temp_canvas';

export interface SetConveyorStatusParams {
    conveyorId: number;
    status: ConveyorStatus;
}

export interface ConveyorStatusChangeEvent {
    type: 'conveyorStatusChange';
    conveyorId: number;
    status: ConveyorStatus;
}

export class SetConveyorStatusCommand extends CmdBase<SetConveyorStatusParams, TempCanvas> {
    public async commit(): Promise<void> {
        const params = this._params;

        if (params?.conveyorId === undefined || !params.status) {
            this.cancel();

            return;
        }

        const entity = this._view.app.doc.getEntity(params.conveyorId);

        if (!(entity instanceof ConveyorEntity)) {
            this.cancel();

            return;
        }

        entity.setStatus(params.status);
        this._view.dirty();
        this._view.app.signalEventBus.dispatch({
            type: 'conveyorStatusChange',
            conveyorId: entity.id,
            status: entity.status
        } satisfies ConveyorStatusChangeEvent);

        super.commit({
            conveyorId: entity.id,
            status: entity.status
        });
    }
}

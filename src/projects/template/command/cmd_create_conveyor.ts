import { CmdBase } from '@/common';
import { ConveyorEntity, ConveyorMeta, DEFAULT_CONVEYOR_META } from '../model/conveyor';
import { TempCanvas } from '../view/temp_canvas';
import { focusEntitiesInNextFrame } from './pipeline_command_utils';

export interface CreateConveyorParams {
    id?: string;
    startPoint?: [number, number, number];
    endPoint?: [number, number, number];
    speed?: number;
    capacity?: number;
}

export class CreateConveyorCommand extends CmdBase<CreateConveyorParams, TempCanvas> {
    public async commit(): Promise<void> {
        const meta: ConveyorMeta = {
            id: this._params?.id ?? DEFAULT_CONVEYOR_META.id,
            startPoint: this._params?.startPoint ?? DEFAULT_CONVEYOR_META.startPoint,
            endPoint: this._params?.endPoint ?? DEFAULT_CONVEYOR_META.endPoint,
            speed: this._params?.speed ?? DEFAULT_CONVEYOR_META.speed,
            capacity: this._params?.capacity ?? DEFAULT_CONVEYOR_META.capacity,
            status: 'idle'
        };

        const existed = this._findConveyor(meta.id);

        if (existed) {
            existed.setEndpoints(meta.startPoint, meta.endPoint);
            existed.setRuntimeData(meta.speed, meta.capacity);
            existed.setStatus('idle');
            this._view.dirty();
            focusEntitiesInNextFrame(this._view, [existed.id]);

            super.commit({ conveyorId: existed.id });

            return;
        }

        const conveyor = new ConveyorEntity(meta);

        this._view.addModel(conveyor);
        conveyor.dirtyGeometry();
        this._view.dirty();
        focusEntitiesInNextFrame(this._view, [conveyor.id]);

        super.commit({ conveyorId: conveyor.id });
    }

    private _findConveyor(conveyorId: string): ConveyorEntity | null {
        const entity = this._view.app.doc.entityList.find(item => {
            return item instanceof ConveyorEntity && item.conveyorId === conveyorId;
        });

        return entity instanceof ConveyorEntity ? entity : null;
    }
}

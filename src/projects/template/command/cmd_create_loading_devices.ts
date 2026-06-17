import { CmdBase } from '@/common';
import { TempCanvas } from '../view/temp_canvas';
import { getOrCreateConveyor, getOrCreateLoadingDevices, dispatchLogisticsSnapshot } from './pipeline_command_utils';

export interface CreateLoadingDevicesParams {
    conveyorId?: number;
}

export interface LoadingDevicesCreatedEvent {
    type: 'loadingDevicesCreated';
    loaderId: number;
    unloaderId: number;
    conveyorId: number;
}

export class CreateLoadingDevicesCommand extends CmdBase<CreateLoadingDevicesParams, TempCanvas> {
    public async commit(): Promise<void> {
        const conveyor = getOrCreateConveyor(this._view);
        const devices = getOrCreateLoadingDevices(this._view, conveyor);

        this._view.dirty();
        dispatchLogisticsSnapshot(this._view, conveyor);
        this._view.app.signalEventBus.dispatch({
            type: 'loadingDevicesCreated',
            loaderId: devices.loader.id,
            unloaderId: devices.unloader.id,
            conveyorId: conveyor.id
        } satisfies LoadingDevicesCreatedEvent);

        this._view.runInNewFrame(() => {
            this._view.fitView();
            this._view.select([devices.loader.id, devices.unloader.id]);
        });

        super.commit({
            conveyorId: conveyor.id,
            loaderId: devices.loader.id,
            unloaderId: devices.unloader.id
        });
    }
}

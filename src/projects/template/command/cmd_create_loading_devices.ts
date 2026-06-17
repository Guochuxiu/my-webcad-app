import { CmdBase } from '@/common';
import { TempCanvas } from '../view/temp_canvas';
import {
    dispatchLogisticsSnapshot,
    focusEntitiesInNextFrame,
    getOrCreateConveyor,
    getOrCreateLoadingDevices,
    getOrCreateWorktable,
    syncWorktableStatus,
} from './pipeline_command_utils';

export interface CreateLoadingDevicesParams {
    conveyorId?: number;
}

export interface LoadingDevicesCreatedEvent {
    type: 'loadingDevicesCreated';
    loaderId: number;
    unloaderId: number;
    conveyorId: number;
    worktableId: number;
}

export class CreateLoadingDevicesCommand extends CmdBase<CreateLoadingDevicesParams, TempCanvas> {
    public async commit(): Promise<void> {
        const conveyor = getOrCreateConveyor(this._view);
        const devices = getOrCreateLoadingDevices(this._view, conveyor);
        const worktable = getOrCreateWorktable(this._view);

        syncWorktableStatus(this._view);
        this._view.dirty();
        dispatchLogisticsSnapshot(this._view, conveyor);
        this._view.app.signalEventBus.dispatch({
            type: 'loadingDevicesCreated',
            loaderId: devices.loader.id,
            unloaderId: devices.unloader.id,
            conveyorId: conveyor.id,
            worktableId: worktable.id
        } satisfies LoadingDevicesCreatedEvent);

        focusEntitiesInNextFrame(this._view, [devices.loader.id, devices.unloader.id, worktable.id]);

        super.commit({
            conveyorId: conveyor.id,
            loaderId: devices.loader.id,
            unloaderId: devices.unloader.id,
            worktableId: worktable.id
        });
    }
}

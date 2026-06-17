import type { ConveyorEntity, ConveyorPoint } from '../conveyor';
import type { LoadingDeviceEntity } from '../loading_device';
import type { SimpleWorkpiece } from '../workpiece';

export type PipelinePoint = ConveyorPoint;
export type PipelineStatus = 'idle' | 'running' | 'paused' | 'blocked' | 'completed';
export type PipelineDeviceStatus = 'idle' | 'busy';
export type PipelineBlockedReason =
    | 'none'
    | 'conveyor_full'
    | 'conveyor_entry_occupied'
    | 'conveyor_exit_occupied'
    | 'worktable_busy'
    | 'loader_busy'
    | 'unloader_busy';

export interface PipelineSlot {
    workpieceId: number;
    progress: number;
}

export interface PipelineDeviceTask {
    workpieceId: number;
    elapsed: number;
    duration: number;
    from: PipelinePoint;
    to: PipelinePoint;
}

export interface PipelineWorktableTask {
    workpieceId: number;
    remaining: number;
    duration: number;
}

export interface PipelineSnapshot {
    pipelineId: number;
    businessId: string;
    currentTime: number;
    status: PipelineStatus;
    waitingCount: number;
    conveyingCount: number;
    exitWaitingCount: number;
    blockedReason: PipelineBlockedReason;
    loaderStatus: PipelineDeviceStatus;
    unloaderStatus: PipelineDeviceStatus;
    worktableStatus: PipelineDeviceStatus;
    completedCount: number;
    conveyorSlots: PipelineSlot[];
}

export interface PipelineTickContext {
    conveyor: ConveyorEntity;
    loader?: LoadingDeviceEntity | null;
    unloader?: LoadingDeviceEntity | null;
    getCompletedIndex?(): number;
    getWarehouseWaitingIds?(): number[];
    getWorkpiece(workpieceId: number): SimpleWorkpiece | null;
}

export interface PipelineMeta {
    id: string;
    conveyorId: number;
    workpieceIds: number[];
    status?: PipelineStatus;
    currentTime?: number;
    loaderDuration?: number;
    unloaderDuration?: number;
    worktableDuration?: number;
}

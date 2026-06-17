import { ConveyorEntity, ConveyorStatus } from '../conveyor';
import { LoadingDeviceEntity, LoadingDeviceKind, LoadingDeviceStatus } from '../loading_device';
import { PipelineEntity, PipelineStatus } from '../pipeline';
import { SimpleWorkpiece } from '../workpiece';

export const LOGISTICS_LOCATIONS = {
    warehouse: 'warehouse_01',
    loader: 'loader_01',
    conveyorExit: 'conveyor_exit',
    unloader: 'unloader_01',
    worktable: 'worktable_01',
} as const;

export type LogisticsBlockedReason =
    | 'none'
    | 'conveyor_full'
    | 'conveyor_entry_occupied'
    | 'conveyor_exit_occupied'
    | 'worktable_busy'
    | 'loader_busy'
    | 'unloader_busy';

export interface LogisticsSnapshot {
    currentTime: number;
    conveyorId?: number;
    conveyorBusinessId?: string;
    conveyorStatus?: ConveyorStatus;
    automationStatus: PipelineStatus | 'idle';
    loaderStatus: LoadingDeviceStatus | 'missing';
    unloaderStatus: LoadingDeviceStatus | 'missing';
    waitingCount: number;
    conveyingCount: number;
    exitWaitingCount: number;
    blockedReason: LogisticsBlockedReason;
    worktableStatus: 'idle' | 'busy';
    completedCount: number;
    canLoad: boolean;
    canUnload: boolean;
    warehouseWaitingIds: number[];
    conveyingIds: number[];
    exitWaitingIds: number[];
}

export interface LogisticsSnapshotEvent extends LogisticsSnapshot {
    type: 'logisticsSnapshot';
}

const ENTRY_OCCUPIED_PROGRESS = 0.12;

export function getSimpleWorkpieces(entityList: unknown[]): SimpleWorkpiece[] {
    return entityList.filter((entity): entity is SimpleWorkpiece => entity instanceof SimpleWorkpiece);
}

export function getConveyors(entityList: unknown[]): ConveyorEntity[] {
    return entityList.filter((entity): entity is ConveyorEntity => entity instanceof ConveyorEntity);
}

export function getLoadingDevices(entityList: unknown[]): LoadingDeviceEntity[] {
    return entityList.filter((entity): entity is LoadingDeviceEntity => entity instanceof LoadingDeviceEntity);
}

export function findLoadingDeviceByKind(
    entityList: unknown[],
    kind: LoadingDeviceKind
): LoadingDeviceEntity | null {
    return getLoadingDevices(entityList).find((device) => device.kind === kind) ?? null;
}

export function getPipelines(entityList: unknown[]): PipelineEntity[] {
    return entityList.filter((entity): entity is PipelineEntity => entity instanceof PipelineEntity);
}

export function findFirstPipeline(entityList: unknown[]): PipelineEntity | null {
    return getPipelines(entityList)[0] ?? null;
}

export function findFirstConveyor(entityList: unknown[]): ConveyorEntity | null {
    return getConveyors(entityList)[0] ?? null;
}

export function findConveyorByEntityId(entityList: unknown[], entityId?: number): ConveyorEntity | null {
    if (entityId === undefined) {
        return findFirstConveyor(entityList);
    }

    return getConveyors(entityList).find((conveyor) => conveyor.id === entityId) ?? null;
}

export function getWarehouseWorkpieces(entityList: unknown[]): SimpleWorkpiece[] {
    return getSimpleWorkpieces(entityList).filter(
        (workpiece) => workpiece.location === LOGISTICS_LOCATIONS.warehouse && workpiece.state === 'waiting'
    );
}

export function findFirstWaitingWorkpiece(entityList: unknown[]): SimpleWorkpiece | null {
    return getWarehouseWorkpieces(entityList)[0] ?? null;
}

export function getConveyorWorkpieces(entityList: unknown[], conveyor: ConveyorEntity): SimpleWorkpiece[] {
    return getSimpleWorkpieces(entityList).filter(
        (workpiece) => workpiece.location === conveyor.conveyorId && workpiece.state === 'moving'
    );
}

export function getExitWaitingWorkpieces(entityList: unknown[]): SimpleWorkpiece[] {
    return getSimpleWorkpieces(entityList).filter(
        (workpiece) => workpiece.location === LOGISTICS_LOCATIONS.conveyorExit && workpiece.state === 'arrived'
    );
}

export function getWorktableBusyWorkpiece(entityList: unknown[]): SimpleWorkpiece | null {
    return (
        getSimpleWorkpieces(entityList).find(
            (workpiece) => workpiece.location === LOGISTICS_LOCATIONS.worktable && workpiece.state !== 'done'
        ) ?? null
    );
}

export function getActiveDeviceWorkpiece(entityList: unknown[]): SimpleWorkpiece | null {
    return (
        getSimpleWorkpieces(entityList).find(
            (workpiece) => workpiece.state === 'loading' || workpiece.state === 'unloading'
        ) ?? null
    );
}

export function getConveyorProgress(conveyor: ConveyorEntity, workpiece: SimpleWorkpiece): number {
    const [sx, sy, sz] = conveyor.startPoint;
    const [ex, ey, ez] = conveyor.endPoint;
    const [px, py, pz] = workpiece.getPositionTuple();
    const vx = ex - sx;
    const vy = ey - sy;
    const vz = ez - sz;
    const lenSq = vx * vx + vy * vy + vz * vz;

    if (lenSq <= 0) {
        return 0;
    }

    const progress = ((px - sx) * vx + (py - sy) * vy + (pz - sz) * vz) / lenSq;
    return Math.min(1, Math.max(0, progress));
}

export function isConveyorAtCapacity(entityList: unknown[], conveyor: ConveyorEntity): boolean {
    return getConveyorWorkpieces(entityList, conveyor).length >= conveyor.capacity;
}

export function isConveyorEntryOccupied(entityList: unknown[], conveyor: ConveyorEntity): boolean {
    return getConveyorWorkpieces(entityList, conveyor).some(
        (workpiece) => getConveyorProgress(conveyor, workpiece) <= ENTRY_OCCUPIED_PROGRESS
    );
}

export function createLogisticsSnapshot(entityList: unknown[], conveyor?: ConveyorEntity | null): LogisticsSnapshot {
    const waiting = getWarehouseWorkpieces(entityList);
    const conveying = conveyor ? getConveyorWorkpieces(entityList, conveyor) : [];
    const exitWaiting = getExitWaitingWorkpieces(entityList);
    const worktableBusy = Boolean(getWorktableBusyWorkpiece(entityList));
    const conveyorAtCapacity = conveyor ? isConveyorAtCapacity(entityList, conveyor) : false;
    const conveyorEntryOccupied = conveyor ? isConveyorEntryOccupied(entityList, conveyor) : false;
    const loader = findLoadingDeviceByKind(entityList, 'loader');
    const unloader = findLoadingDeviceByKind(entityList, 'unloader');
    const pipeline = findFirstPipeline(entityList);
    const activeDeviceWorkpiece = getActiveDeviceWorkpiece(entityList);
    const loaderBusy = loader?.status === 'busy' || activeDeviceWorkpiece?.state === 'loading';
    const unloaderBusy = unloader?.status === 'busy' || activeDeviceWorkpiece?.state === 'unloading';

    let blockedReason: LogisticsBlockedReason = 'none';
    if (conveyor && exitWaiting.length > 0) {
        blockedReason = worktableBusy ? 'worktable_busy' : 'conveyor_exit_occupied';
    } else if (worktableBusy) {
        blockedReason = 'worktable_busy';
    } else if (loaderBusy) {
        blockedReason = 'loader_busy';
    } else if (unloaderBusy) {
        blockedReason = 'unloader_busy';
    } else if (conveyorAtCapacity) {
        blockedReason = 'conveyor_full';
    } else if (conveyorEntryOccupied) {
        blockedReason = 'conveyor_entry_occupied';
    }

    return {
        currentTime: Date.now(),
        conveyorId: conveyor?.id,
        conveyorBusinessId: conveyor?.conveyorId,
        conveyorStatus: conveyor?.status,
        automationStatus: pipeline?.status ?? 'idle',
        loaderStatus: loader?.status ?? 'missing',
        unloaderStatus: unloader?.status ?? 'missing',
        waitingCount: waiting.length,
        conveyingCount: conveying.length,
        exitWaitingCount: exitWaiting.length,
        blockedReason,
        worktableStatus: worktableBusy ? 'busy' : 'idle',
        completedCount: getSimpleWorkpieces(entityList).filter((workpiece) => workpiece.state === 'done').length,
        canLoad: Boolean(
            conveyor &&
            loader &&
            waiting.length > 0 &&
            !loaderBusy &&
            !conveyorAtCapacity &&
            !conveyorEntryOccupied &&
            conveyor.status !== 'blocked'
        ),
        canUnload: Boolean(unloader && exitWaiting.length > 0 && !worktableBusy && !unloaderBusy),
        warehouseWaitingIds: waiting.map((workpiece) => workpiece.id),
        conveyingIds: conveying.map((workpiece) => workpiece.id),
        exitWaitingIds: exitWaiting.map((workpiece) => workpiece.id),
    };
}

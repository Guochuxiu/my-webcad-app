import { ConveyorEntity, ConveyorStatus } from '../conveyor';
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
    | 'worktable_busy';

export interface LogisticsSnapshot {
    currentTime: number;
    conveyorId?: number;
    conveyorBusinessId?: string;
    conveyorStatus?: ConveyorStatus;
    waitingCount: number;
    conveyingCount: number;
    exitWaitingCount: number;
    blockedReason: LogisticsBlockedReason;
    worktableStatus: 'idle' | 'busy';
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
            (workpiece) =>
                workpiece.state === 'loading' ||
                workpiece.state === 'unloading' ||
                workpiece.state === 'processing'
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

    let blockedReason: LogisticsBlockedReason = 'none';
    if (conveyor && exitWaiting.length > 0) {
        blockedReason = 'conveyor_exit_occupied';
    } else if (worktableBusy) {
        blockedReason = 'worktable_busy';
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
        waitingCount: waiting.length,
        conveyingCount: conveying.length,
        exitWaitingCount: exitWaiting.length,
        blockedReason,
        worktableStatus: worktableBusy ? 'busy' : 'idle',
        canLoad: Boolean(
            conveyor &&
            waiting.length > 0 &&
            !conveyorAtCapacity &&
            !conveyorEntryOccupied &&
            conveyor.status !== 'blocked'
        ),
        canUnload: exitWaiting.length > 0 && !worktableBusy,
        warehouseWaitingIds: waiting.map((workpiece) => workpiece.id),
        conveyingIds: conveying.map((workpiece) => workpiece.id),
        exitWaitingIds: exitWaiting.map((workpiece) => workpiece.id),
    };
}

import { FSCore } from '@fs/cadnginx';
import {
    PipelineBlockedReason,
    PipelineDeviceTask,
    PipelineDeviceStatus,
    PipelineMeta,
    PipelineSnapshot,
    PipelineSlot,
    PipelineStatus,
    PipelineTickContext
} from './pipeline_types';
import {
    getCompletedPosition,
    getWorkpieceOnBeltPosition,
    getWarehousePosition,
    interpolatePoint,
    PIPELINE_LAYOUT
} from './pipeline_layout';

const ENTRY_CLEAR_PROGRESS = 0.12;
const MIN_SLOT_GAP = 0.12;

/**
 * 最小流水线业务实体。
 *
 * 它只保存“仓库队列、上下料任务、传送带占位、出口等待、工作台”等业务状态；
 * 可视化交给 PipelineDisplay，行为推进由 Command 调用 tick，避免把流程逻辑塞进裸 Three.js 对象。
 */
export class PipelineEntity extends FSCore.Model.CADEntity<PipelineMeta> {
    private _businessId: string;
    private _conveyorId: number;
    private _workpieceIds: number[];
    private _warehouseQueue: number[];
    private _conveyorSlots: PipelineSlot[] = [];
    private _exitQueue: number[] = [];
    private _completedIds: number[] = [];
    private _loaderTask: PipelineDeviceTask | null = null;
    private _unloaderTask: PipelineDeviceTask | null = null;
    private _worktableTask: { workpieceId: number; remaining: number; duration: number } | null = null;
    private _status: PipelineStatus;
    private _blockedReason: PipelineBlockedReason = 'none';
    private _currentTime = 0;
    private _loaderDuration: number;
    private _unloaderDuration: number;
    private _worktableDuration: number;

    constructor(meta: PipelineMeta) {
        super(meta);
        this._businessId = meta.id;
        this._conveyorId = meta.conveyorId;
        this._workpieceIds = [...meta.workpieceIds];
        this._warehouseQueue = [...meta.workpieceIds];
        this._status = meta.status ?? 'idle';
        this._currentTime = meta.currentTime ?? 0;
        this._loaderDuration = meta.loaderDuration ?? 1;
        this._unloaderDuration = meta.unloaderDuration ?? 1;
        this._worktableDuration = meta.worktableDuration ?? 8;
        this.shouldPickParent = false;
        this._syncGeometryMeta();
    }

    public get businessId(): string {
        return this._businessId;
    }

    public get conveyorId(): number {
        return this._conveyorId;
    }

    public get workpieceIds(): number[] {
        return [...this._workpieceIds];
    }

    public get status(): PipelineStatus {
        return this._status;
    }

    public get blockedReason(): PipelineBlockedReason {
        return this._blockedReason;
    }

    public get currentTime(): number {
        return this._currentTime;
    }

    public get loaderStatus(): PipelineDeviceStatus {
        return this._loaderTask ? 'busy' : 'idle';
    }

    public get unloaderStatus(): PipelineDeviceStatus {
        return this._unloaderTask ? 'busy' : 'idle';
    }

    public get worktableStatus(): PipelineDeviceStatus {
        return this._worktableTask ? 'busy' : 'idle';
    }

    public get snapshot(): PipelineSnapshot {
        return {
            pipelineId: this.id,
            businessId: this._businessId,
            currentTime: this._currentTime,
            status: this._status,
            waitingCount: this._warehouseQueue.length,
            conveyingCount: this._conveyorSlots.length,
            exitWaitingCount: this._exitQueue.length,
            blockedReason: this._blockedReason,
            loaderStatus: this.loaderStatus,
            unloaderStatus: this.unloaderStatus,
            worktableStatus: this.worktableStatus,
            completedCount: this._completedIds.length,
            conveyorSlots: this._conveyorSlots.map(slot => ({ ...slot }))
        };
    }

    public start(): void {
        if (this._status === 'completed') return;

        this._status = 'running';
        this._blockedReason = 'none';
        this._syncGeometryMeta();
        this.dirtyMaterial();
        this.dirty();
    }

    public pause(): void {
        if (this._status === 'completed') return;

        this._status = 'paused';
        this._syncGeometryMeta();
        this.dirtyMaterial();
        this.dirty();
    }

    public resetWorkpieces(workpieceIds: number[]): void {
        this._workpieceIds = [...workpieceIds];
        this._warehouseQueue = [...workpieceIds];
        this._conveyorSlots = [];
        this._exitQueue = [];
        this._completedIds = [];
        this._loaderTask = null;
        this._unloaderTask = null;
        this._worktableTask = null;
        this._status = 'idle';
        this._blockedReason = 'none';
        this._currentTime = 0;
        this._syncGeometryMeta();
        this.dirtyGeometry();
        this.dirtyMaterial();
        this.dirty();
    }

    public syncWarehouseQueue(workpieceIds: number[]): void {
        const knownIds = new Set<number>([
            ...this._workpieceIds,
            ...this._warehouseQueue,
            ...this._conveyorSlots.map(slot => slot.workpieceId),
            ...this._exitQueue,
            ...this._completedIds
        ]);

        if (this._loaderTask) knownIds.add(this._loaderTask.workpieceId);
        if (this._unloaderTask) knownIds.add(this._unloaderTask.workpieceId);
        if (this._worktableTask) knownIds.add(this._worktableTask.workpieceId);

        const newWorkpieceIds = workpieceIds.filter(workpieceId => !knownIds.has(workpieceId));

        if (newWorkpieceIds.length === 0) return;

        // 自动化运行中可能继续创建仓库工件，这里只追加新 waiting 工件，不重置正在执行的任务。
        this._workpieceIds.push(...newWorkpieceIds);
        this._warehouseQueue.push(...newWorkpieceIds);

        if (this._status === 'completed') {
            this._status = 'running';
            this._blockedReason = 'none';
        }

        this._syncGeometryMeta();
        this.dirtyGeometry();
        this.dirtyMaterial();
        this.dirty();
    }

    public tick(deltaSeconds: number, context: PipelineTickContext): PipelineSnapshot {
        const delta = Math.max(0, deltaSeconds);

        if (delta === 0 || (this._status !== 'running' && this._status !== 'blocked')) {
            return this.snapshot;
        }

        const warehouseWaitingIds = context.getWarehouseWaitingIds?.();

        if (warehouseWaitingIds) {
            this.syncWarehouseQueue(warehouseWaitingIds);
        }

        this._currentTime += delta;
        this._blockedReason = 'none';

        this._advanceWorktable(delta, context);
        this._advanceLoader(delta, context);
        this._advanceUnloader(delta, context);
        this._tryStartUnloader(context);

        const exitBlockReason = this._getExitBlockReason();

        if (exitBlockReason !== 'none') {
            this._blockedReason = exitBlockReason;
        }

        if (this._blockedReason === 'none') {
            this._advanceConveyor(delta, context);
            this._tryStartUnloader(context);
        }

        if (this._blockedReason === 'none') {
            this._tryStartLoader(context);
        }

        this._layoutWarehouseQueue(context);
        this._finalizeStatus(context);
        this._syncGeometryMeta();
        this.dirtyMaterial();
        this.dirty();

        return this.snapshot;
    }

    private _advanceLoader(delta: number, context: PipelineTickContext): void {
        if (!this._loaderTask) return;

        context.loader?.setStatus('busy');
        this._loaderTask.elapsed = Math.min(this._loaderTask.duration, this._loaderTask.elapsed + delta);
        const progress = this._loaderTask.elapsed / this._loaderTask.duration;
        const workpiece = context.getWorkpiece(this._loaderTask.workpieceId);

        workpiece?.moveToPosition(interpolatePoint(this._loaderTask.from, this._loaderTask.to, progress));

        if (progress < 1) return;

        if (this._conveyorSlots.length >= context.conveyor.capacity) {
            this._blockedReason = 'conveyor_full';

            return;
        }

        this._conveyorSlots.push({
            workpieceId: this._loaderTask.workpieceId,
            progress: 0
        });
        workpiece?.setState('moving');
        workpiece?.setLocation(context.conveyor.conveyorId);
        workpiece?.moveToPosition(getWorkpieceOnBeltPosition(
            context.conveyor,
            0,
            workpiece?.workpieceType ?? 'box'
        ));
        context.loader?.setStatus('idle');
        this._loaderTask = null;
    }

    private _advanceUnloader(delta: number, context: PipelineTickContext): void {
        if (!this._unloaderTask) return;

        context.unloader?.setStatus('busy');
        this._unloaderTask.elapsed = Math.min(this._unloaderTask.duration, this._unloaderTask.elapsed + delta);
        const progress = this._unloaderTask.elapsed / this._unloaderTask.duration;
        const workpiece = context.getWorkpiece(this._unloaderTask.workpieceId);

        workpiece?.moveToPosition(interpolatePoint(this._unloaderTask.from, this._unloaderTask.to, progress));

        if (progress < 1) return;

        workpiece?.setState('processing');
        workpiece?.setLocation('worktable_01');
        workpiece?.setRemaining(this._worktableDuration);
        workpiece?.moveToPosition(PIPELINE_LAYOUT.worktablePoint);
        this._worktableTask = {
            workpieceId: this._unloaderTask.workpieceId,
            remaining: this._worktableDuration,
            duration: this._worktableDuration
        };
        context.unloader?.setStatus('idle');
        this._unloaderTask = null;
    }

    private _advanceWorktable(delta: number, context: PipelineTickContext): void {
        if (!this._worktableTask) return;

        this._worktableTask.remaining = Math.max(0, this._worktableTask.remaining - delta);
        const workpiece = context.getWorkpiece(this._worktableTask.workpieceId);

        workpiece?.setRemaining(this._worktableTask.remaining);

        if (this._worktableTask.remaining > 0) return;

        const completedIndex = context.getCompletedIndex?.() ?? this._completedIds.length;

        workpiece?.setState('done');
        workpiece?.setRemaining(0);
        workpiece?.setLocation('done_area');
        workpiece?.moveToPosition(getCompletedPosition(completedIndex));
        this._completedIds.push(this._worktableTask.workpieceId);
        this._worktableTask = null;
    }

    private _advanceConveyor(delta: number, context: PipelineTickContext): void {
        if (this._conveyorSlots.length === 0) return;

        const conveyorLength = Math.max(context.conveyor.length, 1);
        const step = (context.conveyor.speed * delta) / conveyorLength;

        this._conveyorSlots.sort((a, b) => b.progress - a.progress);

        for (let index = 0; index < this._conveyorSlots.length; index++) {
            const slot = this._conveyorSlots[index];
            const frontSlot = this._conveyorSlots[index - 1];
            const limitedProgress = frontSlot ? Math.max(slot.progress, frontSlot.progress - MIN_SLOT_GAP) : 1;
            const nextProgress = Math.min(limitedProgress, slot.progress + step);

            slot.progress = Math.max(slot.progress, Math.min(1, nextProgress));

            const workpiece = context.getWorkpiece(slot.workpieceId);

            workpiece?.moveToPosition(getWorkpieceOnBeltPosition(
                context.conveyor,
                slot.progress,
                workpiece?.workpieceType ?? 'box'
            ));
        }

        this._collectArrivedSlots(context);
    }

    private _collectArrivedSlots(context: PipelineTickContext): void {
        const remainingSlots: PipelineSlot[] = [];

        this._conveyorSlots.forEach(slot => {
            if (slot.progress < 1) {
                remainingSlots.push(slot);

                return;
            }

            if (this._exitQueue.length > 0 || this._unloaderTask) {
                slot.progress = 1 - MIN_SLOT_GAP;
                remainingSlots.push(slot);
                this._blockedReason = this._unloaderTask ? 'unloader_busy' : 'conveyor_exit_occupied';

                return;
            }

            const workpiece = context.getWorkpiece(slot.workpieceId);

            workpiece?.setState('arrived');
            workpiece?.setLocation('conveyor_exit');
            workpiece?.moveToPosition(getWorkpieceOnBeltPosition(
                context.conveyor,
                1,
                workpiece?.workpieceType ?? 'box'
            ));
            this._exitQueue.push(slot.workpieceId);
        });

        this._conveyorSlots = remainingSlots;
    }

    private _tryStartLoader(context: PipelineTickContext): void {
        if (this._loaderTask || this._warehouseQueue.length === 0) return;
        if (context.loader?.status === 'busy') {
            this._blockedReason = 'loader_busy';

            return;
        }

        const blockReason = this._getEntryBlockReason(context);

        // 入口被占用或容量满时，工件留在仓库排队；这不是出口阻塞，不暂停传送带。
        if (blockReason !== 'none') return;

        const workpieceId = this._warehouseQueue.shift();

        if (workpieceId === undefined) return;

        const workpiece = context.getWorkpiece(workpieceId);
        const from = workpiece?.getPositionTuple() ?? getWarehousePosition(0);

        workpiece?.setState('loading');
        workpiece?.setLocation('loader_01');
        context.loader?.setStatus('busy');
        this._loaderTask = {
            workpieceId,
            elapsed: 0,
            duration: this._loaderDuration,
            from,
            to: getWorkpieceOnBeltPosition(context.conveyor, 0, workpiece?.workpieceType ?? 'box')
        };
    }

    private _tryStartUnloader(context: PipelineTickContext): void {
        if (this._unloaderTask || this._exitQueue.length === 0) return;
        if (context.unloader?.status === 'busy') {
            this._blockedReason = 'unloader_busy';

            return;
        }

        if (this._worktableTask) {
            this._blockedReason = 'worktable_busy';

            return;
        }

        const workpieceId = this._exitQueue.shift();

        if (workpieceId === undefined) return;

        const workpiece = context.getWorkpiece(workpieceId);

        workpiece?.setState('unloading');
        workpiece?.setLocation('unloader_01');
        context.unloader?.setStatus('busy');
        this._unloaderTask = {
            workpieceId,
            elapsed: 0,
            duration: this._unloaderDuration,
            from: workpiece?.getPositionTuple() ?? context.conveyor.endPoint,
            to: PIPELINE_LAYOUT.worktablePoint
        };
    }

    private _layoutWarehouseQueue(context: PipelineTickContext): void {
        this._warehouseQueue.forEach((workpieceId, index) => {
            const workpiece = context.getWorkpiece(workpieceId);

            if (!workpiece || workpiece.state !== 'waiting') return;
            workpiece.moveToPosition(getWarehousePosition(index));
        });
    }

    private _getEntryBlockReason(context: PipelineTickContext): PipelineBlockedReason {
        if (this._conveyorSlots.length >= context.conveyor.capacity) return 'conveyor_full';
        if (this._loaderTask) return 'loader_busy';
        if (this._conveyorSlots.some(slot => slot.progress <= ENTRY_CLEAR_PROGRESS)) return 'conveyor_entry_occupied';

        return 'none';
    }

    private _getExitBlockReason(): PipelineBlockedReason {
        if (this._exitQueue.length === 0) return 'none';
        if (this._worktableTask) return 'worktable_busy';
        if (this._unloaderTask) return 'unloader_busy';

        return 'conveyor_exit_occupied';
    }

    private _finalizeStatus(context: PipelineTickContext): void {
        const externalWaitingCount = context.getWarehouseWaitingIds?.().length ?? 0;
        const isCompleted = externalWaitingCount === 0
            && this._warehouseQueue.length === 0
            && this._conveyorSlots.length === 0
            && this._exitQueue.length === 0
            && !this._loaderTask
            && !this._unloaderTask
            && !this._worktableTask;

        if (isCompleted) {
            this._status = 'completed';
            this._blockedReason = 'none';
            context.conveyor.setStatus('stopped');
            context.loader?.setStatus('idle');
            context.unloader?.setStatus('idle');

            return;
        }

        if (this._blockedReason !== 'none') {
            this._status = 'blocked';
            context.conveyor.setStatus('blocked');

            return;
        }

        this._status = 'running';
        context.conveyor.setStatus('running');
    }

    private _syncGeometryMeta(): void {
        this.geometry = {
            id: this._businessId,
            conveyorId: this._conveyorId,
            workpieceIds: this.workpieceIds,
            status: this._status,
            currentTime: this._currentTime,
            loaderDuration: this._loaderDuration,
            unloaderDuration: this._unloaderDuration,
            worktableDuration: this._worktableDuration
        };
    }
}

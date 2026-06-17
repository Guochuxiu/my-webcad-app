import { FSCore } from '@fs/cadnginx';
import type { PipelinePoint } from '../pipeline';

export type WorktableStatus = 'idle' | 'busy';

export interface WorktableMeta {
    id: string;
    position: PipelinePoint;
    size: PipelinePoint;
    status?: WorktableStatus;
}

/**
 * 工作台实体只保存业务语义和布局数据，真实 Three.js 显示由 WorktableDisplay 负责。
 */
export class WorktableEntity extends FSCore.Model.CADEntity<WorktableMeta> {
    private _businessId: string;
    private _worktablePosition: PipelinePoint;
    private _size: PipelinePoint;
    private _status: WorktableStatus;

    constructor(meta: WorktableMeta) {
        super(meta);
        this._businessId = meta.id;
        this._worktablePosition = this._clonePoint(meta.position);
        this._size = this._clonePoint(meta.size);
        this._status = meta.status ?? 'idle';
        this.shouldPickParent = false;
        this._syncGeometryMeta();
    }

    public get businessId(): string {
        return this._businessId;
    }

    public get worktablePosition(): PipelinePoint {
        return this._clonePoint(this._worktablePosition);
    }

    public get size(): PipelinePoint {
        return this._clonePoint(this._size);
    }

    public get status(): WorktableStatus {
        return this._status;
    }

    public setStatus(status: WorktableStatus): void {
        if (this._status === status) return;

        this._status = status;
        this._syncGeometryMeta();
        this.dirtyMaterial();
        this.dirty();
    }

    public setLayout(position: PipelinePoint, size: PipelinePoint): void {
        this._worktablePosition = this._clonePoint(position);
        this._size = this._clonePoint(size);
        this._syncGeometryMeta();
        this.dirtyGeometry();
        this.dirty();
    }

    private _syncGeometryMeta(): void {
        this.geometry = {
            id: this._businessId,
            position: this.worktablePosition,
            size: this.size,
            status: this._status
        };
    }

    private _clonePoint(point: PipelinePoint): PipelinePoint {
        return [point[0], point[1], point[2]];
    }
}

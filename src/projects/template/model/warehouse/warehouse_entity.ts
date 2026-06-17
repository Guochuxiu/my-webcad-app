import { FSCore } from '@fs/cadnginx';
import type { PipelinePoint } from '../pipeline';

export type WarehouseStatus = 'idle' | 'has_workpieces';

export interface WarehouseMeta {
    id: string;
    position: PipelinePoint;
    size: PipelinePoint;
    status?: WarehouseStatus;
}

/**
 * 仓库区域实体只表达仓库底板和状态，不直接持有或移动工件。
 * 工件仍由 SimpleWorkpiece 管理，仓库排队关系通过 location/state 体现。
 */
export class WarehouseEntity extends FSCore.Model.CADEntity<WarehouseMeta> {
    private _businessId: string;
    private _warehousePosition: PipelinePoint;
    private _size: PipelinePoint;
    private _status: WarehouseStatus;

    constructor(meta: WarehouseMeta) {
        super(meta);
        this._businessId = meta.id;
        this._warehousePosition = this._clonePoint(meta.position);
        this._size = this._clonePoint(meta.size);
        this._status = meta.status ?? 'idle';
        this.shouldPickParent = false;
        this._syncGeometryMeta();
    }

    public get businessId(): string {
        return this._businessId;
    }

    public get warehousePosition(): PipelinePoint {
        return this._clonePoint(this._warehousePosition);
    }

    public get size(): PipelinePoint {
        return this._clonePoint(this._size);
    }

    public get status(): WarehouseStatus {
        return this._status;
    }

    public setStatus(status: WarehouseStatus): void {
        if (this._status === status) return;

        this._status = status;
        this._syncGeometryMeta();
        this.dirtyMaterial();
        this.dirty();
    }

    public setLayout(position: PipelinePoint, size: PipelinePoint): void {
        this._warehousePosition = this._clonePoint(position);
        this._size = this._clonePoint(size);
        this._syncGeometryMeta();
        this.dirtyGeometry();
        this.dirty();
    }

    private _syncGeometryMeta(): void {
        this.geometry = {
            id: this._businessId,
            position: this.warehousePosition,
            size: this.size,
            status: this._status
        };
    }

    private _clonePoint(point: PipelinePoint): PipelinePoint {
        return [point[0], point[1], point[2]];
    }
}

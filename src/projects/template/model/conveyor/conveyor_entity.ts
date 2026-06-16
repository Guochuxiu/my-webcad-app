import { FSCore } from '@fs/cadnginx';

export type ConveyorStatus = 'idle' | 'running' | 'stopped';
export type ConveyorPoint = [number, number, number];

export interface ConveyorMeta {
    id: string;
    startPoint: ConveyorPoint;
    endPoint: ConveyorPoint;
    speed: number;
    capacity: number;
    status?: ConveyorStatus;
}

export const DEFAULT_CONVEYOR_META: ConveyorMeta = {
    id: 'conveyor_01',
    startPoint: [0, 0, 0],
    endPoint: [800, 0, 0],
    speed: 100,
    capacity: 2,
    status: 'idle'
};

/**
 * 传送带设备实体。
 *
 * 这里保存设备的业务数据和运行状态，显示对象由 ConveyorDisplay 创建。
 */
export class ConveyorEntity extends FSCore.Model.CADEntity<ConveyorMeta> {
    private _conveyorId: string;
    private _startPoint: ConveyorPoint;
    private _endPoint: ConveyorPoint;
    private _speed: number;
    private _capacity: number;
    private _status: ConveyorStatus;

    constructor(meta: ConveyorMeta = DEFAULT_CONVEYOR_META) {
        super(meta);
        this._conveyorId = meta.id;
        this._startPoint = this._clonePoint(meta.startPoint);
        this._endPoint = this._clonePoint(meta.endPoint);
        this._speed = meta.speed;
        this._capacity = meta.capacity;
        this._status = meta.status ?? 'idle';
        this.shouldPickParent = false;
        this._syncGeometryMeta();
    }

    public get conveyorId(): string {
        return this._conveyorId;
    }

    public get startPoint(): ConveyorPoint {
        return this._clonePoint(this._startPoint);
    }

    public get endPoint(): ConveyorPoint {
        return this._clonePoint(this._endPoint);
    }

    public get speed(): number {
        return this._speed;
    }

    public get capacity(): number {
        return this._capacity;
    }

    public get status(): ConveyorStatus {
        return this._status;
    }

    public get direction(): ConveyorPoint {
        const [sx, sy, sz] = this._startPoint;
        const [ex, ey, ez] = this._endPoint;
        const dx = ex - sx;
        const dy = ey - sy;
        const dz = ez - sz;
        const length = Math.hypot(dx, dy, dz);

        if (length === 0) {
            return [0, 0, 0];
        }

        return [dx / length, dy / length, dz / length];
    }

    public get length(): number {
        const [sx, sy, sz] = this._startPoint;
        const [ex, ey, ez] = this._endPoint;

        return Math.hypot(ex - sx, ey - sy, ez - sz);
    }

    public start(): void {
        this.setStatus('running');
    }

    public stop(): void {
        this.setStatus('stopped');
    }

    public setStatus(status: ConveyorStatus): void {
        if (this._status === status) return;

        this._status = status;
        this._syncGeometryMeta();
        this.dirtyMaterial();
        this.dirty();
    }

    public setEndpoints(startPoint: ConveyorPoint, endPoint: ConveyorPoint): void {
        this._startPoint = this._clonePoint(startPoint);
        this._endPoint = this._clonePoint(endPoint);
        this._syncGeometryMeta();
        this.dirtyGeometry();
    }

    public setRuntimeData(speed: number, capacity: number): void {
        this._speed = speed;
        this._capacity = capacity;
        this._syncGeometryMeta();
        this.dirtyMaterial();
    }

    private _syncGeometryMeta(): void {
        this.geometry = {
            id: this._conveyorId,
            startPoint: this.startPoint,
            endPoint: this.endPoint,
            speed: this._speed,
            capacity: this._capacity,
            status: this._status
        };
    }

    private _clonePoint(point: ConveyorPoint): ConveyorPoint {
        return [point[0], point[1], point[2]];
    }
}

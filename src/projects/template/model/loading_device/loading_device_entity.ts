import { FSCore } from '@fs/cadnginx';
import type { ConveyorPoint } from '../conveyor';

export type LoadingDeviceKind = 'loader' | 'unloader';
export type LoadingDeviceStatus = 'idle' | 'busy';

export interface LoadingDeviceMeta {
    id: string;
    kind: LoadingDeviceKind;
    position: ConveyorPoint;
    targetPoint: ConveyorPoint;
    status?: LoadingDeviceStatus;
}

/**
 * 上料/下料装置业务实体。
 * 这里只保存设备状态和空间点位，真实 Three.js 对象由 LoadingDeviceDisplay 创建。
 */
export class LoadingDeviceEntity extends FSCore.Model.CADEntity<LoadingDeviceMeta> {
    private _deviceId: string;
    private _kind: LoadingDeviceKind;
    private _devicePosition: ConveyorPoint;
    private _targetPoint: ConveyorPoint;
    private _status: LoadingDeviceStatus;

    constructor(meta: LoadingDeviceMeta) {
        super(meta);
        this._deviceId = meta.id;
        this._kind = meta.kind;
        this._devicePosition = this._clonePoint(meta.position);
        this._targetPoint = this._clonePoint(meta.targetPoint);
        this._status = meta.status ?? 'idle';
        this.shouldPickParent = false;
        this._syncGeometryMeta();
    }

    public get deviceId(): string {
        return this._deviceId;
    }

    public get kind(): LoadingDeviceKind {
        return this._kind;
    }

    public get devicePosition(): ConveyorPoint {
        return this._clonePoint(this._devicePosition);
    }

    public get targetPoint(): ConveyorPoint {
        return this._clonePoint(this._targetPoint);
    }

    public get status(): LoadingDeviceStatus {
        return this._status;
    }

    public setStatus(status: LoadingDeviceStatus): void {
        if (this._status === status) return;

        this._status = status;
        this._syncGeometryMeta();
        this.dirtyMaterial();
        this.dirty();
    }

    public setPoints(position: ConveyorPoint, targetPoint: ConveyorPoint): void {
        this._devicePosition = this._clonePoint(position);
        this._targetPoint = this._clonePoint(targetPoint);
        this._syncGeometryMeta();
        this.dirtyGeometry();
        this.dirty();
    }

    private _syncGeometryMeta(): void {
        this.geometry = {
            id: this._deviceId,
            kind: this._kind,
            position: this.devicePosition,
            targetPoint: this.targetPoint,
            status: this._status
        };
    }

    private _clonePoint(point: ConveyorPoint): ConveyorPoint {
        return [point[0], point[1], point[2]];
    }
}

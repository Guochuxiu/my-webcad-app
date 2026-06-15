import { FSCore } from '@fs/cadnginx';

export type WorkpieceType = 'box' | 'cylinder';
export type WorkpieceState = 'waiting' | 'processing' | 'done';

export interface WorkpieceFeaturePoint {
    id: string;
    name: string;
    position: [number, number, number];
}

export interface WorkpieceFeatureLine {
    id: string;
    name: string;
    from: string;
    to: string;
}

export interface WorkpieceFeatureFace {
    id: string;
    name: string;
    pointIds: string[];
}

export interface WorkpieceFeatures {
    points: WorkpieceFeaturePoint[];
    lines: WorkpieceFeatureLine[];
    faces: WorkpieceFeatureFace[];
}

export interface SimpleWorkpieceMeta {
    type: WorkpieceType;
    state?: WorkpieceState;
    location?: string;
    features: WorkpieceFeatures;
}

/**
 * 简单工件的业务实体。
 *
 * 这里继承 Group，是因为工件本身是一个“数字孪生对象”容器：
 * - 父实体保存类型、状态、库位和特征清单等业务语义；
 * - 子实体保存主体网格、特征线、特征点等可显示几何。
 *
 * 这样工件可以进入 WebCAD 的 document/entity/display 链路，
 * 而不是把裸 Three.js 对象直接塞进 scene。
 */
export class SimpleWorkpiece extends FSCore.Model.Group {
    public readonly workpieceType: WorkpieceType;
    private _state: WorkpieceState;
    private _location: string;
    private _features: WorkpieceFeatures;

    constructor(meta: SimpleWorkpieceMeta) {
        super();
        this.workpieceType = meta.type;
        this._state = meta.state ?? 'waiting';
        this._location = meta.location ?? 'warehouse_01';
        this._features = meta.features;
    }

    public get state(): WorkpieceState {
        return this._state;
    }

    public get location(): string {
        return this._location;
    }

    public get features(): WorkpieceFeatures {
        return this._features;
    }

    public setState(state: WorkpieceState): void {
        if (this._state === state) return;
        this._state = state;
        // 状态影响材质或颜色表现，触发材质 dirty 让 Display 有机会刷新外观。
        this.dirtyMaterial();
    }

    public setLocation(location: string): void {
        if (this._location === location) return;
        this._location = location;
        // 库位变化通常对应空间语义变化，先用 position dirty 标记位置相关刷新。
        this.dirtyPosition();
    }

    public setFeatures(features: WorkpieceFeatures): void {
        this._features = features;
        // 特征点/线/面变化会影响几何展示，需要触发几何 dirty。
        this.dirtyGeometry();
    }
}

import { FSCore } from '@fs/cadnginx';

export type WorkpieceType = 'box' | 'cylinder';
export type WorkpieceState = 'waiting' | 'loading' | 'moving' | 'arrived' | 'unloading' | 'processing' | 'done';

export const WORKPIECE_LINE_COLOR = 0x1f2937;
export const WORKPIECE_SELECTED_LINE_COLOR = 0xff7a18;

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
 * 父级 Group 保存类型、状态、库位和特征清单；子实体保存主体网格、特征线和特征点。
 * 这样工件通过 WebCAD document/entity/display 链路渲染和拾取，不直接向 scene 添加 Three.js 对象。
 */
export class SimpleWorkpiece extends FSCore.Model.Group {
    public readonly workpieceType: WorkpieceType;
    private _state: WorkpieceState;
    private _location: string;
    private _features: WorkpieceFeatures;
    private _remaining = 0;
    private _selected = false;

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

    public get remaining(): number {
        return this._remaining;
    }

    public get selected(): boolean {
        return this._selected;
    }

    public getPositionTuple(): [number, number, number] {
        return [this.position.x, this.position.y, this.position.z];
    }

    public setState(state: WorkpieceState): void {
        if (this._state === state) return;

        this._state = state;
        this.dirtyMaterial();
    }

    public setRemaining(remaining: number): void {
        const nextRemaining = Math.max(0, remaining);

        if (Math.abs(this._remaining - nextRemaining) < 0.001) return;

        this._remaining = nextRemaining;
        this.dirtyMaterial();
    }

    public setSelected(selected: boolean): void {
        if (this._selected === selected) return;

        this._selected = selected;
        this._syncLineHighlight();
        this.dirtyMaterial();
        this.dirty();
    }

    public moveToPosition(position: [number, number, number]): void {
        this.setPosition(position[0], position[1], position[2]);
        this.dirtyPosition();
        this.dirty();
        this.forEachChild(child => {
            child.dirtyPosition();
            child.dirty();
        });
    }

    public setLocation(location: string): void {
        if (this._location === location) return;

        this._location = location;
        this.dirtyPosition();
    }

    public setFeatures(features: WorkpieceFeatures): void {
        this._features = features;
        this.dirtyGeometry();
    }

    private _syncLineHighlight(): void {
        const color = this._selected ? WORKPIECE_SELECTED_LINE_COLOR : WORKPIECE_LINE_COLOR;

        this.forEachChild(child => {
            if (child instanceof FSCore.Model.BatchLine) {
                child.color = color;
                child.dirtyMaterial();
                child.dirtyGeometry();
            }
            child.dirty();
        });
    }
}

import { Model } from '@fs/cadnginx';
import * as THREE from 'three';
import { EntityState, ENTITY_STATE } from '../constants/entity_state';

/**
 * ses场景节点
 */
export class SesNodeEntity extends Model.ObjectNode {
    public meshMaterial: THREE.Material;
    public lineMaterial: THREE.Material;
    public canPick: boolean = true;

    /** 实体状态标识 */
    private _entityState: EntityState = ENTITY_STATE.ACTIVE;
    /** 线可见性控制 */
    private _lineVisible: boolean = true;
    /** 面透明度开关 */
    private _faceTransparencyEnabled: boolean = false;
    /** 面透明度 */
    private _faceOpacity: number = 0.2;

    /** 获取实体状态 */
    public get entityState(): EntityState {
        return this._entityState;
    }

    /** 获取线可见性 */
    public get lineVisible(): boolean {
        return this._lineVisible;
    }

    /** 获取面透明度开关 */
    public get faceTransparencyEnabled(): boolean {
        return this._faceTransparencyEnabled;
    }

    /** 获取面透明度 */
    public get faceOpacity(): number {
        return this._faceOpacity;
    }

    /**
     * 设置实体状态
     * @param state 状态值
     */
    public setEntityState(state: EntityState): void {
        if (this._entityState !== state) {
            this._entityState = state;
            this.dirtyMaterial();
        }
    }

    /**
     * 设置线可见性
     * @param visible 是否可见
     */
    public setLineVisible(visible: boolean): void {
        if (this._lineVisible !== visible) {
            this._lineVisible = visible;
            this.dirtyGeometry();
        }
    }

    /**
     * 设置面透明度
     * @param enabled 是否启用透明
     * @param opacity 透明度，默认 0.2
     */
    public setFaceTransparency(enabled: boolean, opacity: number = 0.2): void {
        if (this._faceTransparencyEnabled === enabled && this._faceOpacity === opacity) {
            return;
        }

        this._faceTransparencyEnabled = enabled;
        this._faceOpacity = opacity;
        this.dirtyMaterial();
    }

    /**
     * 清除面透明度
     */
    public clearFaceTransparency(): void {
        this.setFaceTransparency(false);
    }
}

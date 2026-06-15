import { Display } from '@fs/cadnginx';
import * as THREE from 'three';
import { SesNodeEntity } from '@/common/model';
import { ENTITY_STATE } from '@/common/constants/entity_state';
import type { Base3DCanvas } from '@/common/core/base_3d_canvas';

/** 状态材质配置接口 */
export interface StateMaterialConfig {
    color: number;
    metalness: number;
    roughness: number;
    transparent: boolean;
    opacity: number;
}

export class SesNodeDisplay extends Display.ObjectNodeDisplay<SesNodeEntity> {
    /** 线段对象引用 */
    private _lineSegments: THREE.LineSegments | null = null;
    /** 当前透明派生材质（per-display 运行时覆盖） */
    private _transparentMaterial: THREE.Material | null = null;

    protected _createViewObj(): THREE.Object3D<THREE.Object3DEventMap> {
        if (!(this.entity.geometry instanceof THREE.Mesh)) {
            return this.entity.geometry;
        }

        // 创建线
        if (this.entity.lineMaterial) {
            const outLine = new THREE.EdgesGeometry(this.entity.geometry.geometry, 60);
            const lineMaterial = (this.entity.lineMaterial as THREE.LineBasicMaterial).clone();
            lineMaterial.transparent = true;
            lineMaterial.opacity = 0.4;
            this._lineSegments = new THREE.LineSegments(outLine, lineMaterial);
            this.entity.geometry.add(this._lineSegments);
        }

        // 应用初始材质
        this._applyMaterial();

        return this.entity.geometry;
    }

    protected _onMaterialDirty(): void {
        this._applyMaterial();
    }

    protected _onGeometryDirty(): void {
        // 更新线可见性
        if (this._lineSegments) {
            this._lineSegments.visible = this.entity.lineVisible;
        }
    }

    /**
     * 应用材质到 Mesh
     * 从 canvas 的 StateMaterialProvider 获取状态材质
     */
    private _applyMaterial(): void {
        if (!(this.entity.geometry instanceof THREE.Mesh)) return;

        const state = this.entity.entityState;
        let baseMaterial: THREE.Material | undefined;

        if (state === ENTITY_STATE.ACTIVE && this.entity.meshMaterial) {
            // ACTIVE 状态使用原始材质
            baseMaterial = this.entity.meshMaterial;
        } else {
            // 其他状态从 Provider 获取
            const canvas = this.canvas as Base3DCanvas;
            const provider = canvas.materialProvider;

            if (provider) {
                baseMaterial = provider.getMaterial(state);
            }

            // Provider 没有配置则回退到原始材质
            if (!baseMaterial) {
                baseMaterial = this.entity.meshMaterial;
            }
        }

        if (baseMaterial) {
            const finalMaterial = this._getFinalMeshMaterial(baseMaterial);
            this.entity.geometry.material = finalMaterial;
        }
    }

    /**
     * 获取最终面材质（叠加透明度覆盖）
     */
    private _getFinalMeshMaterial(baseMaterial: THREE.Material): THREE.Material {
        if (!this.entity.faceTransparencyEnabled) {
            this._disposeTransparentMaterial();

            return baseMaterial;
        }

        this._disposeTransparentMaterial();
        const material = baseMaterial.clone();
        material.transparent = true;
        material.opacity = this.entity.faceOpacity;
        this._transparentMaterial = material;

        return material;
    }

    /**
     * 释放当前透明派生材质
     */
    private _disposeTransparentMaterial(): void {
        if (!this._transparentMaterial) {
            return;
        }

        this._transparentMaterial.dispose();
        this._transparentMaterial = null;
    }

    /**
     * 销毁时清理资源
     */
    public onCleanup(): void {
        this._disposeTransparentMaterial();
        if (this._lineSegments) {
            (this._lineSegments.material as THREE.Material).dispose();
            this._lineSegments = null;
        }
        super.onCleanup();
    }
}

import * as THREE from 'three';
import { StateMaterialConfig } from './ses_node_display';

/**
 * 状态材质提供者
 * 负责根据 EntityState 创建、缓存和管理材质实例
 *
 * 职责:
 * - 按配置创建 MeshPhysicalMaterial 并缓存
 * - 配置变更时自动失效对应缓存
 * - 集中管理材质生命周期和 dispose
 */
export class StateMaterialProvider {
    /** 状态 -> 材质配置 */
    private _configMap = new Map<string, StateMaterialConfig>();
    /** 状态 -> 缓存的材质实例 */
    private _cache = new Map<string, THREE.MeshPhysicalMaterial>();

    /**
     * 注册状态材质配置
     * @param state 状态标识
     * @param config 材质配置
     */
    public setConfig(state: string, config: StateMaterialConfig): void {
        this._configMap.set(state, config);
    }

    /**
     * 获取状态材质配置
     */
    public getConfig(state: string): StateMaterialConfig | undefined {
        return this._configMap.get(state);
    }

    /**
     * 更新状态材质配置并失效对应缓存
     * 用于主题切换等需要动态修改颜色的场景
     */
    public updateConfig(state: string, config: StateMaterialConfig): void {
        this._configMap.set(state, config);
        this._invalidateState(state);
    }

    /**
     * 根据状态获取材质
     * 如果缓存命中直接返回，否则按配置创建并缓存
     * @returns 材质实例，如果没有配置则返回 undefined
     */
    public getMaterial(state: string): THREE.MeshPhysicalMaterial | undefined {
        if (this._cache.has(state)) {
            return this._cache.get(state)!;
        }

        const config = this._configMap.get(state);

        if (!config) {
            return undefined;
        }

        const material = new THREE.MeshPhysicalMaterial({
            color: config.color,
            metalness: config.metalness,
            roughness: config.roughness,
            transparent: config.transparent,
            opacity: config.opacity,
            side: THREE.DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: 4,
            polygonOffsetUnits: 4
        });

        this._cache.set(state, material);

        return material;
    }

    /**
     * 清除全部缓存
     */
    public invalidateAll(): void {
        this._cache.forEach(material => material.dispose());
        this._cache.clear();
    }

    /**
     * 释放所有资源
     */
    public dispose(): void {
        this.invalidateAll();
        this._configMap.clear();
    }

    /**
     * 失效单个状态的缓存
     */
    private _invalidateState(state: string): void {
        const cached = this._cache.get(state);

        if (cached) {
            cached.dispose();
            this._cache.delete(state);
        }
    }
}

import { FSApp } from '@fs/cadnginx';
import * as THREE from 'three';
import { WarehouseEntity } from '../../model/warehouse';

export class WarehouseDisplay extends FSApp.View.Three.ThreeDisplay<WarehouseEntity> {
    private _materials: THREE.Material[] = [];
    private _geometries: THREE.BufferGeometry[] = [];
    private _baseMaterial: THREE.MeshBasicMaterial | null = null;
    private _baseMesh: THREE.Mesh | null = null;
    private _pickGeometry: THREE.BufferGeometry | null = null;
    private _pickMaterial: THREE.Material | null = null;

    protected _createViewObj(): THREE.Object3D {
        const root = new THREE.Group();
        const [width, height, depth] = this.entity.size;
        const [x, y, z] = this.entity.warehousePosition;

        const geometry = this._trackGeometry(new THREE.BoxGeometry(width, height, depth));
        const mesh = new THREE.Mesh(geometry, this._getBaseMaterial());

        mesh.position.set(x, y, z);
        this._baseMesh = mesh;
        root.add(mesh);
        this._applyStatusStyle();

        return root;
    }

    public createPickObject(): THREE.Object3D | undefined {
        this._disposePickResources();

        const [width, height, depth] = this.entity.size;
        const [x, y, z] = this.entity.warehousePosition;

        this._pickGeometry = new THREE.BoxGeometry(width, height, depth + 4);
        this._pickMaterial = new THREE.MeshBasicMaterial({
            color: this._getPickColor(),
            side: THREE.DoubleSide
        });

        const pickMesh = new THREE.Mesh(this._pickGeometry, this._pickMaterial);

        pickMesh.position.set(x, y, z);
        pickMesh.frustumCulled = false;

        return pickMesh;
    }

    protected _onGeometryDirty(): void {
        super._onGeometryDirty();
        this._rebuildViewObject();
        this._syncPickObject();
    }

    protected _onMaterialDirty(): void {
        super._onMaterialDirty();
        this._applyStatusStyle();
    }

    public onCleanup(): void {
        this._materials.forEach(material => material.dispose());
        this._geometries.forEach(geometry => geometry.dispose());
        this._disposePickResources();
        this._materials = [];
        this._geometries = [];
        this._baseMaterial = null;
        this._baseMesh = null;
        super.onCleanup();
    }

    private _rebuildViewObject(): void {
        const viewObj = this.viewObj;

        viewObj.clear();
        this._materials.forEach(material => material.dispose());
        this._geometries.forEach(geometry => geometry.dispose());
        this._materials = [];
        this._geometries = [];
        this._baseMaterial = null;
        this._baseMesh = null;

        const rebuilt = this._createViewObj();
        [...rebuilt.children].forEach(child => viewObj.add(child));
    }

    private _syncPickObject(): void {
        if (!(this._pickObj instanceof THREE.Mesh)) return;

        const [x, y, z] = this.entity.warehousePosition;

        this._pickObj.position.set(x, y, z);
    }

    private _applyStatusStyle(): void {
        if (!this._baseMaterial) return;

        this._baseMaterial.color.set(this.entity.status === 'has_workpieces' ? 0x64748b : 0x94a3b8);
        this._baseMaterial.opacity = this.entity.status === 'has_workpieces' ? 0.28 : 0.18;
    }

    private _getBaseMaterial(): THREE.MeshBasicMaterial {
        if (this._baseMaterial) return this._baseMaterial;

        this._baseMaterial = new THREE.MeshBasicMaterial({
            color: 0x94a3b8,
            transparent: true,
            opacity: 0.22,
            side: THREE.DoubleSide,
            depthTest: true
        });
        this._materials.push(this._baseMaterial);

        return this._baseMaterial;
    }

    private _disposePickResources(): void {
        this._pickGeometry?.dispose();
        this._pickMaterial?.dispose();
        this._pickGeometry = null;
        this._pickMaterial = null;
    }

    private _getPickColor(): THREE.Color {
        const id = this.entity.id;
        const r = (id >> 16) & 255;
        const g = (id >> 8) & 255;
        const b = id & 255;

        return new THREE.Color(r / 255, g / 255, b / 255);
    }

    private _trackGeometry<T extends THREE.BufferGeometry>(geometry: T): T {
        this._geometries.push(geometry);

        return geometry;
    }
}

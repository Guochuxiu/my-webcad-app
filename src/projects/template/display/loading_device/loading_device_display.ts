import { FSApp } from '@fs/cadnginx';
import * as THREE from 'three';
import { LoadingDeviceEntity, LoadingDeviceStatus } from '../../model/loading_device';

const BASE_SIZE = 42;
const ARM_RADIUS = 5;
const ARM_HEIGHT = 72;

export class LoadingDeviceDisplay extends FSApp.View.Three.ThreeDisplay<LoadingDeviceEntity> {
    private _materials: THREE.Material[] = [];
    private _geometries: THREE.BufferGeometry[] = [];
    private _bodyMaterial: THREE.MeshBasicMaterial | null = null;
    private _lineMaterial: THREE.LineBasicMaterial | null = null;
    private _pickGeometry: THREE.BufferGeometry | null = null;
    private _pickMaterial: THREE.Material | null = null;

    protected _createViewObj(): THREE.Object3D {
        const root = new THREE.Group();
        const position = this._toVector(this.entity.devicePosition);
        const target = this._toVector(this.entity.targetPoint);

        const base = this._createBox(BASE_SIZE, BASE_SIZE, 10);
        base.position.copy(position);
        base.position.z -= 5;
        root.add(base);

        const mast = this._createCylinder(ARM_RADIUS, ARM_HEIGHT);
        mast.position.copy(position);
        mast.position.z += ARM_HEIGHT / 2;
        root.add(mast);

        const arm = this._createTargetArm(position, target);
        if (arm) {
            root.add(arm);
        }

        const marker = this._createBox(22, 22, 22);
        marker.position.copy(target);
        root.add(marker);

        this._applyStatusStyle();

        return root;
    }

    public createPickObject(): THREE.Object3D | undefined {
        this._disposePickResources();

        this._pickGeometry = new THREE.BoxGeometry(BASE_SIZE + 18, BASE_SIZE + 18, ARM_HEIGHT + 20);
        this._pickMaterial = new THREE.MeshBasicMaterial({
            color: this._getPickColor(),
            side: THREE.DoubleSide
        });

        const pickMesh = new THREE.Mesh(this._pickGeometry, this._pickMaterial);
        const [x, y, z] = this.entity.devicePosition;

        pickMesh.position.set(x, y, z + ARM_HEIGHT / 2);
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
        this._bodyMaterial = null;
        this._lineMaterial = null;
        super.onCleanup();
    }

    private _rebuildViewObject(): void {
        const viewObj = this.viewObj;

        viewObj.clear();
        this._materials.forEach(material => material.dispose());
        this._geometries.forEach(geometry => geometry.dispose());
        this._materials = [];
        this._geometries = [];
        this._bodyMaterial = null;
        this._lineMaterial = null;

        const rebuilt = this._createViewObj();
        [...rebuilt.children].forEach(child => viewObj.add(child));
    }

    private _createBox(width: number, height: number, depth: number): THREE.Mesh {
        const geometry = this._trackGeometry(new THREE.BoxGeometry(width, height, depth));
        const mesh = new THREE.Mesh(geometry, this._getBodyMaterial());

        return mesh;
    }

    private _createCylinder(radius: number, height: number): THREE.Mesh {
        const geometry = this._trackGeometry(new THREE.CylinderGeometry(radius, radius, height, 16));
        const mesh = new THREE.Mesh(geometry, this._getBodyMaterial());

        mesh.rotateX(Math.PI / 2);

        return mesh;
    }

    private _createTargetArm(from: THREE.Vector3, to: THREE.Vector3): THREE.Line | null {
        const raisedFrom = from.clone().setZ(from.z + ARM_HEIGHT);
        const raisedTo = to.clone().setZ(from.z + ARM_HEIGHT);

        if (raisedFrom.distanceToSquared(raisedTo) === 0) return null;

        const geometry = this._trackGeometry(new THREE.BufferGeometry().setFromPoints([raisedFrom, raisedTo]));
        const line = new THREE.Line(geometry, this._getLineMaterial());

        return line;
    }

    private _syncPickObject(): void {
        if (!(this._pickObj instanceof THREE.Mesh)) return;

        const [x, y, z] = this.entity.devicePosition;

        this._pickObj.position.set(x, y, z + ARM_HEIGHT / 2);
    }

    private _applyStatusStyle(): void {
        const color = this._getStatusColor(this.entity.status);

        this._bodyMaterial?.color.set(color);
        this._lineMaterial?.color.set(color);
        if (this._bodyMaterial) {
            this._bodyMaterial.opacity = this.entity.status === 'busy' ? 0.95 : 0.72;
        }
        if (this._lineMaterial) {
            this._lineMaterial.opacity = this.entity.status === 'busy' ? 0.9 : 0.42;
        }
    }

    private _getStatusColor(status: LoadingDeviceStatus): number {
        if (this.entity.kind === 'loader') {
            return status === 'busy' ? 0xf97316 : 0xf59e0b;
        }

        return status === 'busy' ? 0x0ea5e9 : 0x38bdf8;
    }

    private _getBodyMaterial(): THREE.MeshBasicMaterial {
        if (this._bodyMaterial) return this._bodyMaterial;

        this._bodyMaterial = new THREE.MeshBasicMaterial({
            color: this._getStatusColor(this.entity.status),
            transparent: true,
            opacity: 0.72,
            side: THREE.DoubleSide,
            depthTest: true
        });
        this._materials.push(this._bodyMaterial);

        return this._bodyMaterial;
    }

    private _getLineMaterial(): THREE.LineBasicMaterial {
        if (this._lineMaterial) return this._lineMaterial;

        this._lineMaterial = new THREE.LineBasicMaterial({
            color: this._getStatusColor(this.entity.status),
            transparent: true,
            opacity: 0.42,
            linewidth: 2
        });
        this._materials.push(this._lineMaterial);

        return this._lineMaterial;
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

    private _toVector(point: [number, number, number]): THREE.Vector3 {
        return new THREE.Vector3(point[0], point[1], point[2]);
    }

    private _trackGeometry<T extends THREE.BufferGeometry>(geometry: T): T {
        this._geometries.push(geometry);

        return geometry;
    }
}

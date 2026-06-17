import { FSApp } from '@fs/cadnginx';
import * as THREE from 'three';
import { PipelineEntity, PIPELINE_LAYOUT } from '../../model/pipeline';

const DEVICE_HEIGHT = 18;

export class PipelineDisplay extends FSApp.View.Three.ThreeDisplay<PipelineEntity> {
    private _materials: THREE.Material[] = [];
    private _geometries: THREE.BufferGeometry[] = [];
    private _loaderMesh: THREE.Mesh | null = null;
    private _unloaderMesh: THREE.Mesh | null = null;
    private _blockedMesh: THREE.Mesh | null = null;

    /**
     * Display 只负责把 PipelineEntity 的设备区和阻塞状态画出来。
     * 流程状态仍然保存在 Entity 中，由 Command tick 推进。
     */
    protected _createViewObj(): THREE.Object3D {
        const root = new THREE.Group();

        this._loaderMesh = this._createBox(PIPELINE_LAYOUT.loaderPoint, [90, 90, DEVICE_HEIGHT], 0xf59e0b, 0.52);
        this._unloaderMesh = this._createBox(PIPELINE_LAYOUT.unloaderPoint, [90, 90, DEVICE_HEIGHT], 0x38bdf8, 0.52);
        this._blockedMesh = this._createBox([840, 70, 52], [80, 28, 34], 0xef4444, 0.84);

        root.add(this._loaderMesh, this._unloaderMesh, this._blockedMesh);
        this._applyStatusStyle();

        return root;
    }

    protected _onMaterialDirty(): void {
        super._onMaterialDirty();
        this._applyStatusStyle();
    }

    public onCleanup(): void {
        this._materials.forEach(material => material.dispose());
        this._geometries.forEach(geometry => geometry.dispose());
        this._materials = [];
        this._geometries = [];
        this._loaderMesh = null;
        this._unloaderMesh = null;
        this._blockedMesh = null;
        super.onCleanup();
    }

    private _applyStatusStyle(): void {
        this._setMeshColor(this._loaderMesh, this.entity.loaderStatus === 'busy' ? 0xf97316 : 0xf59e0b);
        this._setMeshColor(this._unloaderMesh, this.entity.unloaderStatus === 'busy' ? 0x0ea5e9 : 0x38bdf8);

        if (this._blockedMesh) {
            this._blockedMesh.visible = this.entity.blockedReason !== 'none';
        }
    }

    private _setMeshColor(mesh: THREE.Mesh | null, color: number): void {
        if (!mesh || !(mesh.material instanceof THREE.MeshBasicMaterial)) return;

        mesh.material.color.set(color);
    }

    private _createBox(
        position: [number, number, number],
        size: [number, number, number],
        color: number,
        opacity: number
    ): THREE.Mesh {
        const geometry = this._trackGeometry(new THREE.BoxGeometry(size[0], size[1], size[2]));
        const material = this._createTrackedMaterial(color, opacity);
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(position[0], position[1], position[2]);

        return mesh;
    }

    private _createTrackedMaterial(color: number, opacity: number): THREE.MeshBasicMaterial {
        const material = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity,
            side: THREE.DoubleSide,
            depthTest: true
        });

        this._materials.push(material);

        return material;
    }

    private _trackGeometry<T extends THREE.BufferGeometry>(geometry: T): T {
        this._geometries.push(geometry);

        return geometry;
    }
}

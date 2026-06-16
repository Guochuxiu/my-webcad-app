import { FSApp } from '@fs/cadnginx';
import * as THREE from 'three';
import { ConveyorEntity, ConveyorStatus } from '../../model/conveyor';

const BELT_WIDTH = 70;
const BELT_THICKNESS = 12;
const MARKER_SIZE = 24;
const ARROW_SIZE = 28;
const ARROW_COUNT = 3;
const ARROW_HEIGHT = 22;

export class ConveyorDisplay extends FSApp.View.Three.ThreeDisplay<ConveyorEntity> {
    private _materials: THREE.Material[] = [];
    private _geometries: THREE.BufferGeometry[] = [];
    private _arrows: THREE.Mesh[] = [];
    private _pickGeometry: THREE.BufferGeometry | null = null;
    private _pickMaterial: THREE.Material | null = null;
    private _frameId: number | null = null;
    private _arrowOffset = 0;

    /**
     * Display 只负责把 ConveyorEntity 渲染出来，不把对象直接加到 scene。
     * 底座会通过 Entity -> Display 注册链把这个 viewObj 挂入视图。
     */
    protected _createViewObj(): THREE.Object3D {
        const root = new THREE.Group();
        const start = this._toVector(this.entity.startPoint);
        const end = this._toVector(this.entity.endPoint);
        const direction = this._getDirectionVector();
        const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const length = Math.max(this.entity.length, 1);

        const beltGeometry = this._trackGeometry(new THREE.BoxGeometry(length, BELT_WIDTH, BELT_THICKNESS));
        const belt = new THREE.Mesh(beltGeometry, this._createTrackedMaterial(0x8fa3b8));
        belt.position.copy(center);
        belt.quaternion.copy(this._getOrientation(direction));
        root.add(belt);

        const startMarker = this._createMarker(0x22c55e);
        startMarker.position.copy(start);
        root.add(startMarker);

        const endMarker = this._createMarker(0xef4444);
        endMarker.position.copy(end);
        root.add(endMarker);

        this._createArrows(root, start, direction, length);
        this._applyStatusStyle();

        return root;
    }

    public createPickObject(): THREE.Object3D | undefined {
        this._disposePickResources();

        this._pickGeometry = new THREE.BoxGeometry(
            Math.max(this.entity.length, 1),
            BELT_WIDTH,
            BELT_THICKNESS + 10
        );
        this._pickMaterial = new THREE.MeshBasicMaterial({
            color: this._getPickColor(),
            side: THREE.DoubleSide
        });

        const pickMesh = new THREE.Mesh(this._pickGeometry, this._pickMaterial);

        pickMesh.frustumCulled = false;
        this._applyTrackTransform(pickMesh);

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
        this._stopFlow();
        this._arrows = [];
        this._materials.forEach(material => material.dispose());
        this._geometries.forEach(geometry => geometry.dispose());
        this._disposePickResources();
        this._materials = [];
        this._geometries = [];
        super.onCleanup();
    }

    private _rebuildViewObject(): void {
        const viewObj = this.viewObj;

        viewObj.clear();
        this._stopFlow();
        this._arrows = [];
        this._materials.forEach(material => material.dispose());
        this._geometries.forEach(geometry => geometry.dispose());
        this._materials = [];
        this._geometries = [];

        const rebuilt = this._createViewObj();
        [...rebuilt.children].forEach(child => viewObj.add(child));
    }

    private _createArrows(root: THREE.Group, start: THREE.Vector3, direction: THREE.Vector3, length: number): void {
        const base = start.clone().addScaledVector(direction, length / (ARROW_COUNT + 1));

        for (let i = 0; i < ARROW_COUNT; i++) {
            const arrow = this._createArrowMesh();
            const distance = ((i + 1) * length) / (ARROW_COUNT + 1);

            arrow.position.copy(base)
                .addScaledVector(direction, distance - length / (ARROW_COUNT + 1))
                .setZ(start.z + ARROW_HEIGHT);
            arrow.quaternion.copy(this._getOrientation(direction));
            this._arrows.push(arrow);
            root.add(arrow);
        }
    }

    private _createMarker(color: number): THREE.Mesh {
        const geometry = this._trackGeometry(new THREE.BoxGeometry(MARKER_SIZE, MARKER_SIZE, MARKER_SIZE));
        const material = this._createTrackedMaterial(color);

        return new THREE.Mesh(geometry, material);
    }

    private _createArrowMesh(): THREE.Mesh {
        const shape = new THREE.Shape();

        shape.moveTo(ARROW_SIZE, 0);
        shape.lineTo(-ARROW_SIZE * 0.45, ARROW_SIZE * 0.42);
        shape.lineTo(-ARROW_SIZE * 0.2, 0);
        shape.lineTo(-ARROW_SIZE * 0.45, -ARROW_SIZE * 0.42);
        shape.lineTo(ARROW_SIZE, 0);

        const geometry = this._trackGeometry(new THREE.ShapeGeometry(shape));
        const material = this._createTrackedMaterial(0xf59e0b);

        return new THREE.Mesh(geometry, material);
    }

    private _applyTrackTransform(object: THREE.Object3D): void {
        const start = this._toVector(this.entity.startPoint);
        const end = this._toVector(this.entity.endPoint);
        const direction = this._getDirectionVector();
        const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

        object.position.copy(center);
        object.quaternion.copy(this._getOrientation(direction));
    }

    private _syncPickObject(): void {
        if (!(this._pickObj instanceof THREE.Mesh)) return;

        this._pickGeometry?.dispose();
        this._pickGeometry = new THREE.BoxGeometry(
            Math.max(this.entity.length, 1),
            BELT_WIDTH,
            BELT_THICKNESS + 10
        );
        this._pickObj.geometry = this._pickGeometry;
        this._applyTrackTransform(this._pickObj);
    }

    private _disposePickResources(): void {
        this._pickGeometry?.dispose();
        this._pickMaterial?.dispose();
        this._pickGeometry = null;
        this._pickMaterial = null;
    }

    private _applyStatusStyle(): void {
        const status = this.entity.status;
        const beltColor = this._getBeltColor(status);
        const arrowColor = status === 'running' ? 0x0ea5e9 : 0x94a3b8;

        this._materials.forEach((material, index) => {
            if (!(material instanceof THREE.MeshBasicMaterial)) return;
            material.color.set(index < 1 ? beltColor : material.color.getHex());
            material.opacity = status === 'running' ? 0.95 : 0.7;
            material.transparent = true;
        });

        this._arrows.forEach(arrow => {
            const material = arrow.material;

            if (material instanceof THREE.MeshBasicMaterial) {
                material.color.set(arrowColor);
                material.opacity = status === 'running' ? 1 : 0.55;
                material.transparent = true;
            }
        });

        if (status === 'running') {
            this._startFlow();
        } else {
            this._stopFlow();
        }
    }

    private _startFlow(): void {
        if (this._frameId !== null) return;

        const tick = () => {
            const start = this._toVector(this.entity.startPoint);
            const direction = this._getDirectionVector();
            const length = Math.max(this.entity.length, 1);
            const spacing = length / (ARROW_COUNT + 1);
            const step = Math.max(this.entity.speed / 30, 1);

            this._arrowOffset = (this._arrowOffset + step) % spacing;

            this._arrows.forEach((arrow, index) => {
                const distance = ((index + 1) * spacing + this._arrowOffset) % length;
                arrow.position.copy(start)
                    .addScaledVector(direction, distance)
                    .setZ(start.z + ARROW_HEIGHT);
            });

            this.canvas.dirty();
            this._frameId = requestAnimationFrame(tick);
        };

        this._frameId = requestAnimationFrame(tick);
    }

    private _stopFlow(): void {
        if (this._frameId === null) return;

        cancelAnimationFrame(this._frameId);
        this._frameId = null;
    }

    private _getBeltColor(status: ConveyorStatus): number {
        if (status === 'running') return 0x38bdf8;
        if (status === 'stopped') return 0x64748b;

        return 0x8fa3b8;
    }

    private _getPickColor(): THREE.Color {
        const id = this.entity.id;
        const r = (id >> 16) & 255;
        const g = (id >> 8) & 255;
        const b = id & 255;

        return new THREE.Color(r / 255, g / 255, b / 255);
    }

    private _getDirectionVector(): THREE.Vector3 {
        const [x, y, z] = this.entity.direction;
        const direction = new THREE.Vector3(x, y, z);

        if (direction.lengthSq() === 0) {
            return new THREE.Vector3(1, 0, 0);
        }

        return direction.normalize();
    }

    private _getOrientation(direction: THREE.Vector3): THREE.Quaternion {
        const source = new THREE.Vector3(1, 0, 0);

        return new THREE.Quaternion().setFromUnitVectors(source, direction.clone().normalize());
    }

    private _toVector(point: [number, number, number]): THREE.Vector3 {
        return new THREE.Vector3(point[0], point[1], point[2]);
    }

    private _createTrackedMaterial(color: number): THREE.MeshBasicMaterial {
        const material = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.85,
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

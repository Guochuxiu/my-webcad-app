import { FSCore, Model, ResourceManager, Utils } from '@fs/cadnginx';
import { CypWeldCanvas } from '@/projects/cypweld/view/cypweld_canvas';
import { ReverseApp } from '@/sdk/reverse_app';
import { ElLoading, ElMessage } from '@fscut/element-plus';
import axios from 'axios';
import { PointCloud } from '@/sdk';
import { PointCloudSliceDisplay } from '@/sdk/display/point_cloud_slice_display';
import * as THREE from 'three';
import { Text } from 'troika-three-text';
import { materialConfig } from '@/projects/cypweld/config/material_config';
import { SesNodeEntity, SesSceneEntity } from '@/common';
import { WeldSceneEntity } from '@/projects/cypweld/model/weld_scene_entity';
import { PointCloudSlice } from '@/sdk/model/pointcloud';
let sceneBlob;

export const loadScene = async (canvas: CypWeldCanvas, app: ReverseApp, path = '/assets/实验室机型.zip', offset = 0) => {

    if (!sceneBlob) {
        sceneBlob = await fetch(path).then(res => { return res.blob(); });
    }
    const blob = sceneBlob;
    const scene = new WeldSceneEntity();
    await scene.loadSes(blob);
    canvas.addModel(scene);
    const file = await fetch('/寻缝器激光面.zip').then(res => { return res.blob(); });
    const glb = await ResourceManager.loadFromFiles([new File([file], 'scene.ses')]);

    const j6 = Array.from(scene.children).find(e=>e.name === 'Link_ArmJ6');

    glb.nodes.forEach(node => {
        node.geometry.renderOrder = 9999;
        j6.addChild(node);
        node.setFlagOn(FSCore.Model.EntityFlagEnum.unselectable);
        const rotation  = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), Math.PI);
        node.localMatrix = rotation.multiply(new THREE.Matrix4().compose(
            new THREE.Vector3(-1612, 0, 1384),
            new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2 + Math.PI / 24),
            // new THREE.Quaternion(),
            new THREE.Vector3(0.6, 0.6, 0.6)
        ));
    });
    canvas.dirty();
    const box = canvas.getDisplayByID(scene.id).boundingBox;
    const size = box.max.x - box.min.x + 5000;
    const file1 = await fetch('/assets/场景标签.zip').then(res => { return res.blob(); });
    const glb1 = await ResourceManager.loadFromFiles([new File([file1], 'scene.ses')]);
    glb1.nodes.forEach(node => {
        canvas.addModel(node);
        node.setFlagOn(FSCore.Model.EntityFlagEnum.unselectable);
        node.localMatrix = new THREE.Matrix4().makeTranslation(new THREE.Vector3(
            box.min.x - 1000 + size * offset,
            box.max.y + 1000,
            box.min.z 
        )).scale(new THREE.Vector3(2, 2, 1));
    });
    const grid = createGridHelper(box);
    canvas.scene.add(grid);
    canvas.runInNewFrame(() => {
        
        canvas.fitView();
    });

    // if (offset > 0) {
    
    grid.position.copy(new THREE.Vector3(size * offset, 0, 0));
    // scene.setPosition(new THREE.Vector3(size * offset, 1000, 0));
    // scene.rootLink.setPosition(new THREE.Vector3(size * offset, 0, 0));
    // scene.rootLink.update();
    // }
    window.updateFaceCount();

    return size;

};

/**
 * 用 box3 的地面生成网格和墙壁
 * @param box - 边界框
 * @param padding - 向外扩展的距离，默认100
 */
function createGridHelper(box: THREE.Box3, padding: number = 1000) {
    const grid = new THREE.Group();
    const { min, max } = box;
    
    // 计算尺寸和原点
    const sizeX = max.x - min.x + padding * 2;
    const sizeY = max.y - min.y + padding * 2;
    const originX = min.x - padding;
    const originY = min.y - padding;
    const z = min.z - 2;
    const textureSize = 1000;
    
    // 创建地面
    const planeGeometry = new THREE.BufferGeometry();
    planeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
        originX, originY, z,
        originX + sizeX, originY, z,
        originX + sizeX, originY + sizeY, z,
        originX, originY + sizeY, z
    ]), 3));
    planeGeometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([
        0, 0,
        sizeX / textureSize, 0,
        sizeX / textureSize, sizeY / textureSize,
        0, sizeY / textureSize
    ]), 2));
    planeGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1
    ]), 3));
    planeGeometry.setIndex([0, 1, 2, 0, 2, 3]);
    grid.add(new THREE.Mesh(planeGeometry, materialConfig.ground));
    
    // 创建墙壁
    const wallHeight = max.z - min.z;
    const wallZTop = z + wallHeight;
    const indices = [0, 1, 2, 0, 2, 3];
    
    // 墙壁配置：[顶点坐标, UV重复尺寸, 法线]
    const walls = [
        // 前墙 (Y+)
        [[originX, originY + sizeY, z, originX + sizeX, originY + sizeY, z, originX + sizeX, originY + sizeY, wallZTop, originX, originY + sizeY, wallZTop], sizeX, [0, -1, 0]],
        // 后墙 (Y-)
        [[originX + sizeX, originY, z, originX, originY, z, originX, originY, wallZTop, originX + sizeX, originY, wallZTop], sizeX, [0, 1, 0]],
        // 左墙 (X-)
        [[originX, originY, z, originX, originY + sizeY, z, originX, originY + sizeY, wallZTop, originX, originY, wallZTop], sizeY, [1, 0, 0]],
        // 右墙 (X+)
        [[originX + sizeX, originY + sizeY, z, originX + sizeX, originY, z, originX + sizeX, originY, wallZTop, originX + sizeX, originY + sizeY, wallZTop], sizeY, [-1, 0, 0]],
        // 天花板 (Z+)
        [[originX, originY + sizeY, wallZTop, originX + sizeX, originY + sizeY, wallZTop, originX + sizeX, originY, wallZTop, originX, originY, wallZTop], sizeX, [0, 0, -1]]];
    
    walls.forEach(([vertices, uvSize, normal]) => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices as number[]), 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([
            0, 0,
            (uvSize as number) / textureSize, 0,
            (uvSize as number) / textureSize, wallHeight / textureSize,
            0, wallHeight / textureSize
        ]), 2));
        geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([
            ...(normal as number[]), ...(normal as number[]), ...(normal as number[]), ...(normal as number[])
        ]), 3));
        geometry.setIndex(indices);
        grid.add(new THREE.Mesh(geometry, materialConfig.wall));

        // 添加边框线
        const edgeGeometry = new THREE.BufferGeometry();
        const v = vertices as number[];
        edgeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
            v[0], v[1], v[2], v[3], v[4], v[5],
            v[3], v[4], v[5], v[6], v[7], v[8],
            v[6], v[7], v[8], v[9], v[10], v[11],
            v[9], v[10], v[11], v[0], v[1], v[2]
        ]), 3));
        // grid.add(new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({ 
        //     color: 0x1a1a1a, 
        //     transparent: true, 
        //     opacity: 0.5
        // })));
    });
    window.grid = grid;
    
    return grid;
}

export const loadWorkpiece = async (canvas: CypWeldCanvas, app: ReverseApp, path = '/assets/bin.zip', matrix = new THREE.Matrix4()) => {
    const box = new THREE.Box3();

    try {
        const binZip = await fetch(path).then(r => r.blob());
        const files = await FSCore.Util.unzip(binZip);
        const defaultMatrix = canvas.workbench?.localMatrix || new THREE.Matrix4();

        if (files.length) {
            const file = files[0];
            const buffer = await file.arrayBuffer();
            const entities = await canvas.loadFSCadModel(new Uint8Array(buffer), Model.FeatureLine, Model.FeatureFace, true);
            entities.forEach(entity => {
                entity.localMatrix = matrix.clone().multiply(defaultMatrix);
                canvas.addModel(entity);
                const display = canvas.getDisplayByID(entity.id);
                //@ts-ignore
                box.expandByBox(display.boundingBox);
                entity.dirtyGeometry();
            });
        }
    }catch (error) {
        console.log('🚀 ~ error:', error);
        ElMessage.error('加载失败');
    }

    return box;
};

export const loadPointCloud = async (canvas: CypWeldCanvas, app: ReverseApp, path = '/assets/700W点云.zip') => {
    const loading = ElLoading.service({ lock: true, text: '加载中...', background: 'rgba(255, 255, 255, 0.7)' });

    try {
        await loadPointCloudData(canvas, app, path);
        ElMessage.success('加载成功');
    } catch (error) {
        ElMessage.error('加载失败', error);
    } finally {
        loading.close();
    }
};

let count = 0;

async function loadPointCloudData(view, app, filePath) {
    const datas = await app!.dbManager.getBuffer([filePath]);
    let bufferZip = datas[ 0 ]?.buffer;

    if (!bufferZip) {
        bufferZip = await axios.get(filePath, { responseType: 'blob' }).then(r => r.data);
        app!.dbManager.saveBuffer({ id: filePath, buffer: bufferZip });
    }
    console.time('unzip');
    const files = (await FSCore.Util.unzip(bufferZip!)).filter(file => !file.name.includes('__MACOSX'));
    console.timeEnd('unzip');
    PointCloudSliceDisplay.updateLodParam(15000000 * (count + 1));
    const pointcloud = new PointCloud(count);
    pointcloud.updateColorByDirection(true);
    view.addModel(pointcloud);
    pointcloud.setPosition(0, 0, count * 1000);
    count++;
    let totalPoints = 0;
    await Promise.all(files.map(async (file, index) => {
        const buffer = await file.arrayBuffer();
        await pointcloud.addVoxelizedPointsByBuffer(FSCore.Model.PointCloudSlice, buffer, 200, 200, 200);
    }));
    pointcloud.children.forEach((point: PointCloudSlice) => {
        totalPoints += point.positionView.length / 3;
    });
    // view.fitView();
    (window as any).updatePointCloudCount?.(totalPoints);
}

export async function loadSes(canvas, app, baseUrl: string = '') {
    const url = '/digitaltwin/scene/ses/getFile';
    const res = await axios.post(url, { filePath: 'E:\\workspace\\webcad-weld\\public\\assets\\实验室机型.zip' }, { responseType: 'arraybuffer' }) as any;
    const entity = new SesSceneEntity(res.data);
    canvas.addModel(entity);
}

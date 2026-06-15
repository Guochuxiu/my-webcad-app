<script setup lang="ts">
import { CadApp, FSCore, View } from '@fsdev/cadnginx';
import { onMounted, onUnmounted, ref } from 'vue';

const containerRef = ref<HTMLDivElement>();
let view: View.Cad3DCanvas | null = null;

onMounted(async () => {
    if (!containerRef.value) return;

    // 1. 获取应用实例
    const app = CadApp.getInstance();

    // 2. 创建 3D 视图
    view = await app.addView(containerRef.value, View.Cad3DCanvas, '3d-view', {
        common: {
            backgroundColor: 0x1a1a2e,
            backgroundOpacity: 1,
            useAxes: true  // 显示坐标轴
        },
        camera: {
            orthographic: {
                x: 500,
                y: 500,
                z: 1000,
                up: [0, 0, 1]  // Z 轴向上
            }
        },
        viewCube: {
            visible: true,
            size: 200,
            position: { right: 20, top: 20 }
        },
        orbitControls: {
            lockUp: false  // 允许自由旋转
        }
    });

    // 3. 创建立方体
    const box = createBox(0, 0, 0, 100, 100, 100, 0x4a90d9);
    view.addModel(box);

    // 4. 创建线框
    const wireframe = createWireframe(150, 0, 0, 80, 80, 80, 0xff6b6b);
    view.addModel(wireframe);

    // 5. 适配视图
    view.fitView();
});

onUnmounted(() => {
    const app = CadApp.getInstance();
    app.destroyView('3d-view');
    app.dispose();
    view = null;
});

/**
 * 创建立方体网格
 */
function createBox(
    centerX: number,
    centerY: number,
    centerZ: number,
    width: number,
    height: number,
    depth: number,
    color: number
): FSCore.Model.BatchMesh {
    const halfW = width / 2;
    const halfH = height / 2;
    const halfD = depth / 2;

    // 8 个顶点
    const vertices = [
        // 前面
        centerX - halfW, centerY - halfH, centerZ + halfD,
        centerX + halfW, centerY - halfH, centerZ + halfD,
        centerX + halfW, centerY + halfH, centerZ + halfD,
        centerX - halfW, centerY + halfH, centerZ + halfD,
        // 后面
        centerX - halfW, centerY - halfH, centerZ - halfD,
        centerX + halfW, centerY - halfH, centerZ - halfD,
        centerX + halfW, centerY + halfH, centerZ - halfD,
        centerX - halfW, centerY + halfH, centerZ - halfD,
    ];

    // 6 个面的索引（每个面 2 个三角形）
    const indices = [
        0, 1, 2,  0, 2, 3,    // 前
        4, 6, 5,  4, 7, 6,    // 后
        0, 4, 5,  0, 5, 1,    // 下
        2, 6, 7,  2, 7, 3,    // 上
        0, 3, 7,  0, 7, 4,    // 左
        1, 5, 6,  1, 6, 2     // 右
    ];

    return new FSCore.Model.BatchMesh({
        vertex: vertices,
        vertexIndex: indices,
        color
    });
}

/**
 * 创建线框
 */
function createWireframe(
    centerX: number,
    centerY: number,
    centerZ: number,
    width: number,
    height: number,
    depth: number,
    color: number
): FSCore.Model.BatchLine {
    const halfW = width / 2;
    const halfH = height / 2;
    const halfD = depth / 2;

    // 12 条边
    const vertex: number[] = [];
    const corners = [
        [-halfW, -halfH, -halfD],
        [halfW, -halfH, -halfD],
        [halfW, halfH, -halfD],
        [-halfW, halfH, -halfD],
        [-halfW, -halfH, halfD],
        [halfW, -halfH, halfD],
        [halfW, halfH, halfD],
        [-halfW, halfH, halfD],
    ];

    // 底面 4 条边
    for (let i = 0; i < 4; i++) {
        vertex.push(
            centerX + corners[i][0], centerY + corners[i][1], centerZ + corners[i][2],
            centerX + corners[(i + 1) % 4][0], centerY + corners[(i + 1) % 4][1], centerZ + corners[(i + 1) % 4][2]
        );
    }
    // 顶面 4 条边
    for (let i = 0; i < 4; i++) {
        vertex.push(
            centerX + corners[i + 4][0], centerY + corners[i + 4][1], centerZ + corners[i + 4][2],
            centerX + corners[(i + 1) % 4 + 4][0], centerY + corners[(i + 1) % 4 + 4][1], centerZ + corners[(i + 1) % 4 + 4][2]
        );
    }
    // 竖直 4 条边
    for (let i = 0; i < 4; i++) {
        vertex.push(
            centerX + corners[i][0], centerY + corners[i][1], centerZ + corners[i][2],
            centerX + corners[i + 4][0], centerY + corners[i + 4][1], centerZ + corners[i + 4][2]
        );
    }

    return new FSCore.Model.BatchLine({
        vertex,
        color
    });
}
</script>

<template>
    <div ref="containerRef" class="canvas-container"></div>
</template>

<style scoped>
.canvas-container {
    width: 100%;
    height: 100%;
    position: relative;
}
</style>
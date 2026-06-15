<script setup lang="ts">
import { CadApp, Display, FSCore, View ,FSMath} from '@fsdev/cadnginx';
import { onMounted, onUnmounted, ref } from 'vue';

const containerRef = ref<HTMLDivElement>();
let view: View.Cad2DCanvas | null = null;

onMounted(async () => {
    if (!containerRef.value) return;

    // 1. 获取应用实例
    const app = CadApp.getInstance();

    // 2. 创建 2D 视图
    view = await app.addView(containerRef.value, View.Cad2DCanvas, '2d-view', {
        common: {
            backgroundColor: 0xffffff,
            backgroundOpacity: 1
        },
        camera: {
            orthographic: {
                x: 0,
                y: 0,
                z: 1000,
                up: [0, 1, 0]  // Y 轴向上
            }
        },
        orbitControls: {
            lockUp: true  // 锁定z轴方向
        }
    });

    // 3. 注册显示类型
    view.registerDisplayType(FSCore.Model.BatchLine, entity =>
        view!.createDisplay(entity, Display.BatchLineDisplay)
    );

    // 4. 绘制矩形
    const rect = createRectangle(0, 0, 200, 100, 0x333333);
    view.addModel(rect);

    // 5. 绘制对角线
    const diagonal = createLine([
        -100, -50, 0,
        100, 50, 0
    ], 0xff0000);
    view.addModel(diagonal);

    //6.绘制折线
    const ployline=createPloyLine([
        0, 0, 0,
        50, 30, 0,
        100, 10, 0,
        150, 40, 0,
        200, 20, 0
    ],0x0066cc)
    view.addModel(ployline)

    //7.绘制虚线
    const dashLine=new FSCore.Model.BatchLine({
        vertex:[
            0,0,0,
            200,0,0
        ],
        color:0x666666
    })
    //10：虚线长度，5：间隙宽度
    dashLine.setDashParam(10,5)
    view?.addModel(dashLine)

    
    // 绘制半圆（0 到 180 度）
    const halfArc = createArc(110, 0, 50, 0, Math.PI/2, 0x00cc00);
    view.addModel(halfArc);

    // 绘制整圆（0 到 360 度）
    const circle = createArc(110, 0, 30, 0, Math.PI*1.5, 0xcc0000);
    view.addModel(circle);

    // 绘制 3/4 圆弧
    const threeQuarterArc = createArc(110, 0, 40, 0, Math.PI * 1.5, 0x4a90d9);
    view.addModel(threeQuarterArc);

    // 6. 适配视图
    view.fitView();
});

onUnmounted(() => {
    const app = CadApp.getInstance();
    app.destroyView('2d-view');
    app.dispose();
    view = null;
});

/**
 * 创建矩形线条
 */
function createRectangle(
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    color: number
): FSCore.Model.BatchLine {
    const halfW = width / 2;
    const halfH = height / 2;

    // 闭合矩形：4 条边，5 个点（首尾相连）
    const vertex = [
        centerX - halfW, centerY - halfH, 0,  // 左下
        centerX + halfW, centerY - halfH, 0,  // 右下
        centerX + halfW, centerY + halfH, 0,  // 右上
        centerX - halfW, centerY + halfH, 0,  // 左上
        centerX - halfW, centerY - halfH, 0   // 闭合到左下
    ];

    return new FSCore.Model.BatchLine({
        vertex,
        color
    });
}

/**
 * 创建线条
 */
function createLine(vertex: number[], color: number): FSCore.Model.BatchLine {
    return new FSCore.Model.BatchLine({
        vertex,
        color
    });
}
//创建折线
function createPloyLine(vertex: number[], color: number): FSCore.Model.BatchLine{
    return new FSCore.Model.BatchLine({
        vertex,
        color
    });
}

/**
 * 使用 FSMath.Arc2d 创建圆弧实体
 * @param centerX 圆心 X
 * @param centerY 圆心 Y
 * @param radius 半径
 * @param startAngle 起始角度（弧度）
 * @param endAngle 结束角度（弧度）
 * @param color 颜色
 */
function createArc(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    color: number
): FSCore.Model.BatchLine {
    // 使用 FSMath.Arc2d 创建圆弧几何体
    const arc = FSMath.Arc2d.makeArcByStartEndAngles(
        { x: centerX, y: centerY },
        radius,
        startAngle,
        endAngle,
        true  // 逆时针方向
    );

    // 将圆弧离散化为顶点数据
    // tessellate() 返回 IRenderEdge，其中 edges 是线段数组
    // 每条边的结构为 [[x1, y1, z1], [x2, y2, z2]]（起点和终点坐标）
    const renderData = arc.tessellate();
    const vertex: number[] = [];
    renderData.edges.forEach(edge => {
        // 每条边包含起点 edge[0] 和终点 edge[1]，取每条边的起点
        vertex.push(edge[0][0], edge[0][1], 0);
    });
    // 添加最后一条边的终点
    const lastEdge = renderData.edges[renderData.edges.length - 1];
    vertex.push(lastEdge[1][0], lastEdge[1][1], 0);

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
<template>
    <div class="workpiece-page">
        <div ref="containerRef" class="canvas-host"></div>
        <section class="control-panel">
            <div class="panel-header">
                <span class="panel-title">Simple Workpiece</span>
                <span class="panel-subtitle">Command / Entity / Display</span>
            </div>
            <div class="button-row">
                <button type="button" @click="createWorkpiece('box')">创建立方体</button>
                <button type="button" @click="createWorkpiece('cylinder')">创建圆柱体</button>
                <button type="button" :disabled="!canMoveSelected" @click="moveSelectedWorkpiece">移动到 B 点</button>
            </div>
            <div class="info-panel">
                <div class="info-title">选中工件</div>
                <template v-if="selectedWorkpiece">
                    <dl>
                        <div>
                            <dt>类型</dt>
                            <dd>{{ selectedWorkpiece.workpieceType }}</dd>
                        </div>
                        <div>
                            <dt>状态</dt>
                            <dd>{{ selectedWorkpieceInfo?.state }}</dd>
                        </div>
                        <div>
                            <dt>剩余</dt>
                            <dd>{{ selectedWorkpieceInfo?.remainingText }}</dd>
                        </div>
                        <div>
                            <dt>库位</dt>
                            <dd>{{ selectedWorkpiece.location }}</dd>
                        </div>
                        <div>
                            <dt>特征点</dt>
                            <dd>{{ selectedWorkpiece.features.points.length }}</dd>
                        </div>
                        <div>
                            <dt>特征线</dt>
                            <dd>{{ selectedWorkpiece.features.lines.length }}</dd>
                        </div>
                        <div>
                            <dt>特征面</dt>
                            <dd>{{ selectedWorkpiece.features.faces.length }}</dd>
                        </div>
                    </dl>
                    <div class="feature-list">
                        <div class="feature-title">特征列表</div>
                        <p>{{ featureSummary }}</p>
                    </div>
                </template>
                <p v-else class="empty-text">点击工件本体、特征线或特征点查看数字孪生信息。</p>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { WebcadTemp } from '@/projects/template';
import type { SimpleWorkpiece, WorkpieceMoveProgressEvent, WorkpieceType } from '@/projects/template';
import type { TempViewHandle } from '@/projects/template/view/temp_view_handle';

const VIEW_KEY = 'workpiece-task-2';
const containerRef = ref<HTMLDivElement | null>(null);
const selectedWorkpiece = ref<SimpleWorkpiece | null>(null);
const selectedWorkpieceInfo = ref<{
    state: string;
    remainingText: string;
} | null>(null);

let app: WebcadTemp | null = null;
let viewHandle: TempViewHandle | null = null;
let stopSelectionListen: (() => void) | null = null;
let stopChangeListen: (() => void) | null = null;
let createdCount = 0;

const canMoveSelected = computed(() => {
    return Boolean(selectedWorkpiece.value) && selectedWorkpieceInfo.value?.state === 'waiting';
});

const featureSummary = computed(() => {
    const workpiece = selectedWorkpiece.value;
    if (!workpiece) return '';

    const pointNames = workpiece.features.points.slice(0, 4).map(item => item.name).join(', ');
    const lineNames = workpiece.features.lines.slice(0, 4).map(item => item.name).join(', ');
    const faceNames = workpiece.features.faces.map(item => item.name).join(', ');

    return `点: ${pointNames}${workpiece.features.points.length > 4 ? '...' : ''}; 线: ${lineNames}${workpiece.features.lines.length > 4 ? '...' : ''}; 面: ${faceNames}`;
});

onMounted(async () => {
    if (!containerRef.value) return;

    app = new WebcadTemp();
    viewHandle = await app.createView(VIEW_KEY, containerRef.value, {
        common: {
            backgroundColor: 0xf5f7fb,
            backgroundOpacity: 1,
            useAxes: true
        },
        camera: {
            orthographic: {
                x: 260,
                y: 260,
                z: 360,
                up: [0, 0, 1]
            }
        },
        viewCube: {
            visible: true,
            size: 160,
            position: { right: 24, top: 2 }
        },
        orbitControls: {
            lockUp: false
        }
    });

    // 选择事件返回的是实体 id；可能命中工件子实体，所以通过 handle 反查父级 SimpleWorkpiece。
    stopSelectionListen = viewHandle.onSelectionChange.listen(event => {
        selectedWorkpiece.value = viewHandle?.findSimpleWorkpieceByEntityIds(event.selectedIds) ?? null;
        refreshSelectedWorkpieceInfo();
    });

    stopChangeListen = viewHandle.onChange.listen(event => {
        if (event.type !== 'command') return;

        const data = event.payload.data as WorkpieceMoveProgressEvent | undefined;

        if (data?.type !== 'workpieceMoveProgress') return;
        if (selectedWorkpiece.value?.id !== data.workpieceId) return;

        refreshSelectedWorkpieceInfo();
    });
});

onUnmounted(async () => {
    viewHandle?.cancelCommand();
    stopSelectionListen?.();
    stopChangeListen?.();
    stopSelectionListen = null;
    stopChangeListen = null;
    selectedWorkpiece.value = null;
    selectedWorkpieceInfo.value = null;
    await viewHandle?.dispose();
    viewHandle = null;
    app = null;
});

async function createWorkpiece(type: WorkpieceType) {
    if (!viewHandle) return;

    // 每次创建向 X 方向错开，方便同时观察立方体和圆柱体。
    const centerX = createdCount * 180;
    createdCount += 1;

    // 示例页只调用业务 handle；真正创建动作由 CreateSimpleWorkpieceCommand 完成。
    await viewHandle.createSimpleWorkpiece({
        type,
        center: [centerX, 0, 0]
    });
}

async function moveSelectedWorkpiece() {
    if (!viewHandle || !selectedWorkpiece.value || selectedWorkpiece.value.state !== 'waiting') return;

    const workpiece = selectedWorkpiece.value;

    await viewHandle.moveWorkpiece({
        workpieceId: workpiece.id,
        from: workpiece.getPositionTuple(),
        to: [500, 0, 0],
        duration: 3.0
    });

    refreshSelectedWorkpieceInfo();
}

function refreshSelectedWorkpieceInfo() {
    const workpiece = selectedWorkpiece.value;

    selectedWorkpieceInfo.value = workpiece
        ? {
            state: workpiece.state,
            remainingText: `${workpiece.remaining.toFixed(1)}s`
        }
        : null;
}
</script>

<style scoped>
.workpiece-page {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background: #f5f7fb;
}

.canvas-host {
    width: 100%;
    height: 100%;
}

.control-panel {
    position: absolute;
    top: 80px;
    left: 16px;
    width: min(360px, calc(100vw - 32px));
    padding: 16px;
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid #d8dee9;
    border-radius: 8px;
    box-shadow: 0 8px 28px rgba(15, 23, 42, 0.16);
    color: #172033;
}

.panel-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 14px;
}

.panel-title {
    font-size: 16px;
    font-weight: 700;
}

.panel-subtitle {
    font-size: 12px;
    color: #607086;
}

.button-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin-bottom: 14px;
}

button {
    height: 34px;
    border: 1px solid #2f6fed;
    border-radius: 6px;
    background: #2f6fed;
    color: white;
    font-size: 13px;
    cursor: pointer;
}

button:hover {
    background: #255ec9;
}

button:disabled {
    border-color: #a9b4c4;
    background: #b9c2cf;
    cursor: not-allowed;
}

button:disabled:hover {
    background: #b9c2cf;
}

.info-panel {
    border-top: 1px solid #d8dee9;
    padding-top: 12px;
}

.info-title,
.feature-title {
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 700;
}

dl {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin: 0;
}

dl div {
    min-width: 0;
    padding: 8px;
    border: 1px solid #e1e6ef;
    border-radius: 6px;
    background: #fbfcff;
}

dt {
    margin-bottom: 4px;
    color: #607086;
    font-size: 12px;
}

dd {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    overflow-wrap: anywhere;
}

.feature-list {
    margin-top: 12px;
}

.feature-list p,
.empty-text {
    margin: 0;
    color: #4d5b70;
    font-size: 13px;
    line-height: 1.5;
}
</style>

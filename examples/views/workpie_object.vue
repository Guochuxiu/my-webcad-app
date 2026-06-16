<template>
    <div class="workpiece-page">
        <div ref="containerRef" class="canvas-host"></div>
        <section class="control-panel">
            <div class="panel-header">
                <span class="panel-title">Workpiece Logistics Demo</span>
                <span class="panel-subtitle">Warehouse / Load / Conveyor / Unload</span>
            </div>

            <div class="button-row">
                <button type="button" @click="createWorkpiece('box')">创建立方体</button>
                <button type="button" @click="createWorkpiece('cylinder')">创建圆柱体</button>
                <button type="button" @click="createConveyor">创建传送带</button>
            </div>

            <div class="button-row">
                <button type="button" :disabled="!canStartConveyor" @click="startConveyor">启动传送带</button>
                <button type="button" :disabled="!canStopConveyor" @click="stopConveyor">停止传送带</button>
                <button type="button" :disabled="!canTickConveyor" @click="tickConveyorOnce">单步 Tick</button>
            </div>

            <div class="button-row">
                <button type="button" :disabled="!canLoad" @click="loadWorkpiece">上料</button>
                <button type="button" :disabled="!canUnload" @click="unloadWorkpiece">下料</button>
            </div>

            <div class="info-panel">
                <div class="info-title">物流状态</div>
                <template v-if="logisticsInfo">
                    <dl>
                        <div>
                            <dt>当前时间</dt>
                            <dd>{{ logisticsInfo.currentTimeText }}</dd>
                        </div>
                        <div>
                            <dt>传送带状态</dt>
                            <dd>{{ logisticsInfo.conveyorStatus }}</dd>
                        </div>
                        <div>
                            <dt>仓库等待</dt>
                            <dd>{{ logisticsInfo.waitingCount }}</dd>
                        </div>
                        <div>
                            <dt>传送中</dt>
                            <dd>{{ logisticsInfo.conveyingCount }}</dd>
                        </div>
                        <div>
                            <dt>B 点等待</dt>
                            <dd>{{ logisticsInfo.exitWaitingCount }}</dd>
                        </div>
                        <div>
                            <dt>阻塞原因</dt>
                            <dd>{{ logisticsInfo.blockedReason }}</dd>
                        </div>
                        <div>
                            <dt>工作台</dt>
                            <dd>{{ logisticsInfo.worktableStatus }}</dd>
                        </div>
                        <div>
                            <dt>传送带容量</dt>
                            <dd>{{ selectedConveyorInfo?.capacity ?? '-' }}</dd>
                        </div>
                    </dl>
                </template>
                <p v-else class="empty-text">创建传送带和工件后，可以按“上料 -> 启动传送带 -> 下料”推进流程。</p>
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
                            <dt>位置</dt>
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

            <div class="info-panel">
                <div class="info-title">选中传送带</div>
                <template v-if="selectedConveyorInfo">
                    <dl>
                        <div>
                            <dt>业务 ID</dt>
                            <dd>{{ selectedConveyorInfo.conveyorId }}</dd>
                        </div>
                        <div>
                            <dt>状态</dt>
                            <dd>{{ selectedConveyorInfo.status }}</dd>
                        </div>
                        <div>
                            <dt>起点</dt>
                            <dd>{{ selectedConveyorInfo.startPoint }}</dd>
                        </div>
                        <div>
                            <dt>终点</dt>
                            <dd>{{ selectedConveyorInfo.endPoint }}</dd>
                        </div>
                        <div>
                            <dt>方向</dt>
                            <dd>{{ selectedConveyorInfo.direction }}</dd>
                        </div>
                        <div>
                            <dt>速度</dt>
                            <dd>{{ selectedConveyorInfo.speed }}</dd>
                        </div>
                        <div>
                            <dt>容量</dt>
                            <dd>{{ selectedConveyorInfo.capacity }}</dd>
                        </div>
                    </dl>
                </template>
                <p v-else class="empty-text">创建或选中传送带后查看设备状态。</p>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { WebcadTemp } from '@/projects/template';
import type {
    ConveyorEntity,
    ConveyorStatus,
    ConveyorStatusChangeEvent,
    LogisticsBlockedReason,
    LogisticsSnapshot,
    LogisticsSnapshotEvent,
    SimpleWorkpiece,
    WorkpieceType,
} from '@/projects/template';
import type { TempViewHandle } from '@/projects/template/view/temp_view_handle';

const VIEW_KEY = 'workpiece-prd1';
const TICK_SECONDS = 0.3;
const BLOCKED_REASON_LABELS: Record<LogisticsBlockedReason, string> = {
    none: '无',
    conveyor_full: '传送带容量已满',
    conveyor_entry_occupied: '入口被占用',
    conveyor_exit_occupied: 'B 点有工件等待下料',
    worktable_busy: '工作台忙',
};

const containerRef = ref<HTMLDivElement | null>(null);
const selectedWorkpiece = ref<SimpleWorkpiece | null>(null);
const selectedConveyor = ref<ConveyorEntity | null>(null);
const selectedWorkpieceInfo = ref<{
    state: string;
    remainingText: string;
} | null>(null);
const selectedConveyorInfo = ref<{
    conveyorId: string;
    startPoint: string;
    endPoint: string;
    direction: string;
    speed: number;
    capacity: number;
    status: ConveyorStatus;
} | null>(null);
const logisticsInfo = ref<{
    currentTimeText: string;
    conveyorStatus: string;
    waitingCount: number;
    conveyingCount: number;
    exitWaitingCount: number;
    blockedReason: string;
    worktableStatus: string;
} | null>(null);
const lastSnapshot = ref<LogisticsSnapshot | null>(null);

let app: WebcadTemp | null = null;
let viewHandle: TempViewHandle | null = null;
let stopSelectionListen: (() => void) | null = null;
let stopChangeListen: (() => void) | null = null;
let conveyorTimer: ReturnType<typeof window.setInterval> | null = null;
let conveyorTicking = false;

const canStartConveyor = computed(() => {
    return Boolean(selectedConveyor.value) && selectedConveyorInfo.value?.status !== 'running';
});
const canStopConveyor = computed(() => {
    return Boolean(selectedConveyor.value)
        && (selectedConveyorInfo.value?.status === 'running' || selectedConveyorInfo.value?.status === 'blocked');
});
const canTickConveyor = computed(() => {
    return Boolean(selectedConveyor.value)
        && (selectedConveyorInfo.value?.status === 'running' || selectedConveyorInfo.value?.status === 'blocked');
});
const canLoad = computed(() => Boolean(selectedConveyor.value) && Boolean(lastSnapshot.value?.canLoad));
const canUnload = computed(() => Boolean(lastSnapshot.value?.canUnload));

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
            useAxes: true,
        },
        camera: {
            orthographic: {
                x: 420,
                y: 360,
                z: 520,
                up: [0, 0, 1],
            },
        },
        viewCube: {
            visible: true,
            size: 160,
            position: { right: 24, top: 2 },
        },
        orbitControls: {
            lockUp: false,
        },
    });

    // 选中特征子实体时向上找到业务父实体，UI 只展示业务对象状态。
    stopSelectionListen = viewHandle.onSelectionChange.listen(event => {
        selectedWorkpiece.value = viewHandle?.findSimpleWorkpieceByEntityIds(event.selectedIds) ?? null;
        selectedConveyor.value = viewHandle?.findConveyorByEntityIds(event.selectedIds) ?? selectedConveyor.value;
        refreshAllInfo();
    });

    stopChangeListen = viewHandle.onChange.listen(event => {
        if (event.type !== 'command') return;

        const data = event.payload?.data as
            | ConveyorStatusChangeEvent
            | LogisticsSnapshotEvent
            | undefined;

        if (data?.type === 'conveyorStatusChange') {
            selectedConveyor.value = viewHandle?.findFirstConveyor() ?? selectedConveyor.value;
        }

        if (data?.type === 'logisticsSnapshot') {
            applySnapshot(data);
        }

        refreshAllInfo();
    });

    refreshAllInfo();
});

onUnmounted(async () => {
    stopConveyorTimer();
    viewHandle?.cancelCommand();
    stopSelectionListen?.();
    stopChangeListen?.();
    stopSelectionListen = null;
    stopChangeListen = null;
    selectedWorkpiece.value = null;
    selectedConveyor.value = null;
    selectedWorkpieceInfo.value = null;
    selectedConveyorInfo.value = null;
    logisticsInfo.value = null;
    lastSnapshot.value = null;
    await viewHandle?.dispose();
    viewHandle = null;
    app = null;
});

async function createWorkpiece(type: WorkpieceType) {
    if (!viewHandle) return;

    await viewHandle.createSimpleWorkpiece({ type });
    refreshAllInfo();
}

async function createConveyor() {
    if (!viewHandle) return;

    await viewHandle.createConveyor({
        id: 'conveyor_01',
        startPoint: [0, 0, 0],
        endPoint: [800, 0, 0],
        speed: 100,
        capacity: 2,
    });
    selectedConveyor.value = viewHandle.findFirstConveyor();
    refreshAllInfo();
}

async function startConveyor() {
    await setSelectedConveyorStatus('running');
    startConveyorTimer();
}

async function stopConveyor() {
    stopConveyorTimer();
    await setSelectedConveyorStatus('stopped');
}

async function setSelectedConveyorStatus(status: ConveyorStatus) {
    if (!viewHandle || !selectedConveyor.value) return;

    await viewHandle.setConveyorStatus({
        conveyorId: selectedConveyor.value.id,
        status,
    });
    refreshAllInfo();
}

async function loadWorkpiece() {
    if (!viewHandle || !selectedConveyor.value) return;

    await viewHandle.loadWorkpiece({
        conveyorId: selectedConveyor.value.id,
    });
    refreshAllInfo();

    if (selectedConveyor.value.status === 'running') {
        startConveyorTimer();
    }
}

async function unloadWorkpiece() {
    if (!viewHandle) return;

    await viewHandle.unloadWorkpiece();
    refreshAllInfo();

    if (selectedConveyor.value?.status === 'running') {
        startConveyorTimer();
    }
}

async function tickConveyorOnce() {
    if (!viewHandle || !selectedConveyor.value || conveyorTicking) return;

    conveyorTicking = true;

    try {
        await viewHandle.tickConveyorWorkpieces({
            conveyorId: selectedConveyor.value.id,
            deltaSeconds: TICK_SECONDS,
        });
        refreshAllInfo();
    } finally {
        conveyorTicking = false;
    }
}

function startConveyorTimer() {
    if (conveyorTimer !== null) return;

    conveyorTimer = window.setInterval(() => {
        void tickConveyorOnce();
    }, TICK_SECONDS * 1000);
}

function stopConveyorTimer() {
    if (conveyorTimer === null) return;

    window.clearInterval(conveyorTimer);
    conveyorTimer = null;
}

function refreshAllInfo() {
    if (viewHandle) {
        selectedConveyor.value = selectedConveyor.value ?? viewHandle.findFirstConveyor();
    }

    refreshSelectedWorkpieceInfo();
    refreshSelectedConveyorInfo();
    refreshLogisticsInfo();
}

function refreshSelectedWorkpieceInfo() {
    const workpiece = selectedWorkpiece.value;

    selectedWorkpieceInfo.value = workpiece
        ? {
            state: workpiece.state,
            remainingText: `${workpiece.remaining.toFixed(1)}s`,
        }
        : null;
}

function refreshSelectedConveyorInfo() {
    const conveyor = selectedConveyor.value;

    selectedConveyorInfo.value = conveyor
        ? {
            conveyorId: conveyor.conveyorId,
            startPoint: formatPoint(conveyor.startPoint),
            endPoint: formatPoint(conveyor.endPoint),
            direction: formatPoint(conveyor.direction),
            speed: conveyor.speed,
            capacity: conveyor.capacity,
            status: conveyor.status,
        }
        : null;
}

function refreshLogisticsInfo() {
    if (!viewHandle) {
        logisticsInfo.value = null;
        lastSnapshot.value = null;

        return;
    }

    const snapshot = viewHandle.getLogisticsSnapshot(selectedConveyor.value?.id);
    applySnapshot(snapshot);
}

function applySnapshot(snapshot: LogisticsSnapshot) {
    lastSnapshot.value = snapshot;
    logisticsInfo.value = {
        currentTimeText: new Date(snapshot.currentTime).toLocaleTimeString(),
        conveyorStatus: snapshot.conveyorStatus ?? '未创建',
        waitingCount: snapshot.waitingCount,
        conveyingCount: snapshot.conveyingCount,
        exitWaitingCount: snapshot.exitWaitingCount,
        blockedReason: BLOCKED_REASON_LABELS[snapshot.blockedReason],
        worktableStatus: snapshot.worktableStatus === 'busy' ? '忙' : '空闲',
    };
}

function formatPoint(point: [number, number, number]): string {
    return `[${point.map(value => Number(value.toFixed(2))).join(', ')}]`;
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
    width: min(430px, calc(100vw - 32px));
    max-height: calc(100vh - 104px);
    overflow: auto;
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
    min-height: 34px;
    border: 1px solid #2f6fed;
    border-radius: 6px;
    background: #2f6fed;
    color: white;
    font-size: 12px;
    line-height: 1.25;
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
    margin-top: 12px;
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

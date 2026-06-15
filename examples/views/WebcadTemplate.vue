<template>
    <div>
        <div id="container"></div>
        <input
            ref="modelInputRef"
            class="hidden-model-input"
            type="file"
            :accept="TEMPLATE_MODEL_IMPORT_ACCEPT"
            multiple
            @change="handleModelFileChange"
        >
        <input
            ref="pcdInputRef"
            class="hidden-model-input"
            type="file"
            accept=".pcd"
            multiple
            @change="handlePCDFileChange"
        >
        <FsToolBar v-if="tools.length" :tools="tools" textAdapt="omit" type="ribbon" class="fs-toolbar-demo" @click-option="clickButton"
        @clickButton="clickButton" />
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElLoading, ElMessage } from '@fscut/element-plus';
import { getToolBar } from '../utils/toolbar';
import { WebcadTemp } from '@/projects/template';
import { TEMPLATE_MODEL_IMPORT_ACCEPT } from '@/projects/template/utils/model_import';

const tools = ref<any[]>([]);
let viewRef;
const modelInputRef = ref<HTMLInputElement | null>(null);
const pcdInputRef = ref<HTMLInputElement | null>(null);
let appRef;

onMounted(async () => {
    const app = new WebcadTemp();
    const view = await app.createView('cad', document.getElementById('container') as HTMLElement);

    appRef = app;
    viewRef = view;
    tools.value.push(...getToolBar(view, app, {
        onImportModel: openModelPicker,
        onImportPointCloud: openPCDPicker
    }));
});

function openModelPicker() {
    modelInputRef.value?.click();
}

function openPCDPicker() {
    pcdInputRef.value?.click();
}

async function handlePCDFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (!files.length || !appRef) {
        resetFileInput(input);
        return;
    }

    const loading = ElLoading.service({
        lock: true,
        text: `正在导入 ${files.length} 个点云文件...`,
        background: 'rgba(255, 255, 255, 0.65)'
    });

    try {
        await appRef.executeCommand('cad', WebcadTemp.CMD_TYPES.IMPORT_POINT_CLOUD, {
            files,
            fitView: true
        });
        ElMessage.success(`点云导入成功，共处理 ${files.length} 个文件`);
    } catch (error) {
        console.error(error);
        ElMessage.error(error instanceof Error ? error.message : '点云导入失败');
    } finally {
        loading.close();
        resetFileInput(input);
    }
}

async function handleModelFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (!files.length || !appRef) {
        resetFileInput();

        return;
    }

    const loading = ElLoading.service({
        lock: true,
        text: `正在导入 ${files.length} 个模型文件...`,
        background: 'rgba(255, 255, 255, 0.65)'
    });

    try {
        await appRef.executeCommand('cad', WebcadTemp.CMD_TYPES.IMPORT_MODEL, {
            files,
            fitView: true
        });
        ElMessage.success(`模型导入成功，共处理 ${files.length} 个文件`);
    } catch (error) {
        console.error(error);
        ElMessage.error(error instanceof Error ? error.message : '模型导入失败');
    } finally {
        loading.close();
        resetFileInput();
    }
}

function resetFileInput(ref?: HTMLInputElement | null) {
    const target = ref ?? modelInputRef.value;
    if (target) {
        target.value = '';
    }
}

function clickButton(option) {
    if (option.callback) {
        option.callback();
    }
}

</script>

<style>
body, html {
    margin: 0;
    padding: 0;
}
#container {
    width: 100%;
    height: 100vh;
}
.fs-toolbar-demo{
    position: fixed;
    top: 0;
    left: 0;
}
.baseurl-input-container {
    position: fixed;
    top: 98px;
    left: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.9);
    padding: 8px 12px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;
}
.baseurl-input-container label {
    font-size: 14px;
    color: #333;
    white-space: nowrap;
}
.baseurl-input {
    width: 300px;
    padding: 6px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    outline: none;
}
.baseurl-input:focus {
    border-color: #409eff;
}
.stats-panel {
    position: fixed;
    top: 110px;
    left: 10px;
    background: rgba(255, 255, 255, 0.95);
    padding: 12px 16px;
    border-radius: 6px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    min-width: 200px;
}
.stats-title {
    font-size: 15px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #409eff;
}
.stats-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    font-size: 13px;
}
.stats-label {
    color: #666;
    margin-right: 12px;
}
.stats-value {
    color: #409eff;
    font-weight: 600;
    font-family: 'Courier New', monospace;
}
.lil-gui.lil-root{
    bottom: 0 !important;
    top: auto;
}
.hidden-model-input {
    display: none;
}
</style>

import GUI from 'lil-gui';
import { CypWeldMultiStationViewHandle } from '@/projects/cypweld/view/cypweld_multi_station_view_handle';

/**
 * 设置扫描范围调试 GUI
 * @returns GUI 实例，用于销毁
 */
export function setupScanRangeDebugGUI(handle: CypWeldMultiStationViewHandle): GUI {
    const gui = new GUI();
    gui.title('扫描范围调试');

    const params = {
        minX: -100, minY: -100, minZ: -100,
        maxX: 100, maxY: 100, maxZ: 100,
        visible: true,
    };

    /** 应用当前参数到包围盒 */
    const applyRange = () => {
        handle.setScanRange(
            { x: params.minX, y: params.minY, z: params.minZ },
            { x: params.maxX, y: params.maxY, z: params.maxZ }
        );
    };

    // 1. 最小点控制
    const minFolder = gui.addFolder('最小点 (Min)');
    minFolder.add(params, 'minX').min(-500).max(500).step(1).name('X').onChange(applyRange);
    minFolder.add(params, 'minY').min(-500).max(500).step(1).name('Y').onChange(applyRange);
    minFolder.add(params, 'minZ').min(-500).max(500).step(1).name('Z').onChange(applyRange);
    minFolder.open();

    // 2. 最大点控制
    const maxFolder = gui.addFolder('最大点 (Max)');
    maxFolder.add(params, 'maxX').min(-500).max(500).step(1).name('X').onChange(applyRange);
    maxFolder.add(params, 'maxY').min(-500).max(500).step(1).name('Y').onChange(applyRange);
    maxFolder.add(params, 'maxZ').min(-500).max(500).step(1).name('Z').onChange(applyRange);
    maxFolder.open();

    // 3. 显示/隐藏
    gui.add(params, 'visible').name('显示').onChange((value: boolean) => {
        if (value) {
            handle.showScanRange();
        } else {
            handle.hideScanRange();
        }
    });

    // 初始化时创建包围盒
    applyRange();

    return gui;
}

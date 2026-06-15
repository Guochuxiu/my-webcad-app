import GUI from 'lil-gui';
import { CypWeldCanvas } from '@/projects/cypweld/view/cypweld_canvas';
import { CypWeldMultiStationViewHandle } from '@/projects/cypweld/view/cypweld_multi_station_view_handle';
import { CANTILEVER_BUSINESS_STATE, CantileverBusinessState } from '@/projects/cypweld/constants/cantilever_business_state';
import { CANTILEVER_ABNORMAL_STATE, CantileverAbnormalState } from '@/projects/cypweld/constants/cantilever_abnormal_state';

/** 常量配置 */
const CANTILEVER_IDS = [1, 2, 3, 4] as const;
const ROBOT_IDS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

type RobotStateDebugTarget = CypWeldCanvas | CypWeldMultiStationViewHandle;

/**
 * 设置机器人状态调试 GUI
 * @returns GUI 实例，用于销毁
 */
export function setupRobotStateDebugGUI(view: RobotStateDebugTarget): GUI {
    const gui = new GUI();
    gui.title('机器人状态调试');

    // 状态参数
    const params = {
        cantileverId: 1,
        robotId: 0,
        cantileverOffline: false,
        robotOffline: false,
        allTransparent: false,
        cantileverBusinessState: 'idle' as CantileverBusinessState,
        abnormalAlarm: false,
        abnormalOffline: false,
        abnormalDetached: false,
        abnormalIndependent: false
    };

    const syncCantileverControls = (cantileverId: number) => {
        params.cantileverOffline = view.isCantileverOffline(cantileverId);
        cantileverOfflineCtrl.updateDisplay();
    };

    const syncRobotControls = (robotId: number) => {
        params.robotOffline = view.isRobotOffline(robotId);
        robotOfflineCtrl.updateDisplay();
    };

    const syncTransparencyControl = () => {
        params.allTransparent = view.isAllTransparent();
        allTransparentCtrl.updateDisplay();
    };

    // 1. 悬臂控制文件夹
    const cantileverFolder = gui.addFolder('悬臂控制');
    const cantileverIdCtrl = cantileverFolder.add(params, 'cantileverId', { '悬臂1': 1, '悬臂2': 2, '悬臂3': 3, '悬臂4': 4 })
        .name('悬臂编号')
        .onChange((id: number) => {
            syncCantileverControls(id);
        });

    cantileverFolder.add({
        setActive: () => {
            view.setCantileverProcess(params.cantileverId, true);
            console.log(`[RobotState] 悬臂${params.cantileverId} 设为当前流程`);
        }
    }, 'setActive').name('当前流程');

    cantileverFolder.add({
        setInactive: () => {
            view.setCantileverProcess(params.cantileverId, false);
            console.log(`[RobotState] 悬臂${params.cantileverId} 设为非当前流程`);
        }
    }, 'setInactive').name('非当前流程');

    const cantileverOfflineCtrl = cantileverFolder.add(params, 'cantileverOffline')
        .name('掉线')
        .onChange((value: boolean) => {
            view.setCantileverOffline(params.cantileverId, value);
            console.log(`[RobotState] 悬臂${params.cantileverId} 掉线: ${value}`);
        });

    // 2. 机器人控制文件夹
    const robotFolder = gui.addFolder('机器人控制');
    const robotIdCtrl = robotFolder.add(params, 'robotId', {
        '机器人0': 0, '机器人1': 1, '机器人2': 2, '机器人3': 3,
        '机器人4': 4, '机器人5': 5, '机器人6': 6, '机器人7': 7
    }).name('机器人编号')
        .onChange((id: number) => {
            syncRobotControls(id);
        });

    const robotOfflineCtrl = robotFolder.add(params, 'robotOffline')
        .name('掉线')
        .onChange((value: boolean) => {
            view.setRobotOffline(params.robotId, value);
            console.log(`[RobotState] 机器人${params.robotId} 掉线: ${value}`);
        });

    // 3. 悬臂业务状态文件夹
    const businessFolder = gui.addFolder('悬臂业务状态');

    businessFolder.add({
        initLabels: () => {
            if (view instanceof CypWeldMultiStationViewHandle) {
                view.initCantileverLabels();
                console.log('[RobotState] 悬臂状态标签已初始化');
            }
        }
    }, 'initLabels').name('初始化标签');

    businessFolder.add(params, 'cantileverBusinessState', {
        '空闲': CANTILEVER_BUSINESS_STATE.IDLE,
        '加工': CANTILEVER_BUSINESS_STATE.PROCESSING,
        '暂停': CANTILEVER_BUSINESS_STATE.PAUSED,
        '停止': CANTILEVER_BUSINESS_STATE.STOPPED
    }).name('业务状态').onChange((state: CantileverBusinessState) => {
        if (view instanceof CypWeldMultiStationViewHandle) {
            view.setCantileverBusinessState(params.cantileverId, state);
            console.log(`[RobotState] 悬臂${params.cantileverId} 业务状态: ${state}`);
        }
    });

    businessFolder.open();

    // 3.5 悬臂异常状态文件夹
    const abnormalFolder = gui.addFolder('悬臂异常状态');

    abnormalFolder.add(params, 'abnormalAlarm').name('报警').onChange((value: boolean) => {
        if (view instanceof CypWeldMultiStationViewHandle) {
            if (value) {
                view.addCantileverAbnormalState(params.cantileverId, CANTILEVER_ABNORMAL_STATE.ALARM);
            } else {
                view.removeCantileverAbnormalState(params.cantileverId, CANTILEVER_ABNORMAL_STATE.ALARM);
            }
            console.log(`[RobotState] 悬臂${params.cantileverId} 报警: ${value}`);
        }
    });

    abnormalFolder.add(params, 'abnormalOffline').name('掉线').onChange((value: boolean) => {
        if (view instanceof CypWeldMultiStationViewHandle) {
            if (value) {
                view.addCantileverAbnormalState(params.cantileverId, CANTILEVER_ABNORMAL_STATE.OFFLINE);
            } else {
                view.removeCantileverAbnormalState(params.cantileverId, CANTILEVER_ABNORMAL_STATE.OFFLINE);
            }
            console.log(`[RobotState] 悬臂${params.cantileverId} 掉线: ${value}`);
        }
    });

    abnormalFolder.add(params, 'abnormalDetached').name('脱离').onChange((value: boolean) => {
        if (view instanceof CypWeldMultiStationViewHandle) {
            if (value) {
                view.addCantileverAbnormalState(params.cantileverId, CANTILEVER_ABNORMAL_STATE.DETACHED);
            } else {
                view.removeCantileverAbnormalState(params.cantileverId, CANTILEVER_ABNORMAL_STATE.DETACHED);
            }
            console.log(`[RobotState] 悬臂${params.cantileverId} 脱离: ${value}`);
        }
    });

    abnormalFolder.add(params, 'abnormalIndependent').name('独立').onChange((value: boolean) => {
        if (view instanceof CypWeldMultiStationViewHandle) {
            if (value) {
                view.addCantileverAbnormalState(params.cantileverId, CANTILEVER_ABNORMAL_STATE.INDEPENDENT);
            } else {
                view.removeCantileverAbnormalState(params.cantileverId, CANTILEVER_ABNORMAL_STATE.INDEPENDENT);
            }
            console.log(`[RobotState] 悬臂${params.cantileverId} 独立: ${value}`);
        }
    });

    abnormalFolder.add({
        clearAll: () => {
            if (view instanceof CypWeldMultiStationViewHandle) {
                view.clearCantileverAbnormalStates(params.cantileverId);
                params.abnormalAlarm = false;
                params.abnormalOffline = false;
                params.abnormalDetached = false;
                params.abnormalIndependent = false;
                abnormalFolder.controllersRecursive().forEach(c => c.updateDisplay());
                console.log(`[RobotState] 悬臂${params.cantileverId} 已清除所有异常状态`);
            }
        }
    }, 'clearAll').name('清除所有异常');

    abnormalFolder.open();

    // 4. 批量操作文件夹
    const batchFolder = gui.addFolder('批量操作');
    batchFolder.add({
        allActive: () => {
            view.setCantileversProcess({ 1: true, 2: true, 3: true, 4: true });
            console.log('[RobotState] 所有悬臂设为当前流程');
        }
    }, 'allActive').name('全部当前流程');

    batchFolder.add({
        allInactive: () => {
            view.setCantileversProcess({ 1: false, 2: false, 3: false, 4: false });
            console.log('[RobotState] 所有悬臂设为非当前流程');
        }
    }, 'allInactive').name('全部非当前流程');

    const allTransparentCtrl = batchFolder.add(params, 'allTransparent')
        .name('机床透明')
        .onChange((value: boolean) => {
            view.setAllTransparent(value);
            console.log(`[RobotState] 机床透明: ${value}`);
        });

    batchFolder.add({
        reset: () => {
            // 恢复所有状态
            CANTILEVER_IDS.forEach(id => {
                view.setCantileverOffline(id, false);
                view.setCantileverProcess(id, true);
            });
            ROBOT_IDS.forEach(id => {
                view.setRobotOffline(id, false);
            });
            view.setAllTransparent(false);
            params.cantileverOffline = false;
            params.robotOffline = false;
            params.allTransparent = false;
            gui.controllersRecursive().forEach(c => c.updateDisplay());
            console.log('[RobotState] 已恢复所有状态');
        }
    }, 'reset').name('全部恢复');

    // 4. 状态查询文件夹
    const queryFolder = gui.addFolder('状态查询');
    queryFolder.add({
        printState: () => {
            console.log('===== 机器人状态 =====');
            ROBOT_IDS.forEach(i => {
                console.log(`机器人${i}: ${view.getRobotState(i)}`);
            });
            console.log('======================');
        }
    }, 'printState').name('打印当前状态');

    // 展开文件夹
    cantileverFolder.open();
    robotFolder.open();
    syncCantileverControls(params.cantileverId);
    syncRobotControls(params.robotId);
    syncTransparencyControl();

    return gui;
}

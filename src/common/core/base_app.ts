/**
 * App 基类
 * 职责：管理 App 单例、视图生命周期、命令管理器
 */

import { CadApp, FSCore } from '@fs/cadnginx';

export class BaseApp extends CadApp {
    protected static _instance: BaseApp;
    public static getInstance(): BaseApp {
        if (!BaseApp._instance) {
            BaseApp._instance = new BaseApp();
            // @ts-ignore
            window.app = BaseApp._instance;
        }

        return BaseApp._instance;
    }
    
    public signalEventBus = new FSCore.Util.Signal();
}

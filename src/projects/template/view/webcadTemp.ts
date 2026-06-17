import { WebCadApiBase } from '@/common';
import { TemplateCmdParamTypes } from '../command/cmd_register';
import { CMD_TYPES } from '../command/cmd_types';
import { TempCanvas } from './temp_canvas';
import { TempViewHandle } from './temp_view_handle';

//实现创建视图
export class WebcadTemp extends WebCadApiBase<TemplateCmdParamTypes> {
    //命令注册表
    public static CMD_TYPES = CMD_TYPES;

    //获取实例：app=WebcadTemp.getInstance()
    private static _instance: WebcadTemp;
    public static getInstance():WebcadTemp {
        if (!this._instance) {
            this._instance = new WebcadTemp();
        }

        return this._instance as WebcadTemp;
    }

    //根据 handleKey 找到 view handle，并执行命令
    public executeCommand<K extends CMD_TYPES>(handleKey: string, cmdName: K, params?: TemplateCmdParamTypes[K]): Promise<any> {
        return super.executeCommand(handleKey, cmdName, params);
    }

    //创建一个 WebCAD 业务视图，并返回 TempViewHandle
    public async createView(viewKey: string, container: HTMLElement, options?: any): Promise<TempViewHandle> {
        if (!this._app) {
            this._createApp();
        }

        if (this._views.has(viewKey)) {
            throw new Error(`View with key "${viewKey}" already exists.`);
        }

        const viewHandle = await this.createViewHandle(viewKey, container, options);
        this._views.set(viewKey, viewHandle);

        return viewHandle;
    }

    //创建 TempCanvas，再包装成 TempViewHandle
    protected async createViewHandle(viewKey: string, domElement: HTMLElement, configOptions?: any): Promise<TempViewHandle> {
        const view = await this._app.createView(viewKey, TempCanvas as any, { domElement, app: this._app, configOptions });

        return new TempViewHandle(viewKey, view as TempCanvas);
    }
}


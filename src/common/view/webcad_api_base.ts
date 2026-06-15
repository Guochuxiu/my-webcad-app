/**
 * WebCAD API 基类
 * 外部调用入口，只对外暴露该接口
 */

import { BaseViewHandle } from './view_handle_base';
import { BaseApp } from '../core/base_app';
import { Base3DCanvas } from '..';

export class WebCadApiBase< TCmdMap extends Record<PropertyKey, any> = any> {
    protected _app: BaseApp | null = null;
    protected _views: Map<string, BaseViewHandle> = new Map();

    protected _createApp() {
        if (this._app) return;
        this._app = BaseApp.getInstance();
    }

    /**
   * 创建视图
   * @category Lifecycle.View
   */
    public async createView(viewKey: string, container: HTMLElement, options?: any): Promise<BaseViewHandle> {
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

    /**
   * 创建视图句柄
   */
    protected async createViewHandle(viewKey: string, domElement: HTMLElement, configOptions?: any) {
        const view = await this._app.createView(viewKey, Base3DCanvas, { domElement, app: this._app, configOptions });
        const baseViewHandle = new BaseViewHandle(viewKey, view);

        return baseViewHandle;
    }

    /**
     * 执行命令：cmdName 决定 params 的类型
     */
    public executeCommand<K extends keyof TCmdMap>(
        handleKey: string,
        cmdName: K,
        params?: TCmdMap[K]
    ): Promise<any> {
        const handle = this._views.get(handleKey);

        if (!handle) {
            throw new Error(`Handle with key "${handleKey}" not found.`);
        }

        return handle.executeCommand(cmdName, params);
    }
}

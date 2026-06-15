import { WebCadApiBase } from '@/common';
import { TemplateCmdParamTypes } from '../command/cmd_register';
import { CMD_TYPES } from '../command/cmd_types';
import { TempCanvas } from './temp_canvas';
import { TempViewHandle } from './temp_view_handle';

export class WebcadTemp extends WebCadApiBase<TemplateCmdParamTypes> {
    public static CMD_TYPES = CMD_TYPES;

    private static _instance: WebcadTemp;
    public static getInstance():WebcadTemp {
        if (!this._instance) {
            this._instance = new WebcadTemp();
        }

        return this._instance as WebcadTemp;
    }

    public executeCommand<K extends CMD_TYPES>(handleKey: string, cmdName: K, params?: TemplateCmdParamTypes[K]): Promise<any> {
        return super.executeCommand(handleKey, cmdName, params);
    }

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

    protected async createViewHandle(viewKey: string, domElement: HTMLElement, configOptions?: any): Promise<TempViewHandle> {
        const view = await this._app.createView(viewKey, TempCanvas as any, { domElement, app: this._app, configOptions });

        return new TempViewHandle(viewKey, view as TempCanvas);
    }
}


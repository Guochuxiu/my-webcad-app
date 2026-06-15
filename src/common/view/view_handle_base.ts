/**
 * ViewHandle 基类实现
 * 职责：提供视图操作句柄，聚合所有模块能力
 */

import { FSMath } from '@fs/cadnginx';
import { Base3DCanvas } from '..';
import {
    ICommandStateChangeEvent,
    ISelectionChangeEvent,
    IUnifiedChangeEvent,
    HandleSignal,
    HandleSignalHooks
} from './signals_module';
import * as THREE from 'three';

export class BaseViewHandle<T extends Base3DCanvas = Base3DCanvas> {
    protected _canvas: T;
    protected _viewKey: string;
    protected _signalHooks: HandleSignalHooks<T, this>;

    constructor(viewKey: string, canvas: T) {
        this._viewKey = viewKey;
        this._canvas = canvas;
        this._signalHooks = new HandleSignalHooks(this._canvas, this);
    }

    /**
     * 事件总线
     * @category Signals
     */
    public onChange: HandleSignal<IUnifiedChangeEvent> = new HandleSignal();

    /**
     * 选择事件
     * @category Signals.Selection
     */
    public onSelectionChange: HandleSignal<ISelectionChangeEvent> = new HandleSignal();

    /**
     * 命令事件
     * @category Signals.Command
     */
    public onCommandStateChange: HandleSignal<ICommandStateChangeEvent> = new HandleSignal();

    /**
   * 执行命令
   * @category CommandExecution
   */
    public executeCommand<T = any>(cmdType: any, params?: T): Promise<any> {
        return this._canvas.app.executeAsyncCmd(cmdType, [this._canvas, params]);
    }

    /**
   * 取消命令
   * @category CommandExecution
   */
    public cancelCommand(): void {
        this._canvas.app.cmdManager.cancel();
    }

    /**
     *  向当前活动命令发送消息
     * @category CommandInteraction
     */
    public sendCommandAction<T = any>(action: string, payload?: T): void {
        this._canvas.app.cmdManager.receive(action, payload ?? {});
    }

    /**
   * 选择图形
   * @category Selection
   */
    public select(ids: number[]): void {
        this._canvas.select(ids);
    }

    /**
   * 清空选择
   * @category Selection
   */
    public clearSelection(): void {
        this._canvas.app.selection.select([]);
    }

    /**
   * 适配视图
   * @category ViewOps.Zoom
   */
    public fitView(): void {
        this._canvas.fitView();
    }

    /**
     * 适配选中
     * @category ViewOps.Zoom
     */
    public fitSelection(): void {
        this._canvas.fitView(this._canvas.app.selection.selectedIds, [100, 100, 100, 100]);
    }

    /**
   * 坐标转换,屏幕转世界
   * @category Query.View
   */
    public screenToWcs(screenPos: FSMath.types.IXY): THREE.Vector3 {
        return this._canvas.screenToWcs(screenPos);
    }

    /**
   * 坐标转换,世界转屏幕
   * @category Query.View
   */
    public wcsToScreen(worldPos: FSMath.types.IXYZ): FSMath.Vector2 {
        return this._canvas.wcsToScreen(worldPos);
    }

    /**
   * 获取视图标识
   */
    public getViewKey(): string {
        return this._viewKey;
    }

    /**
   * 销毁
   */
    public async dispose(): Promise<void> {
        this._signalHooks.dispose();
        this._signalHooks = null;
        
        await this._canvas.dispose();
    }

    /**
     * 主题切换
     */
    public switchTheme(theme:'dark'|'light') {
        this._canvas.config.set('common.theme', theme);
    }
}

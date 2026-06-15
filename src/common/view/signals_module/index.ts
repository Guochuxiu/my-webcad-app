import { FSApp } from '@fs/cadnginx';
import { Base3DCanvas } from '@/common/core/base_3d_canvas';
import { ICommandStateChangeEvent, ISelectionChangeEvent } from './types';
import { BaseViewHandle } from '../view_handle_base';

export class HandleSignalHooks<T extends Base3DCanvas, H extends BaseViewHandle> {
    protected _canvas: T;
    protected _handle: H;

    constructor(canvas: T, handle: H) {
        this._canvas = canvas;
        this._handle = handle;
        
        // 注册事件监听回调
        this._canvas.app.cmdManager.signalCommandStart.listen(this._onCmdStart);
        this._canvas.app.cmdManager.signalCommandTerminated.listen(this._onCmdEnd);
        this._canvas.app.signalEventBus.listen(this._onCmdEvent);
        this._canvas.signalSelectChange.listen(this._onSelectionChange);
    }

    protected _onCmdStart = (evt) => {
        const payload: ICommandStateChangeEvent = {
            cmdType: evt.data.cmd.cmdName,
            state: 'started',
            data: {}
        };
        this._handle.onCommandStateChange.dispatch(payload);
        this._handle.onChange.dispatch({ type: 'command', payload, timestamp: Date.now() });
    };

    protected _onCmdEnd = (evt) => {
        const payload: ICommandStateChangeEvent = {
            cmdType: evt.data.cmd.cmdName,
            state: evt.data.status === 'complete' ? 'completed' : 'cancelled',
            data: {}
        };
        this._handle.onCommandStateChange.dispatch(payload);
        this._handle.onChange.dispatch({ type: 'command', payload, timestamp: Date.now() });
    };

    protected _onCmdEvent = (evt) => {
        const payload: ICommandStateChangeEvent = {
            cmdType: this._canvas.app.cmdManager.current?.type ?? '',
            state: 'event',
            data: evt.data
        };
        this._handle.onCommandStateChange.dispatch(payload);
        this._handle.onChange.dispatch({ type: 'command', payload, timestamp: Date.now() });
    };

    protected _onSelectionChange = (evt) => {
        const payload: ISelectionChangeEvent = {
            selectedIds: (evt.data.displays as FSApp.View.Three.ThreeDisplay[]).map(d => d.entityId),
            addedIds: [],
            removedIds: []
        };
        this._handle.onSelectionChange.dispatch(payload);
        this._handle.onChange.dispatch({ type: 'selection', payload, timestamp: Date.now() });
    };

    public dispose() {
        this._canvas.app.cmdManager.signalCommandStart.unlisten(this._onCmdStart);
        this._canvas.app.cmdManager.signalCommandTerminated.unlisten(this._onCmdEnd);
        this._canvas.app.signalEventBus.unlisten(this._onCmdEvent);
        this._canvas.signalSelectChange.unlisten(this._onSelectionChange);
        this._canvas = null;
        this._handle = null;
    }
}

export * from './types';
export * from './signal';

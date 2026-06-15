import { FSApp, View } from '@fs/cadnginx';
import { SesNodeDisplay, StateMaterialProvider } from '../display';
import { SesNodeEntity, SesSceneEntity } from '../model';
import { TransactionManager } from '../transaction/transaction_manager';
import { ApiBase } from '../api/api';
import { BaseApp } from './base_app';
import { SELECTION_MODE, SELECTION_TYPE } from '../constants/canvas_constants';
import { IPickStrategyOptions, PickHelper } from './pick_strategy';
import { Base3DObserver } from './observer/base_3d_observer';

// 业务3D Canvas基类
export class Base3DCanvas<TApi extends ApiBase = ApiBase> extends View.Cad3DCanvas {
    declare app: BaseApp;

    public transactionManager = new TransactionManager();
    protected _api: TApi;
    protected _selectionMode = SELECTION_MODE.WORKPIECE;
    protected _selectionType = SELECTION_TYPE.SINGLE;
    protected _originSelectionType = SELECTION_TYPE.SINGLE;
    protected _pickHelper = new PickHelper(this);
    protected _materialProvider = new StateMaterialProvider();

    constructor(params: FSApp.View.Three.IThreeCanvasConstructorParams) {
        super(params);
        this._registerDisplay();
        this._registerCommands();
        this._registerPickHelper();
    }

    protected getViewObserver(): View.Cad3DCanvasObserver<this> {
        return new Base3DObserver(this);
    }

    public get pickHelper() {
        return this._pickHelper;
    }

    public set selectionMode(v:SELECTION_MODE) {
        this._selectionMode = v;
    }

    public get selectionMode() {
        return this._selectionMode;
    }

    public set selectionType(v:SELECTION_TYPE) {
        this.setSelectionType(v);
    }

    public get selectionType() {
        return this._selectionType;
    }

    public get originSelectionType() {
        return this._originSelectionType;
    }

    public setSelectionType(type: SELECTION_TYPE, syncOrigin = false) {
        this._selectionType = type;

        if (syncOrigin) {
            this._originSelectionType = type;
        }
    }

    /** 拾取配置 */
    protected _pickOptions: IPickStrategyOptions = {
        ctrlKeyEnable: true,
        boxSelectEnable: true,
        clearSelectionOnEmptyClick: true
    };
    
    public get pickOptions() {
        return { ...this._pickOptions };
    }
    
    public setPickOptions(options: IPickStrategyOptions) {
        this._pickOptions = { ...this._pickOptions, ...options };
    }

    public get api() {
        return this._api;
    }

    public get materialProvider() {
        return this._materialProvider;
    }

    protected _registerPickHelper(): void {
        return;
    }

    protected _registerCommands(): void {
        return;
    }

    protected _registerDisplay() {
        this.registerDisplayType(SesNodeEntity, e => this.createDisplay(e, SesNodeDisplay));
        this.registerDisplayType(SesSceneEntity, e => this.createDisplay(e, FSApp.View.Three.Group));
    }

    /**
     * 删除模型
     */
    public eraseModel(ids: number[]) {
        // 使用set进行加速查找
        const idSets = new Set(ids);

        this.app.doc.entityList.filter(entity => idSets.has(entity.id)).forEach(entity => 
            entity.removeFromParent()
        );
    }
}

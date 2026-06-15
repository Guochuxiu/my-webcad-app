import { Command } from '@fs/cadnginx';
import { Base3DCanvas } from '../core/base_3d_canvas';
import { TCADCmdInfo, TCADCmdParam, TransactionType } from './cmd_param';
import { Transaction } from '../transaction/transaction';

export type ICmdResp = {
    added?: number[];
    removed?: number[];
    modified?: number[];
    [key: string]: any;
}
export class CmdBase<TParam = any, TCanvas extends Base3DCanvas = Base3DCanvas> extends Command.CmdEventBase {
    protected _cmdInfo: TCADCmdInfo = new TCADCmdInfo();
    protected _view: TCanvas;
    protected _params: TParam;
    /**是否需要事务 */
    protected _transaction: boolean = false;

    public get cmdName() {
        return this._params;
    }

    constructor([view, params]) {
        super();
        this._view = view;
        this._params = params;
    }

    async onExecute(..._args: any[]) {
        await this.commit();
        this.transactionProcessing();
    }

    commit(options?: any) {
        super.commit(options);
        this.context.selection.select([]);
    }

    async postCmd(param:any): Promise<any> {
    
        if (param instanceof TCADCmdParam) {
            this._cmdInfo.setCmdParam(param);
        }
    
        const data = await this._view.api.PostCADCmd<ICmdResp>(this._cmdInfo);

        await this._applyData(data);
    
        return data;
    }

    /**事务处理 */
    protected transactionProcessing() {
        if (!this._transaction) return;

        let transaction: Transaction = new Transaction(this, this._view);
        if (this._cmdInfo.transaction)  transaction = this._cmdInfo.transaction;
        // 推送事务到事务管理器管理
        this._view.transactionManager.pushTransaction(transaction);
    }
    
    public async onUndo(processDiff = true) {
        const cmdInfo = new TCADCmdInfo();
        cmdInfo.setCmdParam(new TCADCmdParam('undo', {}));
        cmdInfo.processDiff = processDiff;
        cmdInfo.setTransactionType(TransactionType.Atomic);
        const resp = await this._view.api.PostCADCmd(cmdInfo);
    
        if (resp && processDiff) {
            await this._applyData(resp);
        }
    }
    
    public async onRedo(processDiff = true) {
        const cmdInfo = new TCADCmdInfo();
        cmdInfo.setCmdParam(new TCADCmdParam('redo', {}));
        cmdInfo.processDiff = processDiff;
        cmdInfo.setTransactionType(TransactionType.Atomic);
        const resp = await this._view.api.PostCADCmd(cmdInfo);
    
        if (resp && processDiff) {
            await this._applyData(resp);
        }
    }

    /**
     * 
     * @param diff 是发生变化的data id，分为：
     * 
     * added 新增的id
     * deleted 删除的id
     * modified 修改的id
     * @returns 
     */
    protected async _applyData(diff: ICmdResp) {
    
        const { added, removed, modified } = this.processDiffData(diff);
    
        removed?.length && this._view.eraseModel(removed);
    
        if (added?.length) {
            const addedData = await this._getShapeData([...new Set(added)]);
            this._view.eraseModel(modified);
            this._addEntity(addedData);
        }
    }

    protected async _getShapeData(ids: number[]) {
        return [];
    }

    protected async _addEntity(model:any) {
        return;
    }

    protected processDiffData(diff: ICmdResp) {
        // for debug
        console.log('diff', diff);
        if (!diff) return;
        const added = []; 
        const removed = []; 
        const modified = [];
    
        // 把modified的id加入到added和modified中
        if (diff.modified?.length) {
            added.push(...diff.modified);
            modified.push(...diff.modified);
        }
        diff.added?.length && added.push(...diff.added);
        diff.removed?.length && removed.push(...diff.removed);
    
        return { added, modified, removed };
    }
}

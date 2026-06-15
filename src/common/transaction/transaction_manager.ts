import { Transaction } from './transaction';
import { FSCore } from '@fs/cadnginx';

export class TransactionManager {
    private _transactions: Transaction[] = [];
    private _maxCapacity = 10;
    public updateSignal = new FSCore.Util.Signal();
    private _curIdx: number = -1;

    public get executedTransactions() {
        if (this._transactions.length === 0) {
            return [];
        }

        return this._transactions.slice(0, this._curIdx + 1);
    }

    public pushTransaction(transaction: Transaction) {
        // 如果当前索引不是最后一个，则删除后面的所有事务
        if (this._curIdx !== this._transactions.length - 1) {
            this._transactions.splice(this._curIdx + 1);
        }

        // 如果超过最大容量，则删除第一个事务
        if (this._transactions.length >= this._maxCapacity) {
            this._transactions.shift();
        }

        this._transactions.push(transaction);
        this._curIdx = this._transactions.length - 1;
        console.log(`添加新命令${transaction.cmdName}，当前命令为${this._transactions[this._curIdx] ? this._transactions[this._curIdx].cmdName : '空'}`);
        this.updateSignal.dispatch({});
    }

    public undo() {

        if (this._transactions.length === 0 || this._curIdx < 0) {
            console.warn('撤销失败，没有可以撤销的命令');

            return;
        };
        this._transactions[this._curIdx].undo().then(() => {
            this._curIdx = Math.max(this._curIdx - 1, -1);

            console.log(`执行完撤销，当前命令为${this._transactions[this._curIdx] ? this._transactions[this._curIdx].cmdName : '空'}`);
            this.updateSignal.dispatch({});
        });
    }

    public redo() {
        if (this._curIdx >= this._transactions.length - 1) {
            this._curIdx = this._transactions.length - 1;
            console.warn('重做失败，没有可以重做的命令');

            return;
        }
        this._curIdx = Math.min(this._curIdx + 1, this._transactions.length - 1);
        this._transactions[this._curIdx < 0 ? 0 : this._curIdx].redo().then(() => {
            console.log(`执行完重做，当前命令为${this._transactions[this._curIdx] ? this._transactions[this._curIdx].cmdName : '空'}`);
            this.updateSignal.dispatch({});
        });
    }

    public clear() {
        this._transactions.forEach(t => {
            t.dispose();
        });
        this._transactions.length = 0;
        this._curIdx = -1;
        this.updateSignal.dispatch({});
    }

    get canUndo() {
        return this._transactions.length > 0 && this._curIdx >= 0;
    }

    get canRedo() {
        return this._transactions.length > 0 && this._curIdx < this._transactions.length - 1;
    }

    get curIdx() {
        return this._curIdx;
    }

    public dispose() {
        this.clear();
        this.updateSignal.dispose();
    }

}

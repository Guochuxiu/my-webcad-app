import { Transaction } from '../transaction/transaction';

/**
 * 事务类型
 */
export enum TransactionType {
    /** 自动完成 */
    Atomic = 'atomic',
    /** 提交命令 */
    Commit = 'commit',
    /** 取消命令 */
    Abort = 'abort',
    /** 开启命令 */
    Open = 'open'
}

export class TCADCmdInfo {
    public static readonly TRANSACTION_TYPE = TransactionType;
    private cmdName: string = '';
    private qryName: string = '';
    private cmdParam: TCADCmdParam = new TCADCmdParam();
    private qryParam: TCADCmdParam = new TCADCmdParam();
    private transactionType: TransactionType = TransactionType.Atomic;
    private _transaction: Transaction | null = null;
    public isQryCmd: boolean = false;
    // 是否处理diff
    private _processDiff: boolean = true;

    public get CmdName(): string {
        return this.isQryCmd ? this.qryName : this.cmdName;
    }

    public get TransactionType(): TransactionType {
        return this.isQryCmd ? TransactionType.Atomic : this.transactionType;
    }

    public getCmdParam(): TCADCmdParam {
        return this.isQryCmd ? this.qryParam : this.cmdParam;
    }

    public setTransactionType(v: TransactionType) {
        this.transactionType = v;
    }

    public setCmdParam(v: TCADCmdParam) {
        this.isQryCmd = v.isQryCmd && v.isQryCmd();

        if (this.isQryCmd) {
            this.qryParam = v;
            this.qryName = v.getCmdName();
            delete this.cmdParam;
            delete this.cmdName;
        } else {
            this.cmdParam = v;
            this.cmdName = v.getCmdName();
            delete this.qryParam;
            delete this.qryName;
        }
    }

    getRequestUuid() {
        return this.getCmdParam().getRequestUuid();
    }

    public set processDiff(v: boolean) {
        this._processDiff = v;
    }

    public get processDiff() {
        return this._processDiff;
    }

    public set transaction(v: Transaction | null) {
        this._transaction = v;
    }

    public get transaction() {
        return this._transaction;
    }
}

export class TCADCmdParam<T extends Record<any, any> = {}> {

    private _params: T;
    private _name = '';

    constructor(name: string = '', params?: T) {
        this._name = name;
        this._params = params ?? {} as any;
    }

    public get extraData() {
        return this._params;
    }

    getCmdName(): string {
        return this._name;
    }

    setCmdName(name: string) {
        this._name = name;
    }

    getCmdInfo(): TCADCmdInfo {
        const cmdInfo = new TCADCmdInfo();
        cmdInfo.setCmdParam(this);

        return cmdInfo;
    }

    isQryCmd() {
        return false;
    }

    getRequestUuid() {
        return '';
    }

    setExtraData(data: T) {
        this._params = data;
    }
}

import { CmdBase } from '../command/cmd_base';

export class Transaction {
    public cmdName: string;
    public cmd: CmdBase;
    protected _view;
    // 增加一个额外属性，方便扩展
    public extraData: any;
    constructor(cmd: CmdBase, view: any) {
        this.cmd = cmd;
        this.cmdName = cmd.cmdName;
        this._view = view;
    }

    public async undo() {
        await this.cmd.onUndo();
    }

    public async redo() {
        await this.cmd.onRedo();
    }

    public dispose() {
        this._view = null;
        this.cmd = null;
        this.extraData = null;
    }

    get view() {
        return this._view;
    }
}

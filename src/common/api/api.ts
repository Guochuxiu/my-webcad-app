import axios, { AxiosInstance } from 'axios';
import { TCADCmdInfo } from '../command/cmd_param';

export class ApiBase {
    protected _request: AxiosInstance;
    constructor(baseURL:string = '/') {
        this._request = axios.create({ baseURL });
    }

    /** 提交CAD命令到后端 */
    async PostCADCmd<T>(cmd: TCADCmdInfo): Promise<T> {
        const url = cmd.CmdName;
        
        const res = await this._request.post(url, {
            ...cmd.getCmdParam().extraData ?? {}
        }, {
            headers: {
                'X-Transaction-Action': cmd.TransactionType
            }
        });
        
        return res.data?.data;
    }
}

import { CmdBase } from './cmd_base';
import { Base3DCanvas } from '../core/base_3d_canvas';

// 命令类构造函数
export type CommandClass<TParams = any> =
    new (...args: any[]) => CmdBase<TParams>;

// 从命令类构造函数中取出参数类型
export type CmdParamOfClass<T> =
    T extends new (...args: any[]) => CmdBase<infer P> ? P : never;

// 映射
export type CmdParamTypesOf<
    TMap extends Record<PropertyKey, CommandClass<any>>
> = {
    [K in keyof TMap]: CmdParamOfClass<TMap[K]>;
};

// 通用注册函数
export function registerCmds<
    TMap extends Record<PropertyKey, CommandClass<any>>
>(view: Base3DCanvas, map: TMap) {
    (Object.keys(map) as Array<keyof TMap>).forEach(key => {
        const Cmd = map[key];
        view.app.cmdManager.register(key as any, Cmd);
    });
}

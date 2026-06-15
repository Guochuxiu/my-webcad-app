# 业务 Command 扩展模板

## 适用场景

- 业务库需要新增交互命令
- 命令需要响应鼠标、键盘、snap、预览层或临时层

## 模板

```ts
import { FSApp } from '@fsdev/cadnginx';
import { BaseCommand } from './base_command';

export class BusinessCommand extends BaseCommand {
    public onExecute(...args: any[]) {
        // initialize command state
    }

    public onReceive(msg: string, param: any, fnKey?: any): boolean {
        if (super.onReceive(msg, param, fnKey)) return true;

        switch (msg) {
            case FSApp.Event.EN_MOUSE_EVENT_TYPE.L_BUTTON_DOWN:
                return this._onMouseDown(param);
            case FSApp.Event.EN_MOUSE_EVENT_TYPE.MOUSE_MOVE:
                return this._onMouseMove(param, fnKey);
        }

        return false;
    }

    protected _onMouseDown(param: any): boolean {
        return false;
    }

    protected _onMouseMove(param: any, fnKey?: any): boolean {
        return false;
    }

    public onCleanup() {
        super.onCleanup();
    }
}
```

## 必查点

- 是否注册到 `CommandManager`
- 是否需要 `freezeProcess()` / `unfreezeProcess()`
- 是否使用了 Temp / Preview layer
- 是否在 cleanup 中清掉预览对象和临时状态

## 常见错误

- 命令结束了但临时对象还留在场景里
- 异步命令没有冻结流程
- 命令只改数据，不触发实体 dirty

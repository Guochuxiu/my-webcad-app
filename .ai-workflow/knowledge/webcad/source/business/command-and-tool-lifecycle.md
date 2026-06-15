# Command / Tool 生命周期

本文约束下游业务库新增或审查 WebCAD command、交互工具、绘制命令、测量命令时的最小事实。先找真实 command 基类、注册入口和输入链，再写方案或代码。

## 源码用法摘要

- `fscadweb 模块：app\command\command.ts:23`：`Command` 基类定义 `execute/commit/cancel/receive/onExecute/onCancel/onCleanup/onReceive`。
- `fscadweb 模块：app\command\command.ts:35`：`execute()` 调用 `beginCommand()`、`onExecute(...)`、`afterCommand()`。
- `fscadweb 模块：app\command\command.ts:62`：`cancel()` 通过 `mgr.cancel(this)` 后调用 `onCancel()` 和 `onCleanup()`。
- `fscadweb 模块：app\command\command.ts:81`：`receive(msg, param, fnKey)` 转给 `onReceive(...)`。
- `fscadweb 模块：app\command\commandmanager.ts:83`：`CommandManager.register(...)` 注册公共 command 类型。
- `fscadweb 模块：app\command\commandmanager.ts:181`：`CommandManager.execute(...)` 开始新命令前会提交当前命令。
- `fscadweb 模块：app\command\commandmanager.ts:262`：`CommandManager.cancel(...)` 只支持取消当前 active command。
- `fscadweb 模块：app\command\commandmanager.ts:298`：`receive(...)` 只路由给 `current` command。
- `fscadweb 模块：app\command\commandmanager.ts:338`：键盘事件通过 `current?.receive(hotkey.type, hotkey)` 进入命令。
- `fscadweb 模块：app\inputstack.ts:23`：`InputStack.addObserver(...)` 按 priority 插入 observer。
- `fscadweb 模块：app\inputstack.ts:48`：`InputStack.processKeyboardEvent(...)` 反向遍历 observer，命中 consumed 后短路。
- `fscadweb 模块：app\app.ts:214`：App 将 `cmdManager` 加入 canvas 的 `inputStack`。
- `fscadweb 模块：app\command\registerCommand.ts:9`：`registerCmd(...)` 装饰器会调用 `App.getInstance()?.cmdManager.register(...)`。
- `cadnginx 模块：command\base_command.ts:8`：`BaseCommand` 继承 `FSApp.Command.Command`，按鼠标/键盘消息分发到 `_onMouseDown/_onMouseMove/_onActionKeydown`。
- `cadnginx 模块：command\planarCommands\cmdDrawing\cmd_drawing_base.ts:26`：绘制基类 `onCleanup()` 重置 step 并清临时图层。
- `cadnginx 模块：command\planarCommands\cmdDrawing\cmd_drawing_base.ts:38`：临时图形通过 `clearEntitiesByLayer(Temp/Preview)` 清理。
- `cadnginx 模块：view\cad_3d_canvas.ts:132`：`Cad3DCanvas._registerCommands()` 把内置命令注册到 `app.cmdManager`。
- `cadnginx 模块：view\cad_3d_canvas.ts:141`：`_registerHotkey()` 使用 `Mousetrap.bind(...)` 把数字键转给 `inputStack.processKeyboardEvent(...)`。

## 生命周期链路

1. **注册**：命令必须进入当前 app 的 `CommandManager`。可用路径包括 `cmdManager.register(...)`、`registerCmd(...)` 装饰器，或当前业务库已有的集中 `registerCmds(...)` 封装。
2. **执行**：运行时应通过 `CommandManager.execute(...)` 或封装后的 `executeCommand(...)` 创建和执行命令，不要在 UI handler 中直接调用命令内部方法伪造生命周期。
3. **当前命令**：`CommandManager.current` 是鼠标、键盘、提交、取消的路由目标。开始新命令时，`execute(...)` 会先 `commit()` 旧命令；设计连续绘制时要明确是否允许旧命令自动提交。
4. **输入**：鼠标/键盘先进 canvas `inputStack`，再由 `CommandManager` 转给 `current.receive(...)`。如果命令依赖 `Esc`、`Enter`、数字键或自定义快捷键，必须核实 hotkey 是否真的进入 `inputStack`。
5. **取消**：`cancel()` 和 `externalCancel()` 都会触发 `onCancel()` 和 `onCleanup()`；不要把预览清理只放在提交路径。
6. **清理**：`onCleanup()` 是释放 command 持有资源的主位置，包括 preview entity、临时图层、timer、AbortController、signal listener、DOM listener、hover/selection 临时状态。
7. **临时预览**：绘制类命令示例中，临时图形放在 `LayerType.Temp` 或 `LayerType.Preview`，清理时通过 `app.clearEntitiesByLayer(...)` 移除。

## 正例

```ts
class CmdDrawBusiness extends CadDrawingBase {
  public onCleanup(): void {
    super.onCleanup();
    // 本命令只清自己持有的交互状态；临时图层清理由 CadDrawingBase.clear() 统一完成。
    this.previewEntity = undefined;
  }

  public onReceive(msg: string, param: any): boolean {
    if (msg === FSApp.Event.EN_KEYBOARD_EVENT_TYPE.KEY_DOWN && param.key === 'Escape') {
      this.cancel();
      return true;
    }

    return super.onReceive(msg, param);
  }
}
```

要点：

- 先继承当前仓库真实基类，再按 `onReceive(...)` 消费输入。
- 预览图形使用已有临时图层或已有 preview entity/display，不直接塞裸 Three 对象到 scene。
- 清理逻辑覆盖 confirm、cancel、repeat、view clear、命令被新命令替换的路径。
- 快捷键依赖必须同时检查 `Cad3DCanvas._registerHotkey()` 或业务自己的 hotkey bridge。

## 反例

```ts
button.onclick = () => {
  // 绕过 CommandManager，无法接入 current.receive、cancel、signalCommandStart/Terminated。
  entity.setWorldPosition(nextPosition);
  scene.add(previewMesh);
};
```

问题：

- 绕过 `CommandManager.execute(...)` 后没有统一 cancel/commit/onCleanup。
- `previewMesh` 不在 `LayerType.Temp/Preview` 或 document/display 链，`clear()` / `destroyView()` 后容易残留。
- UI 直接持有 Three 对象，参数链不能被命令复用、回放或审查。

## 审查清单

- 命令类型是否真的注册到了当前 app/view 的 command manager。
- UI/handle 是否通过现有执行入口启动命令，而不是直接改模型或 scene。
- `execute/onExecute` 是否校验参数、view、目标 entity，失败时能快速退出并清理。
- 交互命令是否覆盖 `receive/onReceive` 的鼠标、键盘、确认、取消、回退路径。
- `cancel/onCancel/onCleanup` 是否释放 preview、Temp/Preview 图层、timer、signal、DOM listener。
- 键盘命令是否确认 `Mousetrap` 或业务 hotkey bridge 会转到 `inputStack.processKeyboardEvent(...)`。
- 开始新命令自动提交旧命令是否符合业务预期；不符合时需要显式取消或阻止。
- 异步命令使用 `freezeProcess/unfreezeProcess` 时，异常路径是否解除冻结。

## 最小验证

- 注册后通过当前业务 handle 或 `app.cmdManager.executeCommand(...)` 能创建并进入 `current`。
- 缺失参数执行时不生成半成品 entity、preview 或 listener。
- 鼠标输入能到 `current.receive(...)`；键盘 `Esc` 或指定 hotkey 能到 `current.receive(...)`。
- 确认路径只提交一次；取消路径调用 `onCancel()` 和 `onCleanup()`。
- 连续执行两次命令后，上一轮 `LayerType.Temp/Preview` 无残留。
- 开始另一个命令、调用 `clear()`、切换 view 或禁用输入后，临时预览和 observer/listener 不继续响应。

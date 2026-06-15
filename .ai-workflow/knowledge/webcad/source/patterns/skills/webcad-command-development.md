---
name: webcad-command-development
description: 在下游业务库中开发通用 WebCAD command。用于新增命令类型、命令类、命令注册、执行参数、交互式命令状态、预览、确认/取消、清理、undo/redo，并按当前仓库命令体系接入。
---

# WebCAD Command 开发

使用本模板时，目标是按当前仓库已有命令体系新增一个 command。先识别当前仓库的基类、注册方式和执行方式，再决定参数、事务、交互和清理策略。

代码产出或实测时，必须使用目标仓库真实存在的 command 基类、构造参数、执行方法、注册函数和调用入口。找不到时停止并说明证据不足，不要用 `CurrentCommandBase`、`XxxCanvas` 等占位结构冒充可落地代码。

优先参考 `webcad-weld` 的标准业务库模式：业务命令继承 `CmdBase<TParam, TCanvas>` 或业务封装基类，主要业务入口是 `commit()`；命令类由 `CMD_CLASS_MAP` 统一收集，再通过 `registerCmds(view, CMD_CLASS_MAP)` 注册到 canvas 的 `app.cmdManager`。

## 查找锚点的方法

按下面方式在当前仓库找同类模式：

- 找命令基类：搜索 `extends CmdBase`、`class Cmd`、`commit()`、`onCleanup`、`onReceive`。
- 找命令类型：搜索 `CMD_TYPES`、`CommandType`、`cmdType`、`register(`。
- 找注册入口：搜索 `cmd_register`、`CMD_CLASS_MAP`、`registerCmds`、`registerCmd(this)`、`cmdManager.register`。
- 找执行入口：搜索 `executeCommand`、`executeAsyncCmd`、`executeCmd`、`sendCommandAction`、`cmdManager.receive`。
- 找交互命令：搜索 `onReceive`、`receive(`、`BeginCommandAction`、`CMD_ACTIONS`、`preview`、`cancel`、`submitCommand`、`onCancel`、`onMouseMove`、`onMouseDown`。
- 找 undo/redo：搜索 `onUndo`、`onRedo`、`undo`、`redo`、`transaction`、`diff`。

如果当前仓库依赖底座 command 系统，优先在已安装包、工作区源码或类型声明中查找 command 基类、事件分发和 app 调用方式。不要写死本机绝对路径；如果底座源码不可用，只引用当前仓库可验证的封装和类型。

`TCADCmdParam`、`TCADCmdInfo`、`TransactionType` 等属于可选封装，仅在当前仓库已有同类模式时使用。

### 底座源码锚点

当目标仓库使用 `@fsdev/cadnginx` / `@fs/fscadweb` command 链时，优先对照这些真实锚点：

- `fscadweb 模块：app\command\command.ts:35`：`Command.execute(...)` 调用 `beginCommand()`、`onExecute(...)`、`afterCommand()`。
- `fscadweb 模块：app\command\command.ts:62`：`Command.cancel(...)` 调用 manager cancel、`onCancel()`、`onCleanup()`。
- `fscadweb 模块：app\command\command.ts:81`：`Command.receive(...)` 转给 `onReceive(...)`。
- `fscadweb 模块：app\command\commandmanager.ts:181`：`CommandManager.execute(...)` 开始新命令前会 `commit()` 当前命令。
- `fscadweb 模块：app\command\commandmanager.ts:298`：`CommandManager.receive(...)` 只把消息发给 `current`。
- `fscadweb 模块：app\inputstack.ts:48`：`InputStack` 对键盘事件反向遍历 observer 并按 consumed 短路。
- `fscadweb 模块：app\app.ts:214`：App 将 `cmdManager` 注册进 canvas `inputStack`。
- `cadnginx 模块：view\cad_3d_canvas.ts:141`：内置数字热键通过 `Mousetrap` 转给 `inputStack.processKeyboardEvent(...)`。
- `cadnginx 模块：command\planarCommands\cmdDrawing\cmd_drawing_base.ts:26`：绘制命令 `onCleanup()` 重置 step 并清理临时图层。

## 通用组成

一个 command 通常需要这些组成，但名字以当前仓库为准：

- 命令标识：字符串、枚举或常量对象，例如 `XXX_CMD_TYPES.DoSomething`。
- 命令类：继承当前命令基类，例如 `CmdBase`、`FSApp.Command.Command` 或业务命令基类。
- 执行入口：业务库常见为 `commit()`；底座原生命令也可能使用 `onExecute(...)`。
- 注册入口：业务库推荐 `cmd_register.ts` 中的 `CMD_CLASS_MAP` + `registerCmds(...)`。
- 调用入口：UI 通过 `BaseViewHandle.executeCommand(...)` 或业务 handle 方法执行。
- 清理入口：通常是 `onCleanup()`、`dispose()` 或命令结束回调。
- 可选能力：undo/redo、后端事务、diff 应用、交互式输入、预览对象。

## 一次性 Command 开发步骤

1. 定义命令标识，放在当前仓库已有 command type 文件或同类模块中。
2. 新增 command 类，继承当前链路实际使用的命令基类。
3. 设计命令参数类型 `TParam`：优先传 DTO，不传 display/DOM/Three object。
4. 在 `commit()` 开头校验 `this._view`、`this._params` 和目标 entity 是否存在。
5. 通过 document/model/canvas/app/api 的现有方法做变更。
6. 在 canvas、app 或集中注册文件中注册 command。
7. 从 UI/handle/observer 通过现有执行入口调用 command。
8. 如需撤销重做，复用当前仓库已有 undo/redo、transaction 或 diff 模式。
9. 在清理入口释放 preview、selection 临时状态、timer、signal 或 listener。

## 决策检查点

- 如果找不到命令基类或注册入口，先停在方案，不要新增无法执行的 command。
- 如果执行参数类型不明，先从调用入口和已有命令推导 DTO，不要把 display、DOM 或 Three 对象作为默认参数。
- 如果 command 涉及交互状态，先确认 cancel/back/finish/cleanup 事件是否存在。
- 如果涉及 undo/redo 或 transaction，必须找到当前仓库真实模式；找不到时不要宣称已支持。

## 一次性 Command 骨架

```ts
export enum CMD_TYPES {
  DO_BIZ = 'doBiz',
}

export interface DoBizParams {
  id: string;
}

export class CmdBizBase<P> extends CmdBase<P, BizCanvas> {
  protected async _getShapeData(ids: number[]) {
    await this._view.adapter.loadModelData(ids);
    return [];
  }
}

export class CmdDoBiz extends CmdBizBase<DoBizParams> {
  async commit() {
    if (!this._params?.id) {
      this.cancel();
      return;
    }

    try {
      const resp = await this._view.api.doBiz(this._params);
      if (resp.status !== 0) {
        this.cancel();
        return;
      }

      await this._applyData(resp.data);
      this._view.fitView(resp.data.added, [200, 200, 200, 200]);
      this._view.select(resp.data.added);
    } catch (error) {
      console.error('业务命令失败', error);
    } finally {
      super.commit();
    }
  }

  public onCleanup(): void {
    // 清理本 command 持有的临时状态、AbortController、timer、preview 等。
    super.onCleanup();
  }
}
```

注册文件：

```ts
export const BIZ_CMD_CLASS_MAP = {
  [CMD_TYPES.DO_BIZ]: CmdDoBiz,
} satisfies Record<CMD_TYPES, CommandClass<any>>;

export type BizCmdParamTypes = CmdParamTypesOf<typeof BIZ_CMD_CLASS_MAP>;

export function registerCmd(view: BizCanvas) {
  registerCmds(view, BIZ_CMD_CLASS_MAP);
}
```

## 交互式 Command

常见 WebCAD command 交互事件流：

```text
UI/Canvas/InputStack -> cmdManager.current.receive(msg, param, fnKey) -> command.onReceive(msg, param, fnKey)
```

新增交互式 command 时，优先复用当前仓库的 `receive/onReceive` 事件流。

键盘或快捷键不是命令类天然拥有的能力。若命令依赖 `Esc`、`Enter`、数字键或自定义 hotkey，必须同时确认：

- view 或业务层已经把对应键盘事件转发给 `inputStack.processKeyboardEvent(...)`。
- `CommandManager` 已作为 observer 加入当前 canvas 的 `inputStack`。
- 若存在 gizmo、selection、observer 等更高优先级 observer，要评估 consumed 短路后命令是否还能收到事件。

### 常见底座关键事实

- app 通常提供 `executeCmd` / `executeAsyncCmd` / `cmdManager.execute` 一类入口创建并执行 command。
- UI 或 canvas 通常通过 `cmdManager.current?.receive(action, param)` 或等价 API 给当前 command 发送动作。
- 开始新交互命令前，常见做法是取消旧命令，避免 preview 或 step 状态遗留。
- command 基类可能通过 `onReceive(msg, param, fnKey)` 分发鼠标/键盘事件。
- `CMD_ACTIONS` 或等价常量提供 UI 动作语义，例如输入、确认、取消、回退。
- 绘制类 command 常持有 `step`、`previewEntity`、`wcsPt`、`geoInfo`，完成或取消时必须清理临时层。

### 事件分发骨架

```ts
export class CmdBizInteractive extends CmdBizBase<BizInteractiveParams> {
  public onReceive(msg: string, param: unknown, fnKey?: FnKey): boolean {
    switch (msg) {
      case FSApp.Event.EN_MOUSE_EVENT_TYPE.CLICK:
        return this.onMouseClick(param, fnKey);
      case FSApp.Event.EN_MOUSE_EVENT_TYPE.MOUSE_MOVE:
        return this.onMouseMove(param, fnKey);
      case FSApp.Event.EN_MOUSE_EVENT_TYPE.L_BUTTON_DOWN:
        return this.onMouseDown(param, fnKey);
      case FSApp.Event.EN_MOUSE_EVENT_TYPE.L_BUTTON_UP:
        return this.onMouseUp(param, fnKey);
      case FSApp.Event.EN_MOUSE_EVENT_TYPE.R_BUTTON_DOWN:
        return this.onRightMouseDown(param, fnKey);
      case FSApp.Event.EN_KEYBOARD_EVENT_TYPE.KEY_DOWN:
        return this.onKeyDown(param, fnKey);
      case BizCommandEvent.Cancel:
        this.cancel();
        return true;
      case BizCommandEvent.Back:
        return this.back();
      case BizCommandEvent.Finish:
        return this.finish();
      default:
        return this.onCommandAction(msg, param, fnKey);
    }
  }
}
```

`BizCommandEvent` 替换为当前业务命令事件常量；鼠标/键盘事件优先使用底座 `FSApp.Event.EN_MOUSE_EVENT_TYPE` / `EN_KEYBOARD_EVENT_TYPE`。

### 交互命令状态

```ts
export class CmdDrawLikeSomething extends CmdBizBase<DrawParams> {
  public canRepeat = true;
  protected step = 0;
  protected previewEntity?: PreviewEntity;
  protected geoInfo?: DrawGeometryInfo;
}
```

### 交互式 Command 骨架

```ts
export class CmdDrawLikeSomething extends CmdBizBase<DrawParams> {
  public canRepeat = true;
  protected step = 0;
  protected previewEntity?: PreviewEntity;
  protected geoInfo?: DrawGeometryInfo;

  public onCleanup(): void {
    super.onCleanup?.();
    this.step = 0;
    // 命令结束、取消、被新命令替换时都必须清除临时预览，避免 Temp/Preview 图层残留。
    this.clearPreview();
  }

  public onCancel(options?: unknown): void {
    super.onCancel?.(options);
    // 取消路径不要只依赖 submit/commit；预览和监听需要在 cancel 中同样释放。
    this.clearPreview();
  }

  protected onMouseMove(pos: FSMath.Vector2): boolean {
    const worldPoint = this._view.getCursorVertex?.(pos) ?? this._view.screenToWcs(pos);
    this.updatePreview(worldPoint);
    return true;
  }

  protected onMouseDown(pos: FSMath.Vector2): boolean {
    const worldPoint = this._view.getCursorVertexPrecise?.(pos) ?? this._view.screenToWcs(pos);
    if (this.step === 0) {
      this.setStartPoint(worldPoint);
      this.step = 1;
      return true;
    }

    this.setEndPoint(worldPoint);
    this.createGeoInfo();
    void this.submitCommand(this.geoInfo);
    return true;
  }

  protected onKeyDown(key: string): boolean {
    if (key === 'Escape' || key === 'esc') {
      this.cancel();
      return true;
    }
    return false;
  }

  public async submitCommand(param?: DrawGeometryInfo): Promise<unknown> {
    await this.onSubmit(param);
    if (this.canRepeat) this.onCleanup();
    return param;
  }

  protected clearPreview(): void {
    this.previewEntity?.removeFromParent?.();
    this.previewEntity = undefined;
    this._view.app.clearEntitiesByLayer?.(FSApp.View.Three.LayerType.Temp, this._view);
    this._view.app.clearEntitiesByLayer?.(FSApp.View.Three.LayerType.Preview, this._view);
  }
}
```

### 反例：绕过 CommandManager

```ts
// 这个写法不会成为 current command，也收不到 inputStack 转发的键鼠消息。
button.onclick = () => {
  view.scene.add(previewMesh);
  target.setWorldPosition(next);
};
```

问题：

- 没有 `execute/cancel/onCleanup` 生命周期。
- 临时 Three 对象不在 `LayerType.Temp/Preview` 或 document/display 链。
- 新命令开始、Esc、view clear、destroy 后都没有统一清理点。

### UI/Handle 动作接入

```ts
// 开始命令：BaseViewHandle.executeCommand 最终会走 app.executeAsyncCmd(cmdType, [canvas, params])
handle.executeCommand(CMD_TYPES.DrawLikeSomething, options);

// UI 面板或快捷键给当前活动命令发送动作
handle.sendCommandAction(BizCommandEvent.Back);
handle.sendCommandAction(BizCommandEvent.Finish);
handle.sendCommandAction(BizCommandEvent.Cancel);
handle.sendCommandAction(BizCommandEvent.UpdateParams, inputValue);
```

底座 `CadApp.BeginCommandAction(...)` 或 `cmdManager.current.receive(...)` 只在目标仓库已有同类入口时使用。

## 可选适配点

以下能力按当前仓库已有模式选用：

- 参数封装：例如 `TCADCmdParam`、`TCADCmdInfo` 或其他 command param class。
- 后端事务：例如 `TransactionType.Open/Commit/Abort` 或自定义 transaction manager。
- Diff 应用：例如 `added/removed/modified` 后再拉取模型数据并刷新 document。
- 自动完成：例如业务库自行扩展的 `autoComplete()`。
- 鼠标自处理：例如业务库自行扩展的 `selfProcessMouseEvent`；如果底座已有 `receive/onReceive`，优先复用底座事件流。
- 事件总线：例如 `signalEventBus.dispatch(...)`。
- 临时显示层：例如 `addTemp`、`LayerType.Preview`、preview entity/display。

## 失败与回退

- 找不到 command 注册函数：先补查 app/canvas 初始化，不把 command 类孤立落地。
- 找不到交互事件常量：先实现一次性 command；交互式 command 降级为方案说明。
- 找不到 preview 临时层：preview 只使用当前仓库已有临时 entity/display 或跳过 preview。
- 找不到 undo/redo 模式：把 undo/redo 明确列为“不支持/待补证据”，不要模拟一套新机制。

## 验证清单

- 注册后命令能通过当前 command manager 执行。
- 参数缺失时快速失败，不产生半成品状态。
- 一次性 command 不遗留 preview、selection、timer、listener。
- 交互式 command 的 start/input/back/confirm/cancel/cleanup 都可重复执行。
- 确认只提交一次，取消不提交。
- view 切换、clear、destroy、escape、blur 后能清理交互状态。
- 如果接入 undo/redo、transaction 或 diff，必须用当前仓库已有模式验证。

## 实测 Prompts

- “新增一个一次性 command，要求从 handle 调用并通过 canvas 注册路径执行。”
- “新增一个两步交互式绘制 command，要求支持 preview、back、finish、cancel 和 cleanup。”
- “审查一个 command 是否把 UI/DOM/display 对象作为参数传入，并给出替代 DTO 设计。”

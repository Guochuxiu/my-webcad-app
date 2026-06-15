---
name: webcad-handle-layer-development
description: 在下游业务库中开发通用 WebCAD handle 层 API。用于基于 BaseViewHandle 或业务 ViewHandle 封装 canvas、command、selection、load、clear、dispose、signal hook，并向 Vue/UI 暴露稳定方法。
---

# WebCAD Handle 层开发

使用本模板时，目标是在 UI 和 canvas 内部之间建立稳定 API，不让 Vue 组件直接操作底座细节。

代码产出或实测时，必须使用目标仓库真实存在的 handle 基类、view factory、executeCommand/sendCommandAction、signal hook 和 dispose 方式。找不到时停止并说明证据不足，不要用 `CurrentBaseViewHandle`、`CurrentCanvas`、`XxxViewHandle` 等占位结构冒充可落地代码。

优先参考 `webcad-weld` 的标准业务库模式：`WebCadApiBase<TCmdMap>` 管理 app 和 view handle，业务 handle 继承 `BaseViewHandle<TCanvas>`；一次性业务动作走 `executeCommand(cmd, params)`，长生命周期命令进入后通过 `sendCommandAction(event, payload)` 更新状态。

## 先找锚点

不要假设业务库目录固定。先在当前工作区搜索：

- handle 基类：`BaseViewHandle`、`ViewHandle`、`getViewKey`、`executeCommand`。
- 创建入口：`createView(...)`、`createViewHandle(...)`、`createCanvas(...)`、`canvasMap`、`view factory`。
- 业务 handle：`*view_handle*`、`*ViewHandle*`、`new .*Handle`。
- UI 调用点：直接访问 `app`、`view`、`canvas`、`cmdManager`、`selection` 的页面或适配层。

## 常用 API

- `new BaseViewHandle(viewKey, canvas)`：绑定 view key 与 canvas。
- `handle.canvas` 或受保护 `_canvas`：访问底层 canvas。
- `dispose()`：释放 handle 持有的 signal hook 并 dispose canvas。
- `executeCommand(cmdType, params)`：handle 对 UI 暴露一次性业务动作时调用 command。
- `sendCommandAction(action, payload)`：给当前活动的长生命周期 command 发送 action。
- 当前仓库的 clear/document clear/entity remove/view dispose 方法：清理能力要封装为明确方法。
- `signal.listen(...)` / signal hook 容器：订阅 canvas/app signal 并在 dispose 释放。

## 开发步骤

1. 先列 UI 真正需要的方法，形成最小 API 面。
2. 新增业务 handle 继承 `BaseViewHandle<BizCanvas>` 或当前仓库已有 handle。
3. 每个 public 方法都做参数校验和 view 存活检查。
4. 读状态的方法返回 DTO。
5. 写状态的方法优先调用 command；长命令中的状态更新用 `sendCommandAction`；纯视图临时行为才调用 canvas/manager 方法。
6. signal 订阅必须通过 hook 容器或本类字段集中管理，并在 `dispose()` 释放。
7. 在 view factory 中返回业务 handle。

## 最小代码骨架

```ts
export class BizViewHandle extends BaseViewHandle<BizCanvas> {
  constructor(viewKey: string, canvas: BizCanvas) {
    super(viewKey, canvas);
  }

  public executeCommand<K extends CMD_TYPES>(cmdName: K, params?: BizCmdParamTypes[K]): Promise<any> {
    return super.executeCommand(cmdName, params);
  }

  public async doSomething(params: DoSomethingParams): Promise<void> {
    if (!params) throw new Error('doSomething requires params');
    await this.executeCommand(CMD_TYPES.DO_SOMETHING, params);
  }

  public enterLongCommand(params?: LongCommandParams): Promise<any> {
    return this.executeCommand(CMD_TYPES.LONG_COMMAND, params);
  }

  public updateLongCommand(payload: LongCommandPayload): void {
    this.sendCommandAction(BizCommandEvent.Update, payload);
  }

  public getSelectedIdsByType(type: number): number[] {
    const selection = this._canvas.app.selection;
    return selection.selected
      .filter(entity => entity instanceof CtorMap[type as keyof typeof CtorMap])
      .map(entity => entity.id);
  }

  public setSelectionMode(mode: number[]): void {
    this._canvas.pickHelper.use(mode);
  }

  public override async dispose(): Promise<void> {
    await super.dispose();
  }
}
```

## View factory 模板

```ts
protected async createViewHandle(viewKey: string, domElement: HTMLElement, configOptions?: any) {
  const canvas = await this._app.createView(viewKey, BizCanvas, { domElement, app: this._app, configOptions });
  return new BizViewHandle(viewKey, canvas);
}
```

## API 设计规则

- UI-facing 方法名用业务动作名，但参数和返回值保持 DTO 化。
- 返回 DTO 或稳定接口，封装 commandManager、scene、display registry、private manager。
- 如果必须暴露底层对象，方法名要明确如 `getUnsafeCanvas()`，并在调用方控制范围内使用。
- 多 view 时每个 handle 绑定唯一 viewKey/canvas，不用全局单例缓存当前 view。
- 不要在 handle 里直接创建 entity/display；需要模型变更时进入 command。
- 长命令交互接口只发送 action，不直接改命令内部字段。

## 决策检查点

- 如果 UI 需要的方法超过当前 handle 能力，先把 API 面列成清单，再决定是否新增 command/canvas 能力。
- 如果找不到 view factory 或 handle 创建入口，不要新增孤立 handle 类。
- 如果写状态方法需要直接操作 canvas 私有字段，优先改为 command 或 canvas public API。

## 失败与回退

- 找不到清理 API：只暴露当前仓库已有的 dispose、document clear 或等价清理能力，不编造不存在的方法名。
- 找不到 signal hook 容器：用本类字段保存 unsubscribe/dispose 句柄，并在 `dispose()` 统一释放。
- view 复用策略不明：不要缓存全局 current handle，按 viewKey/canvas 实例绑定。

## 验证清单

- UI 只依赖 handle。
- dispose 后 signal/listener 不再触发。
- view 复用后 handle 不指向旧 canvas。
- 参数校验在 handle 边界完成。
- command 调用路径与 canvas 注册路径一致。

## 实测 Prompts

- “为一个 canvas 新增 UI handle API，要求 UI 不直接访问 cmdManager 或 displayMap。”
- “审查一个 handle 是否在 dispose 后仍保留 signal/listener。”
- “当前仓库没有统一 clear 方法时，handle 应该如何暴露清理能力？”

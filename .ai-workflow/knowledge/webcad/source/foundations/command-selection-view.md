# Command、Selection 与 View 协作

## 这篇文档给谁用

给正在开发“新的业务库”的人使用。  
重点是告诉你：业务命令、业务交互、业务选择行为，应该如何接到现有底座上，而不是自己再造一套。

## App 与 CommandManager

源码：

- `fscadweb 模块：app/app.ts`
- `fscadweb 模块：app/command/commandmanager.ts`
- `cadnginx 模块：app.ts`

关键事实：

- `FSApp.App` 持有 `doc`、`cmdManager`、`selection`、`_viewMap`
- `App.createView()` 会初始化 Canvas 并把 `cmdManager` 挂到 `inputStack`
- `CommandManager.execute()` 在有当前命令时会先 `commit()` 再启动新命令
- `freezeProcess()` / `unfreezeProcess()` 用于异步操作期间冻结命令流程
- `CadApp` 增加了 `executeCmd()`、`executeAsyncCmd()`、`cmdUpdateSignal`、`snapEngine`

对业务库的意义：

- 你的业务命令默认应该接到 `CommandManager` 上
- 如果命令里有异步流程，要考虑 freeze / unfreeze
- 如果业务库封装自己的 App，优先继续复用 `CadApp` 的命令入口和信号，而不是新造命令系统

## Command 基类事实

源码：`fscadweb 模块：app/command/command.ts`

关键事实：

- `execute()` 内部会调用 `beginCommand()`、`onExecute()`、`afterCommand()`
- `commit()`、`cancel()` 最终都通过 manager 协调
- `externalCommit()` / `externalCancel()` 会调用 `onComplete()` / `onCancel()` 后再 `onCleanup()`
- `receive()` 由 manager 转发消息给当前活动命令

对业务库的意义：

- 业务命令应把业务逻辑放在 `onExecute()` 和 `onReceive()` 中
- 资源清理要放在 `onCleanup()`，不要散落在外部
- 自动完成型命令与长生命周期交互命令，需要明确区分

## Selection 事实

源码：`fscadweb 模块：app/selection/Selection.ts`

关键事实：

- `select()` 和 `hover()` 默认递归处理后代
- 选择和悬停最终靠 `EntityFlagEnum.selected` / `hover` 标记实体
- `signalSelected` 和 `signalHovered` 发的是 id 列表，而不是 display
- `resetAll()` 只会清理实体 flag，不会清空内部 `_selectSet` / `_hoverSet`

对业务库的意义：

- 选择系统的真实状态在 Entity flag 上，不在某个 UI 容器上
- 业务库如果要扩展选择行为，优先沿着 entity flag 做，而不是自己维护第二套 selected state
- 如果实现依赖“完全重置选择状态”，需要额外确认内部 set 是否同步清空

## ThreeCanvas 事实

源码：`fscadweb 模块：app/view/three/three_canvas.ts`

关键事实：

- 图层枚举为 `Environment / Model / Batch / Preview / Gizmo / Temp`
- `ThreeCanvas` 默认注册一批基础 display
- 暴露 `signalSelectChange`、`signalHoverChange`、`signalCameraChange`、`signalCameraZoom`、`signalResize`
- `addDisplayToLayer()` 把 display 放进指定 layer，同时把 entity 再次加入 `Document`
- `renderNewFrame()` 先更新动画和 display，再根据 `_dirty` 决定是否真正 render

对业务库的意义：

- 业务库里的对象要明确放入哪个 layer
- 业务交互不能只改数据不让 Canvas 变 dirty
- 业务库如果扩展新的 Canvas，应尽量沿用这套图层和刷新语义

## Cad3DCanvas 事实

源码：`cadnginx 模块：view/cad_3d_canvas.ts`

关键事实：

- 构造函数里注册了大量业务 `Entity -> Display` 映射
- 会把 `app.nodeRoot` 直接加入模型层
- 会注册命令、热键、TransformGizmo 及其 observer

对业务库的意义：

- 业务扩展常常不是“只加一个类”就结束，通常还要补 Canvas 注册和命令注册
- 如果你要做自己的业务 Canvas，优先在 `Cad3DCanvas` 基础上继续加注册和编排

## 业务库新增交互时的最小自检

- 新命令是否通过 `CommandManager.register()` 注册
- 新业务 `Entity / Display` 是否在对应 Canvas 中注册
- 新选择行为是否正确落在 entity flags 上
- 异步命令是否需要 freeze / unfreeze 包裹
- 是否错误绕开了已有的 `CadApp -> CommandManager -> Canvas -> Selection` 链路

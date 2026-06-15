# CadApp 与业务 Canvas

## 这篇文档给谁用

给正在开发“新的业务库”的人使用。  
重点不是告诉你如何修改 `cadnginx`，而是告诉你在自己的业务库里应如何理解和复用 `CadApp`、`Cad3DCanvas` 和相关能力。

## CadApp 事实

源码：`cadnginx 模块：app.ts`

关键事实：

- `CadApp extends FSApp.App`
- 构造时创建 `nodeRoot: FSCore.Model.Group` 并加入文档
- `addView(container, canvas, tag, configOptions)` 优先复用已有 view；复用时调用 `createNewRender()` 和 `dirty()`
- `destroyView(tag)` 当前只执行 `destroyRender()` 和 `deactiveInput()`，不会从 `_viewMap` 删除
- `executeCmd()` 走 `cmdManager.createCommand()` + `execute()`
- `executeAsyncCmd()` 监听 `signalCommandTerminated`，按 command 对象匹配结果
- `dispose()` 当前不是彻底销毁，只是停输入并清理部分 layer 实体

## 对下游业务库的意义

- 如果你的业务库需要多视图复用，要注意 `destroyView()` 不是完全删除
- 如果你的业务库要封装自己的 App，可以优先在 `CadApp` 之上继续包装，而不是从 `FSApp.App` 重新起一套
- 如果你的业务库设计依赖“彻底释放应用”，不能直接把 `CadApp.dispose()` 当成完整语义

## Cad3DCanvas 事实

源码：`cadnginx 模块：view/cad_3d_canvas.ts`

关键事实：

- 业务 Canvas 继承 `FSApp.View.Three.Canvas3D`
- 在构造函数中集中注册业务 display
- 默认添加 `nodeRoot`
- 默认注册 `MeasureCommand`
- 支持 TransformGizmo 启停、热键绑定、场景创建器切换

## 你在业务库里通常怎么用

- 继承 `Cad3DCanvas`
- 追加你自己的 `registerDisplayType()`
- 增加你自己的命令注册、observer、默认场景逻辑
- 让你的业务对象进入 `nodeRoot` 或模型层，而不是重新搭一套平行体系

## SnapEngine 事实

源码：`cadnginx 模块：snap/snap_engine.ts`

关键事实：

- `SnapEngine` 是静态单例
- `getInstance(view, strategyPriorityMap)` 只在第一次构造时真正使用参数
- `snap()` 依赖 view 的拾取能力，临时扩大 pick size 后再恢复

## 对下游业务库的意义

- 如果你的业务库有多视图或多配置场景，SnapEngine 单例是重点风险项
- 如果你的业务库要定制 snap 策略，优先考虑在现有单例约束下扩展，而不是假设每个 view 都有独立实例

## 业务库常见扩展点

- 新业务 `Entity / Display`
- 新命令与交互 observer
- 新 gizmo、snap strategy、scene creator、loader
- 新配置项与业务默认值

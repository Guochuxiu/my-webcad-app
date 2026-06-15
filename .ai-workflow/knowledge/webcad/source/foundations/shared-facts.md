# 共享高价值事实

这份文档只保留业务开发里最容易影响方案和实现方向的高价值事实。
默认在任何任务开始时先读这份文档，而不是扫完整套知识库。

## 包与导出

- `@fsdev/cadnginx` 对外统一导出 `CadApp`、`FSApp`、`FSCore`、`FSMath`
- 源码基线：`src/index.ts`

## App 与视图

- `CadApp extends FSApp.App`
- `CadApp` 构造时创建 `nodeRoot` 并加入 document
- `CadApp.addView(container, CanvasClass, tag, configOptions)` 会优先复用同 tag 的 view
- 已有 view 复用时只做 `createNewRender(container)` 和 `dirty()`
- `CadApp.destroyView(tag)` 当前只做 `destroyRender()` 和 `deactiveInput()`，不会从 `_viewMap` 删除 view
- 源码基线：`src/app.ts:32`、`src/app.ts:65`、`src/app.ts:90`、`src/app.ts:126`

## 模块与注册

- `CadApp.use(modules)` 约定模块暴露 `install(app)` 入口
- `Cad3DCanvas` 在构造阶段集中注册 display、命令、gizmo，并默认把 `nodeRoot` 加到场景
- 新增 `Entity/Display/Command` 后，必须补齐注册链，否则运行时不会正确显示或执行
- 源码基线：`src/app.ts:180`、`src/view/cad_3d_canvas.ts:60`

## Display 与实体树

- display 创建遵循 `Entity -> Display` 映射
- `App.createDisplay()` 会递归镜像 entity tree
- `Loader.generateEntity()` 会递归把 `THREE.Object3D` 树转成 entity 树
- 这意味着业务库应优先把对象接入 document 和现有注册链，而不是直接往 scene 塞裸 `Object3D`

## 单例与状态风险

- `SnapEngine.getInstance(view, strategyPriorityMap)` 是静态单例，首次构造参数决定后续实例行为
- `Selection.resetAll()` 只清 flag，不清内部 set
- `Document.clear()` 会移除 root 子节点并清空 `_entityMap`
- 这些行为在多视图、多 app 实例、热切换场景时都可能造成隐藏状态残留
- 源码基线：`src/snap/snap_engine.ts:13`、打包基线 `lib/cadnginx.js:23548`、`lib/cadnginx.js:22779`

## 输入与拾取

- `Cad3DCanvas` 目前会通过 `Mousetrap.bind()` 把部分键盘事件转发给 `inputStack.processKeyboardEvent()`
- `SnapEngine.snap()` 会临时放大 pick size，再调用 `view.pickObjects(screenPt)`
- 只要需求涉及键盘命令、hover、点选、反查 entity，都必须核实输入链和 pick 链是否真的闭合
- 源码基线：`src/view/cad_3d_canvas.ts:134`、`src/snap/snap_engine.ts:39`

## 默认动作

- 方案设计前先判断边界：这件事应该落在业务库，还是已经变成底座缺口
- 代码实现前先判断注册链：类写出来之后，是否真的会被 app/view 运行时接到
- 代码审查时先看高风险项：多视图复用、单例污染、输入桥接、GPU pick、dirty、销毁链

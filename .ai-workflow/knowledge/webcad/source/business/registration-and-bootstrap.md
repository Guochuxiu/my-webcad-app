# 注册与启动链

## 这篇文档解决什么问题

业务库最容易出错的地方，不是“有没有写出一个新类”，而是“有没有把它接进底座现有链路”。
这篇文档专门描述下游业务库开发时必须关心的注册与启动事实。

## 启动入口事实

源码位置：

- `cadnginx 模块：app.ts`
- `cadnginx 模块：view/cad_3d_canvas.ts`
- `fscadweb 模块：app/app.ts`
- `fscadweb 模块：app/view/three/three_canvas.ts`

关键事实：

- `CadApp.addView(container, canvas, tag, configOptions)` 会复用同 tag 的 view
- 复用已有 view 时，会调用 `createNewRender(container)` 和 `dirty()`
- 新建 view 时，最终走到 `FSApp.App.createView()`
- `FSApp.App.createView()` 会创建 canvas、调用 `await canvas.init()`、放入 `_viewMap`，并把 `cmdManager` 作为 observer 加入 `inputStack`

这意味着业务库里“创建 app 和 view”不只是 UI 事情，它决定了命令、输入、渲染和 display 注册链是否真正生效。

## Display 注册链

`Cad3DCanvas` 在构造函数里集中调用 `registerDisplayType()`。
`FSApp.App.createDisplay()` 会递归遍历 entity tree，并让 view 根据注册表创建 display。

业务库新增 entity/display 时，至少要保证以下链路闭合：

1. 有业务 entity
2. 有对应 display
3. 在业务 canvas 中调用 `registerDisplayType(BusinessEntity, ...)`
4. 业务对象被加入 document 和 view
5. display 生命周期中的 dirty / signal / destroy 能闭合

如果只写了 entity 和 display，但没有注册到 canvas，运行时就只会落回底座默认 display 或根本不显示。

## Command 注册链

源码事实：

- `Cad3DCanvas` 在 `_registerCommands()` 里把命令注册到 `app.cmdManager`
- `CadApp.executeCmd()` 先 `createCommand()` 再 `execute()`
- `CadApp.executeAsyncCmd()` 监听 `signalCommandTerminated`

对业务库的要求：

- 新命令要有稳定的命令类型常量
- 命令必须在启动阶段注册到 `cmdManager`
- 方案里要明确命令结束时如何提交、取消、回收临时对象

## `nodeRoot` 与模型接入

源码事实：

- `CadApp` 构造时创建 `nodeRoot`
- `Cad3DCanvas` 构造时默认 `this.addModel(this.app.nodeRoot)`
- `ThreeCanvas.addModel()` 最终通过 `app.addToView(..., LayerType.Model)` 接入

对业务库的含义：

- 业务场景主对象如果是常驻模型树，优先接到 `nodeRoot` 或模型层
- 不要绕开这条链直接把 `THREE.Object3D` 偷塞到 scene 里，否则 pick、displayMap、销毁链、document 同步都会失真

## 模块安装链

源码事实：

- `CadApp.use(modules)` 会执行 `module.install(this)`

建议业务库把这些动作模块化：

- 业务 display 注册
- 业务命令注册
- 业务 loader 注册
- 默认场景或默认配置注入

这样方案阶段和代码审查阶段都更容易定位“某个能力到底在哪注册”。

## Loader 接入链

源码事实：

- `cadnginx 模块：loader/loader.ts` 的 `generateEntity()` 会递归遍历 `THREE.Object3D.children`
- 它依赖 `loaderConfig.objectNodeClass` 生成业务 object node

对业务库的含义：

- 如果你接入业务格式，优先考虑“格式 -> Object3D / geometry -> 业务 entity 树”的映射
- 不要在 loader 里顺手塞命令逻辑、选择逻辑、scene 污染逻辑
- `loaderConfig` 应明确 object node 类型和必要参数

## 配置与启动时序

`Cad3DCanvas` 构造函数里已经做了几件关键事情：

- 注册 display
- 注册 gizmo display
- 添加 `nodeRoot`
- 注册热键
- 监听配置变更
- 注册默认命令
- 根据配置决定是否添加 transform gizmo

所以业务库扩展 canvas 时，通常做法是：

1. 继承 `Cad3DCanvas`
2. 在构造阶段追加业务 display / command / observer 注册
3. 复用既有 config 处理流程
4. 避免把必须的注册动作推迟到随机时机

## 审查清单

- 新 display 是否已注册到目标 canvas
- 新命令是否已注册到 `cmdManager`
- 业务模型是否通过 `nodeRoot` / `addModel()` / `addGizmo()` 进入场景
- 是否错误假设 `destroyView()` 会完全移除 view
- 是否把启动逻辑散落到多个 UI 入口，导致注册顺序不可验证

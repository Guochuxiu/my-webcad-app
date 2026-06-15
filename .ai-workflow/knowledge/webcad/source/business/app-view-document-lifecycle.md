# App / View / Document 生命周期

## 适用场景

当需求涉及新增业务对象、视图复用、清空场景、销毁 view、把对象加入模型层、或让对象支持 pick / selection / dirty / clear 时，先读本页。

这页的目的不是要求修改 `cadnginx` 或 `fscadweb`，而是约束业务库方案必须说明对象如何进入 `CadApp`、`Canvas`、`Document` 和 display 链路。

## 源码用法摘要

- `cadnginx 模块：app.ts:65`：`CadApp` 构造 `nodeRoot` 并加入 `doc`
- `cadnginx 模块：app.ts:90`：`CadApp.addView(...)` 按 tag 复用 view
- `cadnginx 模块：app.ts:126`：`CadApp.destroyView(...)` 只 `destroyRender()` / `deactiveInput()`，不从 `_viewMap` 删除
- `cadnginx 模块：view\cad_3d_canvas.ts:63`：`Cad3DCanvas` 构造阶段注册 display、命令、gizmo、热键
- `cadnginx 模块：view\cad_3d_canvas.ts:109`：`Cad3DCanvas` 默认 `addModel(this.app.nodeRoot)`
- `fscadweb 模块：app\app.ts:206`：`App.createView(...)` 创建 canvas、`init()`、写入 `_viewMap`
- `fscadweb 模块：app\app.ts:257`：`App.addToView(...)` 先 `doc.addEntity(entity)` 再创建 display
- `fscadweb 模块：app\app.ts:293`：`App.createDisplay(...)` 递归镜像 entity tree
- `fscadweb 模块：app\app.ts:370`：FSCore `App.destroyView(...)` 会 `view.dispose()` 并从 `_viewMap` 删除
- `fscadweb 模块：app\app.ts:398`：`App.destory()` 清 view、清 `_viewMap`、`doc.clear()`
- `fscadweb 模块：core\document.ts:24`：`Document.addEntity(...)` 把 entity 挂到 root 并递归加入 `_entityMap`
- `fscadweb 模块：core\document.ts:53`：`Document.clear()` 移除 root 子节点并清空 `_entityMap`
- `fscadweb 模块：app\view\canvas.ts:388`：display 注册表按 `entity.constructor` 精确匹配
- `fscadweb 模块：app\view\canvas.ts:428`：`Canvas.clear()` 移除 display

## 生命周期事实

- `CadApp` 是业务库常用入口，构造时创建 `nodeRoot` 并把它加入 `Document`。
- `CadApp.addView(container, CanvasClass, tag, configOptions)` 对同 tag view 走复用路径，只重建 render 并触发 `dirty()`。
- `CadApp.destroyView(tag)` 与 FSCore `App.destroyView(id)` 语义不同：当前 `cadnginx` 版本不删除 `_viewMap` 中的 view；FSCore 版本会 `dispose()` 并删除。
- `Cad3DCanvas` 构造阶段完成 display 注册、命令注册、gizmo 注册、热键桥接，并默认把 `nodeRoot` 接到 view。
- `Document.addEntity()` 会维护 entity tree 到 `_entityMap` 的索引；后续 child add / removed 通过 signal 继续同步。
- `Document.clear()` 会让 root 的子节点 `removeFromParent()`，随后直接清空 `_entityMap`。业务状态不能依赖 clear 后旧 entity 仍可从 doc 查回。
- `App.createDisplay()` 会递归镜像 entity tree；业务对象需要显示、pick、selection、dirty、clear 管理时，应优先进入 `Entity -> Document -> Display` 链。

## 正例

- 新增业务对象前先判断：是否需要被 `Document.clear()`、pick、selection、dirty 管理。需要则建 Entity，并通过 document / app / loader / command 路径加入。
- 新增业务 Canvas 时，先复用 `Cad3DCanvas`，在构造或既有注册钩子中追加 `registerDisplayType(...)`、命令、observer、配置处理。
- 方案中明确写出运行路径：`CadApp.addView(...)` 创建或复用 view；`Cad3DCanvas` 注册 display；业务 entity 进入 `nodeRoot` 或 `doc`；`App.createDisplay(...)` 递归创建 display。
- 清理设计同时覆盖 `view.clear()`、`app.destroyView(tag)`、`doc.clear()` 后的 entity、display、pick object、listener 状态。

## 反例

- 直接 `scene.add(new THREE.Mesh(...))`，却没有说明 clear / destroy 时谁移除和 dispose。
- 假设 `CadApp.destroyView(tag)` 会彻底删除同 tag view，并据此把业务状态只绑到 view 构造阶段。
- 只在前端组件状态中保存业务对象，却要求对象支持 pick、selection、dirty、Document.clear。
- 发明 `app.refreshDisplay()`、`view.rebuildEntity()` 之类当前源码没有的生命周期 API。
- 修改底座 `fscadweb` / `cadnginx` 来承载业务对象，而没有证明当前业务库扩展点无法承载。

## 审查清单

- 是否明确业务对象落在 `Entity`、`Display`、`Command`、`Loader`、`Canvas`、`Config` 或 bootstrap 哪一层。
- 是否说明 entity 是如何进入 `Document` 或 `CadApp.nodeRoot` 的。
- 是否说明 display 注册路径和 `App.createDisplay()` 递归创建路径。
- 是否区分了 `CadApp.destroyView(tag)` 与 FSCore `App.destroyView(id)` 的版本/实现差异。
- 是否覆盖 view 复用风险：同 tag view 被复用时，构造期注册、observer、缓存、单例是否会重复或残留。
- 是否覆盖 clear/destroy 风险：`Document.clear()`、`Canvas.clear()`、`Display.clear()` 后是否有裸 Three 对象、listener、pick object 残留。

## 最小验证

- 创建 view 两次使用同 tag，确认第二次走复用路径且业务注册/observer 不重复。
- 添加一个业务 entity 到 `doc` 或 `nodeRoot`，确认能通过 `doc.getEntity(id)` 查到，并能创建对应 display。
- 调用 `doc.clear()` 后，确认业务 entity 不再可查，display 被移除，手工 listener / Three 资源无残留。
- 调用 `CadApp.destroyView(tag)` 后再 `addView(..., sameTag)`，确认复用后的业务状态、pick、dirty 仍正确。
- 对需要 pick/selection 的对象，验证点选、框选或 hover 使用的是同一 entity 身份链。

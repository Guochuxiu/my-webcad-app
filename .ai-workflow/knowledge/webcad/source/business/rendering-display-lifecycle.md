# Display / Rendering 生命周期

## 适用场景

当需求涉及新增 Display、渲染不刷新、display 注册、`viewObj` / `pickObj`、`screenBox`、hover / selection / GPU pick、outline、LOD、或 Three 资源释放时，先读本页。

这页约束业务库不要绕开 `Entity -> Display` 映射直接操作 scene；只要对象需要长期显示、pick、dirty 或 clear 管理，就必须说明 display 生命周期闭合。

## 源码用法摘要

- `cadnginx 模块：view\cad_3d_canvas.ts:63`：`Cad3DCanvas` 构造阶段注册业务 display
- `cadnginx 模块：view\cad_3d_canvas.ts:66`：`Cad3DCanvas.registerDisplayType(...)` 示例
- `fscadweb 模块：app\view\three\three_canvas.ts:318`：FSCore `ThreeCanvas._defaultRegisterDisplay()`
- `fscadweb 模块：app\view\canvas.ts:365`：`Canvas.registerDisplayType(...)` 写入 `_entityDisplayMap`
- `fscadweb 模块：app\view\canvas.ts:388`：`createDisplayRegistered(...)` 当前按 `entity.constructor` 精确查表
- `fscadweb 模块：app\view\canvas.ts:405`：`createDisplay(entity, displayCls, ...)` 实例化 display
- `fscadweb 模块：app\view\display.ts:57`：`Display` 构造时监听 entity dirty / childAdded / flag / removed / parentChanged
- `fscadweb 模块：app\view\display.ts:110`：`_entityDirtied(...)` 按 dirty 类型设置 display dirty flags
- `fscadweb 模块：app\view\display.ts:151`：`dirtyGraph()` 向父 display 和 canvas 传播
- `fscadweb 模块：app\view\display.ts:248`：`Display.clear()` 递归清 child、`onCleanup()`、断开 entity/parent
- `fscadweb 模块：app\view\display.ts:270`：`Display.onCleanup()` dispose `SignalHook`
- `fscadweb 模块：app\view\display.ts:285`：`onChildAdded(...)` 为新增 child entity 创建或复用 display
- `fscadweb 模块：app\view\three\display\three_display.ts:125`：`pickObj` 懒创建
- `fscadweb 模块：app\view\three\display\three_display.ts:252`：`screenBox`
- `fscadweb 模块：app\view\three\display\three_display.ts:274`：`viewObj` 懒创建并写入 entity id / pickPriority
- `fscadweb 模块：app\view\three\display\three_display.ts:362`：默认 `createPickObject()` 返回空
- `fscadweb 模块：app\view\three\display\three_display.ts:424`：`onDraw()` 分派 position / geometry / material / preview dirty
- `fscadweb 模块：app\view\three\display\three_display.ts:434`：`_onPositionDirty()` 同步 viewObj / pickObj / bbox
- `fscadweb 模块：app\view\three\display\three_display.ts:491`：`_onGeometryDirty()` 使 bbox / merged box 脏
- `fscadweb 模块：app\view\three\display\three_display.ts:546`：`ThreeDisplay.onCleanup()` dispose viewObj / pickObj 并清 outline
- `fscadweb 模块：app\view\three\three_canvas.ts:1106`：`ThreeCanvas.addDisplayObject(...)` 把 pickObj 加入 pickContext
- `fscadweb 模块：app\view\three\three_canvas.ts:1139`：`ThreeCanvas.removeDisplayObject(...)` 从 pickContext 移除 display

## 生命周期事实

- display 创建来自 `Canvas.createDisplayRegistered(entity)`，当前 `fscadweb` 实现按 `entity.constructor` 精确匹配 `_entityDisplayMap`。
- `Display` 构造后会监听 entity 的 dirty、child add、flag changed、removed、parent changed；不要另造一条平行刷新链。
- `Display._entityDirtied(...)` 只根据 dirty event type 设置 flags；Entity 侧 dirty 类型错，Display 侧就不会按预期更新。
- `ThreeDisplay.viewObj`、`pickObj`、`physicsBody` 是懒创建；`viewObj` 首次访问才调用 `_createViewObj()`，`pickObj` 首次访问才调用 `createPickObject()`。
- 默认 `createPickObject()` 返回空。需要 GPU pick、hover、selection 的 display 必须显式实现 pick object 或说明使用其它 pick 路径。
- `screenBox` 基于 `standardBox` 投影，影响框选、hover 范围或 UI 定位；聚合 display 需要合并 child screenBox。
- `ThreeCanvas.addDisplayObject(...)` 只有在 display 有 `pickObj` 时才加入 pickContext；`removeDisplayObject(...)` 会先从 pickContext 移除再 clear display。
- `Display.clear()` / `ThreeDisplay.onCleanup()` 是释放 signal、viewObj、pickObj、outline、外部资源的主要收口点。

## 正例

- 新增 Entity 时同步说明对应 Display、`registerDisplayType(...)`、`createDisplay(...)`、运行时创建入口。
- Display 使用 `_createViewObj()` 创建 Three 对象，在 `_onGeometryDirty()` / `_onMaterialDirty()` / `_onPositionDirty()` 中更新已有对象属性。
- 需要 pick 的对象实现 `createPickObject()`，写清 `userData.id` / entity 身份来自底座 viewObj 或 pickObj 路径。
- 需要框选或 hover 的对象实现或复用可信 `screenBox` / `standardBox`。
- `onCleanup()` 中释放 clone geometry/material、DOM、外部缓存引用、signal listener，再调用或保持父类 cleanup 语义。
- 聚合 display 添加 child 时通过 display tree 组织，不直接把 child viewObj 挂到不受控 scene 节点。

## 反例

- 只写 `scene.add(mesh)`，没有 Entity、Display、registerDisplayType、clear / dispose 说明。
- 在构造函数或早期初始化阶段依赖 `this.viewObj` 已存在。
- 用 `this.viewObj = new THREE.Mesh(...)` 替换已有对象，而不是修改已有对象的 geometry/material/transform。
- 只实现可见渲染，不实现 `createPickObject()`、`screenBox`、cleanup，却声称支持 pick / hover / selection / clear。
- 子类 Entity 只注册父类 Display，期待当前源码用 `instanceof` 自动匹配子类。
- dirty 后直接调用 canvas render，不通过 Entity dirty -> Display dirtyGraph 链。

## 审查清单

- 是否存在真实 `registerDisplayType(EntityClass, ...)`，并且注册的是 entity 的实际 constructor。
- 是否说明 display 创建来自 `App.createDisplay(...)` / `Canvas.createDisplayRegistered(...)`，不是 display 自己创建 entity。
- 是否把 dirty 类型和 display 更新方法对应起来。
- 是否覆盖 `viewObj`、`pickObj` 懒创建时机。
- 可交互对象是否有 pick object、screenBox、entity pick 身份、selection flags 的解释。
- display 删除是否经过 `removeDisplayObject(...)` / `Display.clear()` / `onCleanup()`，并从 pickContext 移除。
- 是否有多 view 风险：display、pick object、material cache、listener 是否错误共享。

## 最小验证

- 新增 entity 后，`Canvas.createDisplayRegistered(entity)` 能返回对应 display。
- 修改 entity 几何、材质、位置，确认 display 分别进入 geometry/material/position dirty 并刷新。
- 首次访问 `viewObj` 后确认 `userData.id` 对应 entity id；需要 pick 时确认 `pickObj` 被加入 pickContext。
- hover / 点选 / 框选时，确认 pick 身份与 entity tree 一致，`screenBox` 无 NaN / Infinity。
- 调用 `Canvas.clear()`、`ThreeCanvas.removeDisplayObject(...)` 或 `Document.clear()` 后，确认 display、pick object、outline、listener、geometry/material 释放。
- 重复创建/销毁 view 后，确认没有旧 display listener 或 pick object 继续响应。

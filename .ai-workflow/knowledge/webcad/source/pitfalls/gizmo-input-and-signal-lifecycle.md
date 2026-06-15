# Gizmo 输入与 Signal 生命周期风险

## 源码用法摘要

- `cadnginx 模块：view\cad_3d_canvas.ts:102`：canvas 保存 `_onTransformGizmoTransformChange.bind(this)` 作为可 unlisten 的回调引用。
- `cadnginx 模块：view\cad_3d_canvas.ts:105`：构造阶段注册 TransformGizmo 相关 display 类型。
- `cadnginx 模块：view\cad_3d_canvas.ts:200`：`_addTransformGizmo()` 创建并 `addGizmo(...)`。
- `cadnginx 模块：view\cad_3d_canvas.ts:207`：`TransformGizmoObserver` 加入 `inputStack`。
- `cadnginx 模块：view\cad_3d_canvas.ts:212`：canvas 监听 `signalTransformChange`。
- `cadnginx 模块：view\cad_3d_canvas.ts:217`：移除 gizmo 时 unlisten signal、remove observer、removeFromParent。
- `cadnginx 模块：gizmo\transformgizmo\display\transform_gizmo_observer.ts:21`：数字键输入由 observer 转给 active handle。
- `cadnginx 模块：gizmo\transformgizmo\display\transform_gizmo_observer.ts:37`：鼠标事件由 observer 分发给 handle pick/drag。
- `cadnginx 模块：gizmo\transformgizmo\display\transform_gizmo_display.ts:124`：display 监听 input provider 的 value/complete/cancel signal。
- `cadnginx 模块：gizmo\transformgizmo\display\transform_gizmo_display.ts:136`：display 监听 `entity.signalAttachChange`。
- `cadnginx 模块：gizmo\transformgizmo\display\transform_gizmo_display.ts:145`：attach 时监听 camera change。
- `cadnginx 模块：gizmo\transformgizmo\display\transform_gizmo_display.ts:149`：detach 时解除 camera change。
- `cadnginx 模块：gizmo\transformgizmo\display\transform_gizmo_display.ts:460`：`onCleanup()` 解除 input、attach、camera signals，并 dispose input provider/CSS2DObject。
- `cadnginx 模块：gizmo\transformgizmo\model\transform_gizmo.ts:297`：attach target 时监听 target position/remove signals。
- `cadnginx 模块：gizmo\transformgizmo\model\transform_gizmo.ts:315`：detach target 时解除 target signals。
- `cadnginx 模块：gizmo\transformgizmo\model\transform_gizmo.ts:437`：destroy 时 dispose gizmo 自有 signals。

## 风险说明

TransformGizmo 横跨 Entity、Display、InputStack、Signal 和 CSS2D 输入。只要其中一条链没有清理，就会出现旧 view 仍响应输入、旧 target 继续触发回调、数字键被错误消费、input DOM 残留或信号回调泄漏。

## 正例

```ts
const onTransformChange = (event: any) => {
  // 业务只处理当前 view 的 gizmo 事件，销毁时必须 unlisten。
  updateBusinessState(event.data);
};

canvas.transformGizmo.signalTransformChange.listen(onTransformChange);

function disposePanel() {
  canvas.transformGizmo.signalTransformChange.unlisten(onTransformChange);
  canvas.transformGizmo.detach();
}
```

要点：

- 保存 callback 引用，不能在 `listen(...)` 里直接匿名 bind。
- UI panel、command、view cleanup 都要解除自己添加的 signal。
- target 切换用 `attach(newTarget)` 即可触发旧 target `detach()`；不要直接改私有 `_target`。

## 反例

```ts
// 绕过 Cad3DCanvas 和 registerDisplayType，只有裸 Three 对象，没有 inputStack、pick、signal、dispose 链。
scene.add(new THREE.AxesHelper(100));
window.addEventListener('keydown', onGizmoNumberInput);
target.signalPositionChange.listen(() => axes.position.copy(target.worldPosition));
```

问题：

- `AxesHelper` 不在 `TransformGizmo/AxisHandle` display 注册链中，handle pick 和 GPU pick 都无法复用。
- 全局 keyboard listener 绕过 `InputStack` priority/consumed 语义。
- target signal 没有保存并解除 callback，target 删除或 view 复用后会遗留回调。

## 审查清单

- 是否复用 `canvas.transformGizmo` 和 `configOptions.transformGizmo`，而不是手搓 scene gizmo。
- 是否存在完整注册链：`registerDisplayType`、`addGizmo`、display 创建、`TransformGizmoObserver`。
- 新增 keyboard/input 行为是否走 `inputStack` observer 或 input provider signal。
- 外部监听 `signalTransformBegin/Change/End/AttachChange` 是否保存 callback 并 unlisten。
- attach/detach 是否通过公共 API；是否解除 target `signalPositionChange/signalRemoved`。
- 禁用、销毁或 view 复用时，是否 `removeObserver` 并解除 canvas transformChange listener。
- input provider 替换时是否先 unlisten 旧 provider，再 listen 新 provider。
- display cleanup 是否释放 CSS2DObject/input provider；model destroy 是否 dispose signals。

## 最小验证

- attach target 后移动 target，gizmo 跟随；detach 后 target signal 不再影响 gizmo。
- 开始拖拽 handle 后，`signalTransformBegin/Change/End` 都能触发；解除外部 listener 后不再触发业务回调。
- active handle 状态下数字键被 `TransformGizmoObserver.processKeyboardEvent(...)` 消费；非 active handle 状态不消费。
- 禁用 gizmo 后，旧 observer 不再处理鼠标和键盘事件。
- 替换 input provider 后，旧 provider 的 value/complete/cancel signal 不再触发 display 回调。
- 销毁 gizmo/display 后，input DOM、camera listener、target listener、gizmo 自有 signals 都不再可触发旧对象。

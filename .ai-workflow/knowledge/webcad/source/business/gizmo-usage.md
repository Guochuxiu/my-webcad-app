# Gizmo 使用

## 业务库默认入口

当前业务库最稳定的 Gizmo 接入点不是直接 `new TransformGizmo()`，而是 `View.Cad3DCanvas` 自带的：

- `canvas.transformGizmo`
- `configOptions.transformGizmo`

`Cad3DCanvas` 会创建、注册和管理 TransformGizmo 生命周期。

## 源码用法摘要

- `cadnginx 模块：view\cad_3d_canvas.ts:105`：构造阶段调用 `registerTransformGizmo(this)` 注册 gizmo display 类型。
- `cadnginx 模块：gizmo\transformgizmo\index.ts:12`：注册 `TransformGizmo -> TransformGizmoDisplay`。
- `cadnginx 模块：gizmo\transformgizmo\index.ts:13`：注册 `TranslateAxisHandle -> TranslateAxisHandleDisplay`。
- `cadnginx 模块：gizmo\transformgizmo\index.ts:14`：注册 `OrientationHandle -> OrientationHandleDisplay`。
- `cadnginx 模块：gizmo\transformgizmo\index.ts:15`：注册 `RotateAxisHandle -> RotateAxisHandleDisplay`。
- `cadnginx 模块：view\cad_3d_canvas.ts:118`：配置 `transformGizmo.enable` 为真时调用 `_addTransformGizmo()`。
- `cadnginx 模块：view\cad_3d_canvas.ts:200`：`_addTransformGizmo()` 创建 gizmo 并 `addGizmo(...)`。
- `cadnginx 模块：view\cad_3d_canvas.ts:207`：`TransformGizmoObserver` 被加入 `inputStack`。
- `cadnginx 模块：view\cad_3d_canvas.ts:212`：canvas 监听 `signalTransformChange`。
- `cadnginx 模块：view\cad_3d_canvas.ts:217`：禁用 gizmo 时 unlisten transformChange、remove observer、removeFromParent。
- `cadnginx 模块：gizmo\transformgizmo\display\transform_gizmo_observer.ts:11`：observer priority 是 `INPUT_STACK_PRIORITY.GIZMO + 1`。
- `cadnginx 模块：gizmo\transformgizmo\display\transform_gizmo_observer.ts:21`：数字键经 observer 进入 handle 输入模式。
- `cadnginx 模块：gizmo\transformgizmo\model\transform_gizmo.ts:290`：`attach(target, offset?)` 先 `detach()` 再监听 target signal。
- `cadnginx 模块：gizmo\transformgizmo\model\transform_gizmo.ts:315`：`detach()` 解除 target 的 `signalPositionChange/signalRemoved`。
- `cadnginx 模块：gizmo\transformgizmo\model\transform_gizmo.ts:432`：`destroy()` 中调用 `detach()` 并 dispose 自身 signals、measureLine、gizmoModel。
- `cadnginx 模块：gizmo\transformgizmo\display\transform_gizmo_display.ts:460`：display `onCleanup()` 解除 input provider、attach、camera signal，并 dispose input provider/CSS2DObject。

## 推荐用法

```ts
import { CadApp, View, Gizmo } from '@fsdev/cadnginx';

const app = new CadApp();
const canvas = await app.addView(container, View.Cad3DCanvas, 'main', {
  transformGizmo: {
    enable: true,
    pixelSize: 80,
    enableHandles: [Gizmo.HandleType.Translate, Gizmo.HandleType.Rotate],
    enableAxis: [Gizmo.GizmoAxis.X, Gizmo.GizmoAxis.Y, Gizmo.GizmoAxis.Z],
    rotateSnapTolerance: 15,
  },
});

const gizmo = canvas.transformGizmo;
gizmo.attach(targetEntity);
gizmo.signalTransformBegin.listen(handler);
gizmo.signalTransformChange.listen(handler);
gizmo.signalTransformEnd.listen(handler);
```

使用 signal 时要保存 handler 引用，并在业务对象或 UI 生命周期结束时 `unlisten(handler)`；如果可以使用 `SignalHook` 或 display 的 `listenSignal(...)`，优先交给生命周期统一管理。

## 常用操作

- `gizmo.attach(target, offset?)`
- `gizmo.detach()`
- `gizmo.setSpace(Gizmo.TransformGizmoSpace.World | Local)`
- `gizmo.setEnable(true | false)`
- `gizmo.setHandlesEnable([...], true | false)`
- `gizmo.setHandlesInputEnable([...], true | false)`
- `gizmo.lockHandleDirection(true | false)`

## 正例

- 优先通过 `Cad3DCanvas` 配置项创建和接入 gizmo，让 display 注册、observer、signal 和 cleanup 都走已有链路。
- attach 业务对象后，显式管理外部 `signalTransformBegin/Change/End` 监听，并在 UI 或命令结束时解除监听。
- 多视图场景下为每个 canvas 使用自己的 `transformGizmo`，不要跨 view 复用同一个 gizmo model/display。

## 反例

- 直接往 scene 塞一个临时坐标轴或拖拽 mesh，就宣称“已接入 gizmo”。
- 在业务层自己监听全局 DOM 键盘/鼠标事件驱动 gizmo，而不是复用 `TransformGizmoObserver` 和 inputStack。
- attach/detach 后不处理 target signal、observer、input provider 或 CSS2DObject 清理。

## 生命周期要点

1. **显示注册**：`TransformGizmo`、Translate/Rotate/Orientation handles 都通过 `registerDisplayType(...)` 进入 `Entity -> Display` 映射。不要只创建 model 而漏注册 display。
2. **创建接入**：`Cad3DCanvas` 在配置启用时创建 gizmo，`addGizmo(...)` 后再通过 display 构造 `TransformGizmoObserver`。
3. **输入接入**：gizmo 的鼠标和数字键输入走 `inputStack` observer；若业务命令也处理同类输入，要看 observer priority 和 consumed 行为。
4. **attach/detach**：`attach(...)` 会监听 target 的 `signalPositionChange` 和 `signalRemoved`；`detach()` 负责解除监听、隐藏测量线、清除 active handle。
5. **signal**：拖拽开始、变化、结束分别由 `TransformGizmoDisplay` dispatch `signalTransformBegin/Change/End`；外部监听必须配对 unlisten。
6. **销毁**：`TransformGizmo.destroy()` 会 dispose model signals 和 gizmo model；`TransformGizmoDisplay.onCleanup()` 会释放 input provider、CSS2DObject 和 signal 监听。业务代码禁用、销毁或替换 gizmo 时必须说明走哪条清理链。

## 明确不要写的内容

- 不要默认写 `import { TransformGizmo } from '@fsdev/cadnginx'`
- 不要把 `ViewPortGizmo` 当成当前业务库默认公共入口
- 不要把 `LineArrowGizmo` 当成 root export 去生成代码

`ViewCubeCanvas`、`LineArrowGizmo` 等能力可以在 `fscadweb 模块` 找到源码，但是否作为下游公共 API 可直接引用，必须以当前包入口和业务库接线方式再确认。

## 审查清单

- 是否直接绕过 `Cad3DCanvas` 生命周期去手搓 gizmo
- 是否把 gizmo 事件和业务命令状态绑死，导致销毁后残留监听
- 是否在多视图场景下复用了不该共享的 gizmo 状态
- 是否补齐 `registerDisplayType`、`addGizmo`、`inputStack.addObserver`、`removeObserver`、signal unlisten 和 dispose 链
- 是否把数字键输入误写成全局 DOM listener，而不是走 `TransformGizmoObserver` 与 input provider

## 最小验证

- 开启 `transformGizmo.enable` 后，`canvas.transformGizmo` 存在且能 attach 到一个 `CADEntity`。
- attach 后移动 target，gizmo 跟随；detach 后 target 再移动不触发 gizmo 更新。
- 拾取 handle 后拖拽能触发 `signalTransformBegin/Change/End`，并且外部监听能被 unlisten。
- 数字键输入只在 active handle 且 inputEnable 为真时被 gizmo observer 消费。
- 禁用或移除 gizmo 后，`inputStack` 中不再保留旧 `TransformGizmoObserver`，旧 signal listener 不继续响应。

# Animation / Simulation / Physics

## 源码用法摘要

- `fscadweb 模块：app\animation\animation_manager.ts:3`：`AnimationManager` 管理动画集合。
- `fscadweb 模块：app\animation\animation_manager.ts:7`、`fscadweb 模块：app\animation\animation_manager.ts:12`：动画通过 `add()` / `remove()` 接入管理器。
- `fscadweb 模块：app\animation\animation_manager.ts:29`：`update()` 统一驱动所有动画。
- `fscadweb 模块：app\animation\animation_manager.ts:33`：`dispose()` 停止并清空动画。
- `fscadweb 模块：app\animation\animation.ts:12`：`FSAnimation` 是动画基类。
- `fscadweb 模块：app\animation\animation.ts:19`：动画有 start/update/pause/stop signal。
- `fscadweb 模块：app\animation\animation.ts:46`：`dispose()` 会 dispose 动画 signal 并从 manager 移除。
- `fscadweb 模块：app\view\three\physics_world.ts:15`：`PhysicsWorld` 管理 Ammo world。
- `fscadweb 模块：app\view\three\physics_world.ts:90`：`updatePhysics(deltaTime)` step 后派发 world update。
- `fscadweb 模块：app\view\three\physics_world.ts:121`：`dispose()` 移除 rigid body 并调用 Ammo destroy。
- `cadnginx 模块：animation\frame_animation.ts:8`：业务侧已有 `FrameAnimation`。
- `cadnginx 模块：animation\key_frame_animation.ts:13`：业务侧已有 key frame 动画。
- `cadnginx 模块：simulate\simulator.ts:93`：仿真会驱动 `rootLink.update()`。

## 正例

- 动画通过 `AnimationManager.add(animation)` 接入统一 update，动画结束、取消、view destroy 时走 `stop()` / `dispose()`。
- 新增动画类型继承 `FSAnimation` 或复用 `FrameAnimation` / key frame 动画，并说明 signal 生命周期。
- 需要仿真联动运动学时，说明 joint/link value 如何更新，以及何时调用 `rootLink.update()`。
- PhysicsWorld 中新增 rigid body 必须说明 id 映射、remove、Ammo destroy、world dispose。
- 临时预览对象随动画创建时，仍要进入 display 或明确 owner/cleanup。

## 反例

- 用 `setInterval` 或散落的 `requestAnimationFrame` 直接改 `Object3D`，不进 `AnimationManager`。
- 动画 stop 后 signal、临时 mesh、observer、physics body 仍留在 view 中。
- 直接改 Object3D matrix 表示运动学结果，不更新 Link/Joint 或 entity dirty。
- Ammo rigid body remove 时只从 map 删除，不 `removeRigidBody()` 和 `Ammo.destroy()`。
- 多 view 共用一个 animation/physics world，却不说明 view 复用后的状态归属。

## 审查清单

- 动画是否由 manager 统一 update，而不是私有 timer。
- stop、pause、dispose、重复 start 的状态是否定义清楚。
- animation signal 是否在 dispose 中释放，外部 listen 是否配对 unlisten。
- 运动学仿真是否更新 link/joint 并触发 root update/dirty。
- physics rigid body 是否有 add/remove/destroy 闭环。
- view destroy 或 `CadApp.addView()` 复用后，动画/physics 状态是否会污染新视图。

## 最小验证

- 启动、暂停/停止、再次启动动画，确认没有重复 update。
- dispose 动画后，signal listener 不再触发，manager 集合不再持有动画。
- 添加和移除 rigid body，确认 physics world、map、Ammo object 都释放。
- 仿真驱动模型时，验证至少一个 joint/link 更新后显示位置同步变化。

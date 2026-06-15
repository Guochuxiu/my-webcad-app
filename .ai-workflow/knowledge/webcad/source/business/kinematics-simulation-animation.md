# Kinematics / Simulation / Animation

## 源码用法摘要

- `fscadweb 模块：app\animation\animation_manager.ts:3`：`AnimationManager`
- `fscadweb 模块：app\animation\animation_manager.ts:7`：`animationManager.add(animation)`
- `fscadweb 模块：app\animation\animation_manager.ts:12`：`animationManager.remove(animation)`
- `fscadweb 模块：app\animation\animation_manager.ts:29`：`animationManager.update()`
- `fscadweb 模块：app\animation\animation_manager.ts:33`：`animationManager.dispose()`
- `fscadweb 模块：app\animation\animation.ts:12`：`FSAnimation`
- `fscadweb 模块：app\animation\animation.ts:19`：`signalAnimationStart`
- `fscadweb 模块：app\animation\animation.ts:20`：`signalAnimationUpdate`
- `fscadweb 模块：app\animation\animation.ts:46`：`FSAnimation.dispose()`
- `cadnginx 模块：animation\frame_animation.ts:8`：`FrameAnimation`
- `cadnginx 模块：animation\frame_animation.ts:43`：`FrameAnimation.update()`
- `cadnginx 模块：animation\frame_animation.ts:65`：`FrameAnimation.playBySpeed()`
- `cadnginx 模块：animation\frame_animation.ts:115`：逐帧 `signalAnimationUpdate.dispatch(frame)`
- `cadnginx 模块：simulate\simulator.ts:34`：`Simulator`
- `cadnginx 模块：simulate\simulator.ts:45`：创建 `FrameAnimation`
- `cadnginx 模块：simulate\simulator.ts:46`：注册到 `view.animationManager`
- `cadnginx 模块：simulate\simulator.ts:48`：监听 `signalAnimationUpdate`
- `cadnginx 模块：simulate\simulator.ts:74`：`_onAnimationUpdate(...)`
- `cadnginx 模块：simulate\simulator.ts:84`：每帧更新 joint 值
- `cadnginx 模块：simulate\simulator.ts:93`：`rootLink.update()`
- `cadnginx 模块：simulate\simulator.ts:102`：`_updateJointValues(rootLink, jointValues)`
- `cadnginx 模块：simulate\machine_simulator.ts:24`：`MachineSimulator extends Simulator`

## 最小关联链

仿真并不直接改 display 或 `Object3D`。当前源码的最小链路是：

1. `Simulator` 根据输入数据解析出 `frameData`，每帧包含 `jointsValues: { name, value }[]`。
2. 构造 `FrameAnimation(frameData, { speed, isStream: false })`。
3. 把 animation 加入 `view.animationManager.add(animation)`，由 view 的动画管理器统一 update/play/stop。
4. 监听 `FrameAnimation.signalAnimationUpdate`。
5. 每帧在 root link 下用 `rootLink.getJoints()` 找 joint name，调用 `joint.setJointValue([value])`。
6. 调 `rootLink.update()`，由 `Link.update()` 触发绑定 entity 的 `dirtyPosition({ linkWorldMatrix })`。

## AnimationManager / FrameAnimation 职责

- `AnimationManager` 只维护 `FSAnimation[]`，提供 `add/remove/playAll/stopAll/pauseAll/update/dispose`。
- `FSAnimation.dispose()` 会 dispose start/update/pause/stop signals，并从 manager 移除自身。
- `FrameAnimation` 负责帧推进和分发 `signalAnimationUpdate(frame)`；它不知道 kinematics，也不直接更新 entity。
- kinematics 驱动发生在 `Simulator._onAnimationUpdate()`，不是 `FrameAnimation` 内部。

## Simulation 职责

- `Simulator` 绑定一个 `Cad3DCanvas` 和 `ISimuParams`，通过 `machineName` 在 `view.app.nodeRoot.children` 中找机器根节点。
- `Simulator._updateJointValues()` 只按 joint name 调 `setJointValue([value])`。
- `Simulator._updateOtherValues()` 是子类 hook。
- `MachineSimulator` 额外处理碰撞、掉落、轨迹、母材长度、机器状态，但仍复用 `Simulator` 的 animation -> joint -> root update 主链。

## 正例

```ts
const simulator = new Simulator(canvas, {
  simuData,
  jointAxis: ['joint_x', 'joint_y'],
  machineName: 'machine.ses',
  tubeNodeId: 1,
});

simulator.animation.play();
```

- 仿真对象创建后让 `view.animationManager` 管理动画更新。
- 每帧只更新 `Joint` 值，然后从 root link 执行 `update()`。
- 停止或释放时调用 animation 的 `stop()` / `dispose()`，让 signal 和 manager 关系断开。

## 反例

```ts
setInterval(() => {
  mesh.position.x += 1;
}, 16);
```

- 直接 `setInterval` 改 mesh 绕开 `AnimationManager`，不会跟 view 生命周期、统一 pause/stop、dispose 对齐。
- 每帧直接改 `Object3D`，不会更新 `Joint` 状态、URDF 导出状态或 entity dirty。
- 监听 `signalAnimationUpdate` 后不 dispose animation，会在 view 复用或重复创建模拟器时残留回调。

## 审查清单

- 是否通过 `view.animationManager.add(animation)` 接入动画，而不是自建定时器。
- 是否在每帧更新 joint 后调用 root link `update()`。
- 是否按 joint name 映射数据，且 `jointAxis` 与 URDF/SES 导入的 joint 名称一致。
- 是否说明 animation stop/dispose 和 signal cleanup。
- 是否避免把仿真状态直接写到 display 或 raw `Object3D`。
- 多 view 下 simulator 是否绑定到正确 `Cad3DCanvas`，没有复用旧 view 的 animation 或 root link。

## 最小验证

- 创建 simulator 后确认 `canvas.animationManager` 中能更新对应 `FrameAnimation`，播放时收到 `signalAnimationUpdate`。
- 输入一帧 `{ name, value }` 后，确认匹配 joint 调用了 `setJointValue([value])`，随后 root link `update()`。
- 调用 `simulator.animation.dispose()` 后，再触发 view animation update，不应继续调用旧的 frame update 回调。
- 重新加载同名 SES/URDF 后，确认 simulator 查到的是当前 view 当前 `nodeRoot` 下的机器 root link。

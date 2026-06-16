# 任务 2：让工件从 A 点移动到 B 点

## Task Routing

- task_type: `solution-write`
- evidence: 本任务要求基于已有代码拆分 `MoveWorkpieceCommand` 的实现步骤，而不是立即落代码。
- kb_root: `.ai-workflow/knowledge/webcad/`
- source_roots:
  - `src/projects/template/`
  - `src/common/`
  - `examples/views/workpie_object.vue`
- expected_output: 分步实现计划，每一步都有目标、工作内容、验收点和对应代码锚点。

## 当前已有基础

任务 1 已经完成了创建工件的主链路：

```text
workpie_object.vue
  -> TempViewHandle.createSimpleWorkpiece(...)
  -> CreateSimpleWorkpieceCommand
  -> SimpleWorkpieceFactory.create(...)
  -> SimpleWorkpiece(Group)
      -> BatchMesh  主体面
      -> BatchLine  特征线
      -> BatchPoint 特征点
  -> TempCanvas.registerDisplayType(...)
```

任务 2 要在这条链路上继续扩展：

```text
选中工件
  -> UI 调用 TempViewHandle.moveSelectedWorkpiece(...)
  -> MoveWorkpieceCommand
  -> 找到 SimpleWorkpiece
  -> waiting -> moving
  -> 按 duration 插值更新位置
  -> dirtyPosition / view.dirty
  -> arrived
```

注意：仍然不要直接 `scene.add` 或直接改 Three.js Object3D。移动的是 WebCAD Entity 的位姿。

## 推荐实现顺序

### 第 1 步：确认位姿更新锚点

目标：先确认工件怎么移动，而不是先写动画。

要做的工作：

- 查看 `SimpleWorkpiece` 当前继承链：
  - `src/projects/template/model/workpiece/simple_workpiece.ts`
  - `SimpleWorkpiece extends FSCore.Model.Group`
- 对照底座类型能力：
  - `FSCore.Model.Group` 继承 `CADEntity`
  - `CADEntity` 已有真实 API：`setPosition(...)`、`setWorldPosition(...)`、`dirtyPosition()`
- 明确本任务优先使用局部位置：

```ts
workpiece.setPosition({ x, y, z });
workpiece.dirtyPosition();
```

产出：

- 确认工件父级 Entity 可以整体移动。
- 确认移动父级 `SimpleWorkpiece` 后，子实体 `BatchMesh / BatchLine / BatchPoint` 会随父级显示变换一起移动。

验收点：

- 不发明 `refreshDisplay()`、`updateViewObject()` 之类当前仓库不存在的 API。
- 不直接修改 display 或 Three.js object。

### 第 2 步：给 `SimpleWorkpiece` 补运动状态字段

目标：让工件自身能表达“正在移动、剩余时间、到达”等状态。

建议修改文件：

```text
src/projects/template/model/workpiece/simple_workpiece.ts
```

要做的工作：

1. 保留已有状态：

```ts
export type WorkpieceState = 'waiting' | 'processing' | 'done';
```

2. 为任务 2 扩展状态，建议改成：

```ts
export type WorkpieceState = 'waiting' | 'moving' | 'arrived' | 'processing' | 'done';
```

3. 增加剩余时间字段：

```ts
private _remaining = 0;

public get remaining(): number {
    return this._remaining;
}
```

4. 增加位姿和 remaining 更新方法：

```ts
public moveToPosition(position: [number, number, number]): void {
    this.setPosition(position[0], position[1], position[2]);
    this.dirtyPosition();
}

public setRemaining(remaining: number): void {
    this._remaining = Math.max(0, remaining);
    this.dirtyMaterial();
}
```

说明：

- 位置变化用 `dirtyPosition()`。
- 状态和 remaining 属于业务显示信息，先用 `dirtyMaterial()` 或 `dirty()` 触发刷新即可。
- 不要把动画计时器放进 Entity；Entity 只保存状态和数据。

产出：

- `SimpleWorkpiece` 支持：
  - `waiting`
  - `moving`
  - `arrived`
  - `remaining`
  - `moveToPosition(...)`

验收点：

- 改状态会触发 dirty。
- 改位置会触发 dirtyPosition。

### 第 3 步：定义移动命令参数

目标：明确 `MoveWorkpieceCommand` 的输入，不把 Display、DOM、Three 对象传进 Command。

建议新增文件：

```text
src/projects/template/command/cmd_move_workpiece.ts
```

建议参数类型：

```ts
export interface MoveWorkpieceParams {
    workpieceId: number;
    from?: [number, number, number];
    to: [number, number, number];
    duration: number;
}
```

说明：

- `workpieceId` 是 WebCAD Entity id。
- `from` 可选；如果不传，就从 `workpiece.position` 读取当前值。
- `to` 是目标点。
- `duration` 单位建议用秒，和任务描述 `{ duration: 3.0 }` 一致。

产出：

- 命令参数是稳定 DTO。
- UI 不需要传入 `SimpleWorkpiece` 对象本身，更不传 display 或 Three object。

验收点：

- 参数缺失时命令能 cancel。
- `duration <= 0` 时要么按瞬时完成处理，要么直接拒绝，本任务建议最小实现为拒绝并 cancel。

### 第 4 步：实现 `MoveWorkpieceCommand` 骨架

目标：先能通过命令找到选中的工件，并完成状态切换，不急着做动画。

建议新增：

```text
src/projects/template/command/cmd_move_workpiece.ts
```

推荐继承当前仓库真实基类：

```ts
export class MoveWorkpieceCommand extends CmdBase<MoveWorkpieceParams, TempCanvas> {
    async commit() {
        const workpiece = this._view.app.doc.getEntity(this._params?.workpieceId);

        if (!(workpiece instanceof SimpleWorkpiece)) {
            this.cancel();
            return;
        }

        workpiece.setState('moving');
        workpiece.setRemaining(this._params.duration);

        // 第 4 步先直接设置 arrived，确认命令链路可执行。
        workpiece.setState('arrived');
        workpiece.setRemaining(0);

        super.commit();
    }
}
```

这一版还不平滑移动，只用于验证：

- 命令能创建。
- 能通过 id 找到 `SimpleWorkpiece`。
- 状态能从 `waiting` 变成 `moving`，再变成 `arrived`。

产出：

- 一个能执行但暂时不动画的命令骨架。

验收点：

- 选中一个工件后执行命令，不报错。
- 工件状态可更新。

### 第 5 步：把移动命令接入注册链

目标：让 `MoveWorkpieceCommand` 能被 UI/handle 触发。

需要修改：

```text
src/projects/template/command/cmd_types.ts
src/projects/template/command/cmd_register.ts
src/projects/template/view/temp_view_handle.ts
```

1. 在 `cmd_types.ts` 增加命令类型：

```ts
MOVE_WORKPIECE = 'move_workpiece'
```

2. 在 `cmd_register.ts` 加入命令映射：

```ts
[CMD_TYPES.MOVE_WORKPIECE]: MoveWorkpieceCommand
```

3. 在 `TempViewHandle` 增加方法：

```ts
public moveWorkpiece(params: MoveWorkpieceParams): Promise<void> {
    return this.executeCommand(CMD_TYPES.MOVE_WORKPIECE, params);
}
```

4. 可选增加从当前 selection 取工件的 helper：

```ts
public getSelectedSimpleWorkpiece(): SimpleWorkpiece | null {
    return this.findSimpleWorkpieceByEntityIds(this._canvas.app.selection.selectedIds);
}
```

产出：

- UI 可以调用 `viewHandle.moveWorkpiece(...)`。
- 命令已注册到 `CommandManager`。

验收点：

- 不直接 new command。
- 不绕过 `executeCommand(...)`。

### 第 6 步：实现平滑移动动画

目标：让工件在指定耗时内从 A 点平滑移动到 B 点。

任务参数示例：

```ts
{
    from: [0, 0, 0],
    to: [500, 0, 0],
    duration: 3.0
}
```

实现建议：

- 本任务是演示小功能，可先在 command 内用 `requestAnimationFrame` 做最小动画。
- 必须保存 `animationFrameId`，在 `onCleanup()` / cancel 路径取消。
- 每帧只更新 Entity 位姿，不直接改 Three.js object。

推荐伪代码：

```ts
private _frameId: number | null = null;

private _animate(workpiece: SimpleWorkpiece, from: [number, number, number], to: [number, number, number], duration: number) {
    const start = performance.now();
    const durationMs = duration * 1000;

    const tick = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / durationMs);
        const current: [number, number, number] = [
            from[0] + (to[0] - from[0]) * t,
            from[1] + (to[1] - from[1]) * t,
            from[2] + (to[2] - from[2]) * t
        ];

        workpiece.moveToPosition(current);
        workpiece.setRemaining((1 - t) * duration);
        this._view.dirty();

        if (t < 1) {
            this._frameId = requestAnimationFrame(tick);
            return;
        }

        workpiece.moveToPosition(to);
        workpiece.setRemaining(0);
        workpiece.setState('arrived');
        this._view.dirty();
        super.commit();
    };

    workpiece.setState('moving');
    this._frameId = requestAnimationFrame(tick);
}
```

关键注意：

- `super.commit()` 应该在动画结束时调用，而不是动画刚开始就调用。
- 如果当前 `CmdBase.onExecute()` 会自动 `await this.commit()`，那 `commit()` 可以返回一个 Promise，在动画结束时 resolve。
- 如果实现时发现 `CommandManager` 生命周期不适合长期 pending，再采用“命令触发动画控制器，命令立即 commit”的降级方案，但要在文档里说明 cleanup owner。

产出：

- 工件 3 秒内从 from 平滑插值到 to。
- 状态流转：`waiting -> moving -> arrived`。
- remaining 从 3 逐渐归零。

验收点：

- 不是瞬移。
- 每帧调用 `dirtyPosition()` 和 `view.dirty()`。
- 动画结束后状态是 `arrived`。
- 取消或新命令打断时不会留下重复 RAF。

### 第 7 步：补 UI 触发入口

目标：能选中一个工件并点击按钮触发移动。

建议修改：

```text
examples/views/workpie_object.vue
```

新增按钮：

```html
<button type="button" :disabled="!selectedWorkpiece" @click="moveSelectedWorkpiece">
    移动到 B 点
</button>
```

新增方法：

```ts
async function moveSelectedWorkpiece() {
    if (!viewHandle || !selectedWorkpiece.value) return;

    await viewHandle.moveWorkpiece({
        workpieceId: selectedWorkpiece.value.id,
        from: [0, 0, 0],
        to: [500, 0, 0],
        duration: 3.0
    });
}
```

更稳的做法：

- `from` 不写死，从 `selectedWorkpiece.value.position` 读取当前 Entity 位置。
- 但任务描述给了固定 from/to，本任务第一版可以先按 `{ from: [0,0,0], to: [500,0,0], duration: 3 }` 实现。

产出：

- 页面有“移动到 B 点”按钮。
- 没选中工件时按钮不可用。
- 选中后点击，触发 `MoveWorkpieceCommand`。

验收点：

- UI 不直接改工件位置。
- UI 不写动画循环。
- UI 只调用 handle。

### 第 8 步：属性面板显示 remaining

目标：满足可选验收项：UI 或属性面板能显示 remaining。

当前页面已有选中信息面板：

```text
类型 / 状态 / 库位 / 特征点 / 特征线 / 特征面
```

建议新增：

```html
<div>
    <dt>剩余</dt>
    <dd>{{ selectedWorkpiece.remaining.toFixed(1) }}s</dd>
</div>
```

注意点：

- Vue 的 `selectedWorkpiece` 是同一个对象引用，Entity 内部字段变化不一定自动触发 Vue 响应式更新。
- 最小方案：命令每帧通过 handle 或 signal 通知 UI 更新一个 `remainingTick`。
- 更简单的演示方案：页面在移动命令期间启动一个轻量 UI interval，只读取 `selectedWorkpiece.remaining`，命令结束后清理。
- 更 WebCAD 化的方案：在 `TempViewHandle` 上增加 `onWorkpieceMoveProgress` signal，由命令每帧 dispatch。

推荐第一版：

1. 在 `TempViewHandle` 增加一个 `onWorkpieceMoveProgress` signal。
2. `MoveWorkpieceCommand` 每帧派发：

```ts
this._view.app.signalEventBus.dispatch({
    type: 'workpieceMoveProgress',
    workpieceId: workpiece.id,
    remaining: workpiece.remaining
});
```

3. 页面监听 handle 的 `onChange` 或新增 signal，更新一个响应式 `remaining` 字段。

如果想保持任务 2 简洁，可以先显示状态变化，remaining 标记为后续增强。

产出：

- 面板能看到 remaining 逐渐减少。

验收点：

- UI 监听有取消订阅。
- 不用全局变量保存 remaining。

### 第 9 步：补最小验证

目标：实现后能证明任务 2 没有只停在“理论可行”。

建议验证清单：

1. 创建一个立方体。
2. 点击选中它。
3. 点击“移动到 B 点”。
4. 观察工件从 `[0, 0, 0]` 平滑移动到 `[500, 0, 0]`。
5. 移动时状态显示 `moving`。
6. 移动结束后状态显示 `arrived`。
7. 如果实现 remaining，确认 remaining 从 `3.0s` 递减到 `0.0s`。
8. 连续点击移动，不应产生多个动画同时控制同一工件。
9. 切换页面或销毁 view 后，不应继续触发动画帧或 signal。

建议命令行验证：

```bash
npm run build
```

当前仓库全量 `vue-tsc` 可能会输出既有类型问题；如果要做过滤检查，可以只过滤本任务文件：

```bash
npx vue-tsc --noEmit --pretty false 2>&1 | Select-String -Pattern "cmd_move_workpiece|simple_workpiece|workpie_object|temp_view_handle|cmd_register|cmd_types"
```

### 第 10 步：代码审查重点

目标：实现后按 WebCAD 风险点自查。

必须检查：

- `MoveWorkpieceCommand` 是否进入 `cmd_register.ts`。
- UI 是否通过 `TempViewHandle.moveWorkpiece(...)` 调用命令。
- 是否移动 `SimpleWorkpiece` Entity，而不是移动 Display 或 Object3D。
- 每次位置变化是否触发 `dirtyPosition()`。
- 状态变化是否触发 dirty。
- 动画结束、取消、view dispose 时是否清理 RAF / signal。
- 是否避免多个动画同时控制同一个工件。
- 是否错误依赖 `Selection.resetAll()` 清空内部 set。

## 推荐最终文件改动清单

```text
src/projects/template/model/workpiece/simple_workpiece.ts
  - 扩展 WorkpieceState
  - 增加 remaining
  - 增加 moveToPosition / setRemaining

src/projects/template/command/cmd_move_workpiece.ts
  - 新增 MoveWorkpieceCommand
  - 查找 SimpleWorkpiece
  - waiting -> moving -> arrived
  - 按 duration 插值移动
  - cleanup 取消动画

src/projects/template/command/cmd_types.ts
  - 新增 MOVE_WORKPIECE

src/projects/template/command/cmd_register.ts
  - 注册 MoveWorkpieceCommand

src/projects/template/view/temp_view_handle.ts
  - 新增 moveWorkpiece(...)
  - 可选新增 getSelectedSimpleWorkpiece()
  - 可选新增 move progress signal

examples/views/workpie_object.vue
  - 增加移动按钮
  - 调用 viewHandle.moveWorkpiece(...)
  - 可选显示 remaining
```

## 任务 2 的最小完成定义

最小完成版本只需要做到：

- 选中一个已创建工件。
- 点击按钮触发 `MoveWorkpieceCommand`。
- 工件在 3 秒内从 A 点平滑移动到 B 点。
- 移动过程中状态是 `moving`。
- 移动结束状态是 `arrived`。
- 不直接操作 scene，不直接操作 display，不绕过 Command。

remaining 显示是可选项；如果做，要同步补 signal 或响应式刷新方案。

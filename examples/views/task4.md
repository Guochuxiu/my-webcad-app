# 任务 4：联动仓库、传送带、上下料和多个工件实现最小流水线

## Task Routing

- task_type: `solution-write`
- evidence: 本任务要求把“仓库、传送带、上下料、工作台、多个工件”的流水线功能拆成可实现步骤，并写入方案文档，不是立即落代码。
- kb_root: `.ai-workflow/knowledge/webcad/`
- source_roots:
  - `src/projects/template/`
  - `src/common/`
  - `examples/views/workpie_object.vue`
- expected_output: 面向任务 4 的分步实现计划，每一步都有目标、工作内容、产出和验收点。

说明：`webcad kb-route` 因需求文本里包含“实现”关键词，可能把任务识别为 `code-write`。本轮用户目标是“帮我拆分并写入 task4.md”，所以按 `solution-write` 处理。

## 任务目标

实现一个最小流水线 demo，联动这些对象：

- 仓库：至少 3 个工件排队等待。
- 上料装置：把仓库队首工件放到传送带入口。
- 传送带：有固定 A 点、B 点、速度和容量限制。
- 下料装置：把传送带出口工件放到工作台。
- 工作台：可能忙，忙时会导致出口阻塞。

整个流程必须按 tick 推进，不是一次命令瞬间完成全部动作。

## 共通约束

继续遵守前几项任务的 WebCAD 约束：

- 不直接 `scene.add` 裸 Three.js 对象。
- 新对象优先抽象成 `Entity + Display`。
- 行为通过 `Command` 触发。
- 状态变化后必须触发 dirty 或 view dirty，让视图能刷新。
- 只做能演示的小功能，不追求真实工业精度。

## 当前已有基础

任务 1 到任务 3 已经有这些可复用能力：

```text
SimpleWorkpiece
  - 保存工件类型、状态、库位、特征点/线/面
  - 支持 moveToPosition(...)
  - 状态和位置变化会触发 dirty

ConveyorEntity
  - 保存 startPoint / endPoint / direction / speed / capacity / status
  - 支持 start / stop / setStatus
  - Display 能显示传送带本体、起点、终点和方向提示

Command 链路
  - CreateSimpleWorkpieceCommand
  - MoveWorkpieceCommand
  - CreateConveyorCommand
  - SetConveyorStatusCommand

运行链路
  workpie_object.vue
    -> TempViewHandle
    -> Command
    -> Entity / Display
    -> TempCanvas.registerDisplayType(...)
```

任务 4 不需要推翻这些代码，而是在这条链路上新增一个“流水线调度层”。

## Edit Plan

- anchor_files:
  - `src/projects/template/model/workpiece/simple_workpiece.ts`
  - `src/projects/template/model/workpiece/simple_workpiece_factory.ts`
  - `src/projects/template/model/conveyor/conveyor_entity.ts`
  - `src/projects/template/display/conveyor/conveyor_display.ts`
  - `src/projects/template/command/cmd_create_simple_workpiece.ts`
  - `src/projects/template/command/cmd_move_workpiece.ts`
  - `src/projects/template/command/cmd_create_conveyor.ts`
  - `src/projects/template/command/cmd_set_conveyor_status.ts`
  - `src/projects/template/command/cmd_register.ts`
  - `src/projects/template/command/cmd_types.ts`
  - `src/projects/template/view/temp_canvas.ts`
  - `src/projects/template/view/temp_view_handle.ts`
  - `examples/views/workpie_object.vue`
- reuse_pattern: 复用当前仓库的 `CmdBase -> registerCmds -> TempCanvas._registerCommands -> Entity dirty -> Display refresh -> TempViewHandle.executeCommand` 链路。
- extension_point: `Entity` / `Display` / `Command` / `Canvas` / `Handle` / example UI。
- registration_path: UI 调用 `TempViewHandle`，handle 执行命令，命令创建或推进流水线实体，流水线实体更新工件和传送带状态，Canvas 通过 Display 注册链刷新视图。
- runtime_risks: tick 定时器清理、view 复用、状态 dirty 遗漏、传送带 blocked 状态回退、工作台忙导致出口阻塞、多个工件位置重叠。

## 推荐核心设计

最小可行方案建议新增一个流水线总控实体：

```text
PipelineEntity
  - 保存当前时间
  - 保存仓库队列 workpieceIds
  - 保存传送带上工件 slots
  - 保存出口等待队列 exitQueue
  - 保存上料装置状态
  - 保存下料装置状态
  - 保存工作台状态
  - 保存 blockedReason
```

流水线实体不直接创建 Three.js 对象。它只保存业务状态，并在 tick 时更新 `SimpleWorkpiece` 和 `ConveyorEntity`。显示层可以新增 `PipelineDisplay`，用简单几何画出仓库、上料装置、下料装置、工作台和状态标记。

推荐第一版状态图：

```text
warehouse
  -> loading
  -> conveyor
  -> exit_waiting
  -> unloading
  -> worktable
  -> done
```

传送带状态建议扩展为：

```ts
export type ConveyorStatus = 'idle' | 'running' | 'stopped' | 'blocked';
```

阻塞原因建议先做字符串枚举：

```ts
export type PipelineBlockedReason =
    | 'none'
    | 'conveyor_full'
    | 'conveyor_entry_occupied'
    | 'conveyor_exit_occupied'
    | 'worktable_busy'
    | 'loader_busy'
    | 'unloader_busy';
```

## 推荐实现顺序

### 第 1 步：补齐流水线状态词汇

目标：先定义清楚“工件在流水线里的位置”和“设备忙闲状态”，避免后面 UI、Command、Entity 各写一套字符串。

建议新增：

```text
src/projects/template/model/pipeline/pipeline_types.ts
src/projects/template/model/pipeline/index.ts
```

建议类型：

```ts
export type PipelineStatus = 'idle' | 'running' | 'paused' | 'blocked';
export type DeviceStatus = 'idle' | 'busy';

export type PipelineWorkpieceStage =
    | 'warehouse'
    | 'loading'
    | 'conveyor'
    | 'exit_waiting'
    | 'unloading'
    | 'worktable'
    | 'done';
```

要做的工作：

1. 定义流水线总状态 `PipelineStatus`。
2. 定义上下料装置状态 `DeviceStatus`。
3. 定义工件流水线阶段 `PipelineWorkpieceStage`。
4. 定义阻塞原因 `PipelineBlockedReason`。
5. 定义传送带 slot 数据：

```ts
export interface ConveyorSlot {
    workpieceId: number;
    progress: number; // 0 到 1，0 表示入口 A，1 表示出口 B
}
```

产出：

- 后续所有代码复用同一套类型。
- UI 能稳定展示状态和阻塞原因。

验收点：

- 不在 Vue 页面、Command、Entity 中散落魔法字符串。
- 阻塞原因能被明确表达，不只是 `true/false`。

### 第 2 步：扩展传送带状态，支持 blocked

目标：让传送带在出口阻塞时能进入 `blocked` 状态，满足“工作台忙时传送带状态变为 blocked”。

需要修改：

```text
src/projects/template/model/conveyor/conveyor_entity.ts
src/projects/template/display/conveyor/conveyor_display.ts
```

要做的工作：

1. 把 `ConveyorStatus` 扩展为：

```ts
export type ConveyorStatus = 'idle' | 'running' | 'stopped' | 'blocked';
```

2. 在 `ConveyorDisplay` 里增加 `blocked` 的显示颜色，例如红色或橙色。
3. 保持 `setStatus(...)` 内部继续调用：

```ts
this.dirtyMaterial();
this.dirty();
```

4. 如果 `status === 'blocked'`，方向箭头停止或闪烁，不再表现为正常运行。

产出：

- 传送带能表达 blocked。
- Display 能看出 blocked 和 running 的区别。

验收点：

- `blocked` 不是只存在 UI 文案里，而是 `ConveyorEntity.status` 的真实状态。
- 状态变化后画面刷新。

### 第 3 步：创建流水线总控 Entity

目标：把仓库队列、传送带 slots、出口等待、上下料状态、工作台状态集中放到业务实体中。

建议新增：

```text
src/projects/template/model/pipeline/pipeline_entity.ts
```

建议核心字段：

```ts
export interface PipelineMeta {
    id: string;
    conveyorId: number;
    workpieceIds: number[];
    tickSeconds: number;
    loaderDuration: number;
    unloaderDuration: number;
    worktableDuration: number;
}
```

`PipelineEntity` 内部建议保存：

```text
currentTime
status
warehouseQueue
conveyorSlots
exitQueue
loaderTask
unloaderTask
worktableTask
blockedReason
```

要做的工作：

1. 新增 `PipelineEntity extends FSCore.Model.CADEntity<PipelineMeta>` 或 `FSCore.Model.Group`。
2. 保存流水线状态，不保存 Three.js 对象。
3. 提供只读 getter：

```ts
public get waitingCount(): number;
public get conveyingCount(): number;
public get exitWaitingCount(): number;
public get blockedReason(): PipelineBlockedReason;
public get currentTime(): number;
```

4. 提供状态修改方法：

```ts
public start(): void;
public pause(): void;
public reset(...): void;
public tick(deltaSeconds: number, context: PipelineTickContext): PipelineSnapshot;
```

5. 每次状态变化后调用 `dirtyMaterial()` 或 `dirty()`。

产出：

- 有一个可以被 WebCAD document 管理的流水线业务实体。
- UI 的统计数据来自 `PipelineEntity`，不是 Vue 自己算一套。

验收点：

- `PipelineEntity` 能进入 WebCAD 实体体系。
- `Document.clear()` 后能随实体树释放，不留下孤立状态。
- 不直接操作 scene。

### 第 4 步：定义流水线空间布局

目标：明确仓库、入口 A、出口 B、工作台的位置，tick 更新工件时有稳定坐标。

建议新增：

```text
src/projects/template/model/pipeline/pipeline_layout.ts
```

建议第一版布局：

```ts
export const PIPELINE_LAYOUT = {
    warehouseBase: [-260, -160, 0],
    warehouseGap: [0, -90, 0],
    conveyorEntry: [0, 0, 0],
    conveyorExit: [800, 0, 0],
    worktable: [980, 120, 0],
    loader: [-80, 80, 0],
    unloader: [860, 80, 0]
} as const;
```

要做的工作：

1. 定义仓库中第 1、2、3 个工件的排队位置。
2. 定义传送带入口和出口，和 `ConveyorEntity.startPoint/endPoint` 保持一致。
3. 定义工作台位置。
4. 定义上料、下料装置显示位置。
5. 提供工具函数：

```ts
getWarehousePosition(index: number): [number, number, number]
interpolate(a, b, progress): [number, number, number]
getConveyorPosition(conveyor, progress): [number, number, number]
```

产出：

- 所有移动位置从同一个布局文件来。
- 后续 tick 不会散落坐标常量。

验收点：

- 至少 3 个工件在仓库中能错开显示。
- 上料、传送、下料移动路径能肉眼看懂。

### 第 5 步：实现流水线 Display

目标：让仓库、上料装置、下料装置、工作台这些新对象有可见表达。

建议新增：

```text
src/projects/template/display/pipeline/pipeline_display.ts
src/projects/template/display/pipeline/index.ts
```

推荐显示内容：

```text
PipelineDisplay
  - warehouse zone：仓库区域框
  - loader device：上料装置小方块
  - unloader device：下料装置小方块
  - worktable：工作台
  - blocked indicator：阻塞时显示红色标记
```

要做的工作：

1. `PipelineDisplay extends FSApp.View.Three.ThreeDisplay<PipelineEntity>`。
2. 在 `_createViewObj()` 中创建一个 `THREE.Group`。
3. 只在 Display 内创建 Three.js 几何，不在外部 `scene.add`。
4. 根据 `loader.status / unloader.status / worktable.status / blockedReason` 改颜色。
5. 在 `onCleanup()` 中释放手工创建的 geometry/material。

产出：

- 仓库、上下料装置、工作台能显示。
- 忙闲状态和阻塞状态有可见变化。

验收点：

- 新显示对象由 `PipelineEntity -> PipelineDisplay` 映射创建。
- 不把显示状态只写在 Vue 面板里。

### 第 6 步：实现创建流水线 demo 命令

目标：通过一个命令创建完整 demo 初始状态：3 个工件、1 条传送带、1 个流水线实体。

建议新增：

```text
src/projects/template/command/cmd_create_pipeline_demo.ts
```

建议命令名：

```ts
CREATE_PIPELINE_DEMO = 'create_pipeline_demo'
```

命令逻辑：

```text
CreatePipelineDemoCommand.commit()
1. 查找或创建 ConveyorEntity
2. 创建至少 3 个 SimpleWorkpiece
3. 把 3 个工件放到仓库排队位置
4. 创建 PipelineEntity
5. PipelineEntity 保存 conveyorId 和 workpieceIds
6. addModel(pipeline)
7. dirtyGeometry / dirtyPosition / view.dirty
8. fitView
9. super.commit(...)
```

要做的工作：

1. 复用 `SimpleWorkpieceFactory.create(...)` 创建工件。
2. 复用或直接创建 `ConveyorEntity`，但动作必须在 command 内完成。
3. 给每个工件设置：

```ts
workpiece.setState('waiting');
workpiece.setLocation('warehouse_01');
workpiece.moveToPosition(getWarehousePosition(index));
```

4. 创建 `PipelineEntity`，把工件 id 按顺序放入 `warehouseQueue`。
5. 如果已经存在旧流水线 demo，先清理或重置，避免重复创建多套 demo。

产出：

- 点击一次按钮即可得到 3 个仓库排队工件、传送带和流水线设备。

验收点：

- 至少 3 个工件在仓库中排队。
- 工件、传送带、流水线实体都进入 WebCAD 实体体系。
- 不从 Vue 页面直接 new 实体。

### 第 7 步：实现单步 tick 命令

目标：让流水线每次只推进一个小时间片，满足“按 tick 推进，不是瞬间完成”。

建议新增：

```text
src/projects/template/command/cmd_tick_pipeline.ts
```

建议命令名：

```ts
TICK_PIPELINE = 'tick_pipeline'
```

建议参数：

```ts
export interface TickPipelineParams {
    pipelineId: number;
    deltaSeconds: number;
}
```

命令逻辑：

```text
TickPipelineCommand.commit()
1. 根据 pipelineId 找 PipelineEntity
2. 找对应 ConveyorEntity
3. 找本 tick 可能影响的 SimpleWorkpiece
4. 调用 pipeline.tick(deltaSeconds, context)
5. tick 内部更新队列、slots、设备状态
6. 根据 tick 结果更新工件位置、状态、库位
7. 更新 ConveyorEntity.status
8. 派发 PipelineTickEvent
9. view.dirty()
10. super.commit(...)
```

推荐事件：

```ts
export interface PipelineTickEvent {
    type: 'pipelineTick';
    pipelineId: number;
    currentTime: number;
    waitingCount: number;
    conveyingCount: number;
    exitWaitingCount: number;
    blockedReason: PipelineBlockedReason;
}
```

产出：

- 手动点击“单步 Tick”能看到时间增加、工件逐步移动、统计变化。

验收点：

- 每次 tick 只推进 `deltaSeconds`。
- 工件不会瞬间从仓库跳到工作台。
- 状态变化后 UI 和视图都刷新。

### 第 8 步：实现 tick 状态机规则

目标：把任务描述中的业务流程变成清晰、可调试的状态机。

建议在 `PipelineEntity.tick(...)` 中按固定顺序处理：

```text
1. currentTime += deltaSeconds
2. 推进上料装置任务
3. 推进下料装置任务
4. 推进工作台任务
5. 检查出口等待和工作台
6. 推进传送带上工件
7. 检查入口是否可以上料
8. 生成快照
```

关键规则：

1. 仓库队首上料：
   - 条件：仓库队列非空。
   - 条件：传送带入口空闲。
   - 条件：上料装置空闲。
   - 条件：传送带未满。
   - 动作：开始 loading 任务，持续 `loaderDuration`。

2. 上料完成：
   - 动作：工件进入传送带 slot，`progress = 0`。
   - 动作：工件位置变为入口 A。
   - 动作：工件状态变为传送中。

3. 传送带推进：
   - 条件：传送带 `running` 且未 blocked。
   - 动作：每个 slot 的 `progress += speed * deltaSeconds / conveyor.length`。
   - 限制：不能超过前一个工件，避免后车穿过前车。
   - 限制：slot 数不能超过 `capacity`。

4. 到达出口：
   - 如果出口等待队列为空，工件进入 `exit_waiting`。
   - 如果出口已有工件，后续工件停在出口前，`blockedReason = 'conveyor_exit_occupied'`。

5. 出口下料：
   - 条件：出口等待队列非空。
   - 条件：下料装置空闲。
   - 条件：工作台空闲。
   - 动作：开始 unloading 任务，持续 `unloaderDuration`。

6. 工作台忙：
   - 如果出口有工件，但工作台忙，则工件停在出口。
   - `blockedReason = 'worktable_busy'`。
   - `ConveyorEntity.status = 'blocked'`。
   - 后续工件不能继续前进。

7. 工作台完成：
   - 工作台任务倒计时归零后，工件状态变为 `done`。
   - 工作台恢复空闲。
   - 如果出口仍有等待工件，后续 tick 可以继续下料。

产出：

- 流水线行为可预测。
- 阻塞原因可解释。

验收点：

- 入口占用或上料忙时，仓库工件继续等待。
- 工作台忙时，出口工件不消失。
- 出口阻塞时，后续工件停止前进。
- 容量限制生效。

### 第 9 步：更新工件状态和位置

目标：让工件在画布上的位置和业务状态同步 tick 结果。

需要修改：

```text
src/projects/template/model/workpiece/simple_workpiece.ts
```

建议扩展 `WorkpieceState`：

```ts
export type WorkpieceState =
    | 'waiting'
    | 'loading'
    | 'moving'
    | 'arrived'
    | 'unloading'
    | 'processing'
    | 'done';
```

如果想最小改动，也可以复用现有状态：

```text
waiting    -> 仓库等待
moving     -> loading / conveyor / unloading
arrived    -> 出口等待
processing -> 工作台
done       -> 完成
```

推荐第一版扩展状态，因为 UI 更容易解释。

要做的工作：

1. loading 时，工件从仓库位置插值到入口 A。
2. conveyor 时，工件沿 `ConveyorEntity.startPoint -> endPoint` 移动。
3. exit_waiting 时，工件停在出口 B。
4. unloading 时，工件从出口 B 插值到工作台。
5. worktable 时，工件停在工作台。
6. done 后，工件保留在工作台或移动到完成区。
7. 每次位置变化调用：

```ts
workpiece.moveToPosition(nextPosition);
```

8. 每次状态或库位变化调用：

```ts
workpiece.setState(nextState);
workpiece.setLocation(nextLocation);
```

产出：

- 多个工件能按 tick 在仓库、传送带、出口、工作台之间移动。

验收点：

- 工件位置变化不是只更新 UI 数字。
- dirtyPosition 和 dirtyMaterial 能触发显示刷新。
- 工件不会互相穿越或无限重叠。

### 第 10 步：补命令类型、注册链和 Display 注册

目标：让流水线新增能力真正进入 WebCAD 运行时。

需要修改：

```text
src/projects/template/command/cmd_types.ts
src/projects/template/command/cmd_register.ts
src/projects/template/view/temp_canvas.ts
src/projects/template/index.ts
```

建议新增命令类型：

```ts
CREATE_PIPELINE_DEMO = 'create_pipeline_demo',
START_PIPELINE = 'start_pipeline',
STOP_PIPELINE = 'stop_pipeline',
TICK_PIPELINE = 'tick_pipeline'
```

建议新增命令文件：

```text
src/projects/template/command/cmd_create_pipeline_demo.ts
src/projects/template/command/cmd_set_pipeline_status.ts
src/projects/template/command/cmd_tick_pipeline.ts
```

如果想更少文件，也可以用：

```text
cmd_create_pipeline_demo.ts
cmd_tick_pipeline.ts
```

其中 start/stop 只是设置 `PipelineEntity.status`。

需要注册：

```ts
[CMD_TYPES.CREATE_PIPELINE_DEMO]: CreatePipelineDemoCommand,
[CMD_TYPES.START_PIPELINE]: StartPipelineCommand,
[CMD_TYPES.STOP_PIPELINE]: StopPipelineCommand,
[CMD_TYPES.TICK_PIPELINE]: TickPipelineCommand
```

Display 注册：

```ts
this.registerDisplayType(PipelineEntity, e => this.createDisplay(e, PipelineDisplay));
```

导出：

```ts
export * from './model/pipeline';
export * from './command/cmd_create_pipeline_demo';
export * from './command/cmd_tick_pipeline';
```

产出：

- 命令能被 CommandManager 找到。
- `PipelineEntity` 能显示。
- 示例页能从模板入口导入类型。

验收点：

- 不直接 `new Command`。
- 不遗漏 `TempCanvas._registerDisplay()`。
- 不依赖父类 Display 自动兜底。

### 第 11 步：补 Handle API 和 UI 自动 tick

目标：让示例页通过 Handle 触发命令，并能自动按固定节拍推进。

需要修改：

```text
src/projects/template/view/temp_view_handle.ts
examples/views/workpie_object.vue
```

Handle 建议新增：

```ts
public createPipelineDemo(): Promise<void>
public startPipeline(params: { pipelineId: number }): Promise<void>
public stopPipeline(params: { pipelineId: number }): Promise<void>
public tickPipeline(params: TickPipelineParams): Promise<void>
public findFirstPipeline(): PipelineEntity | null
```

UI 建议新增按钮：

```text
创建流水线 demo
启动
暂停
单步 Tick
重置
```

自动 tick 建议：

```text
Vue setInterval
  -> 每 300ms 调用 viewHandle.tickPipeline({ deltaSeconds: 0.3 })
  -> onUnmounted 清理 interval
```

说明：

- 定时器只负责“按时间触发命令”。
- 真正改变业务状态的是 `TickPipelineCommand`。
- 如果页面卸载，必须清理 interval，避免 view 复用后重复 tick。

UI 信息面板至少显示：

```text
当前时间
仓库等待数量
传送中数量
出口等待数量
阻塞原因
传送带状态
上料装置状态
下料装置状态
工作台状态
```

产出：

- 用户能启动、暂停、单步推进流水线。
- 页面能看到验收要求中的统计数据。

验收点：

- UI 不直接改 `PipelineEntity`。
- 自动 tick 能停止，不会离开页面后继续运行。
- 统计数据来自 `PipelineEntity` 快照。

### 第 12 步：最小验证

目标：实现后能证明任务 4 的验收项成立。

手动验证：

1. 打开示例页。
2. 点击“创建流水线 demo”。
3. 看到至少 3 个工件在仓库中排队。
4. 看到传送带、上料装置、下料装置、工作台。
5. 点击“启动”。
6. 当前时间开始按 tick 增加。
7. 仓库队首工件经过上料动作到达传送带入口。
8. 工件沿传送带从 A 移动到 B。
9. 传送带上的工件数量不超过 `capacity`。
10. 工件到达出口后等待下料。
11. 工作台空闲时，下料装置把工件放到工作台。
12. 人为让工作台忙或设置较长 `worktableDuration`，验证出口等待工件导致传送带 `blocked`。
13. 页面显示：
    - 当前时间
    - 仓库等待数量
    - 传送中数量
    - 出口等待数量
    - 阻塞原因
14. 点击“暂停”，tick 停止。
15. 再次启动，流程继续。

命令行验证：

```bash
npm run build
```

如果全量 build 仍输出 examples 旧文件类型问题，可以过滤任务 4 相关文件：

```powershell
npx vue-tsc --noEmit --pretty false 2>&1 | Select-String -Pattern "pipeline|conveyor|workpiece|cmd_tick_pipeline|workpie_object|temp_canvas|temp_view_handle"
```

## 推荐最终文件改动清单

```text
src/projects/template/model/pipeline/pipeline_types.ts
  - 新增 PipelineStatus / DeviceStatus / PipelineWorkpieceStage / PipelineBlockedReason
  - 新增 ConveyorSlot / PipelineSnapshot 等类型

src/projects/template/model/pipeline/pipeline_layout.ts
  - 定义仓库、入口、出口、工作台、上下料装置坐标
  - 提供插值和传送带位置计算工具

src/projects/template/model/pipeline/pipeline_entity.ts
  - 新增 PipelineEntity
  - 保存 currentTime、仓库队列、传送带 slots、出口队列、上下料状态、工作台状态、阻塞原因
  - 实现 tick 状态机

src/projects/template/model/pipeline/index.ts
  - 导出流水线类型和实体

src/projects/template/display/pipeline/pipeline_display.ts
  - 显示仓库、上料装置、下料装置、工作台、阻塞状态
  - cleanup 释放 geometry/material

src/projects/template/display/pipeline/index.ts
  - 导出 PipelineDisplay

src/projects/template/model/conveyor/conveyor_entity.ts
  - 扩展 ConveyorStatus，增加 blocked

src/projects/template/display/conveyor/conveyor_display.ts
  - 增加 blocked 状态颜色或视觉效果

src/projects/template/model/workpiece/simple_workpiece.ts
  - 可选扩展 WorkpieceState：loading / unloading

src/projects/template/command/cmd_create_pipeline_demo.ts
  - 创建 3 个工件、传送带、流水线实体
  - 初始化仓库排队状态

src/projects/template/command/cmd_tick_pipeline.ts
  - 按 deltaSeconds 推进流水线
  - 更新工件位置、状态、传送带 blocked/running 状态
  - 派发 PipelineTickEvent

src/projects/template/command/cmd_set_pipeline_status.ts
  - 启动 / 暂停 / 停止流水线

src/projects/template/command/cmd_types.ts
  - 新增 CREATE_PIPELINE_DEMO / START_PIPELINE / STOP_PIPELINE / TICK_PIPELINE

src/projects/template/command/cmd_register.ts
  - 注册流水线相关命令

src/projects/template/view/temp_canvas.ts
  - 注册 PipelineEntity -> PipelineDisplay

src/projects/template/view/temp_view_handle.ts
  - 新增 createPipelineDemo / startPipeline / stopPipeline / tickPipeline / findFirstPipeline

src/projects/template/index.ts
  - 导出 pipeline model 和 command 参数

examples/views/workpie_object.vue
  - 增加流水线控制按钮
  - 增加流水线状态面板
  - 自动 tick 定时器在 onUnmounted 清理
```

## 任务 4 的最小完成定义

最小完成版本只需要做到：

- 能通过命令创建一套流水线 demo。
- 仓库中至少有 3 个工件排队。
- 上料装置按 tick 把队首工件放到传送带入口。
- 传送带启动后，工件按 tick 从 A 移动到 B。
- 传送带上的工件数量不超过 `capacity`。
- 工件到达出口后进入出口等待。
- 工作台空闲且下料装置空闲时，工件被放到工作台。
- 工作台忙时，出口工件等待，传送带进入 `blocked`。
- 出口阻塞时，后续工件不能继续前进。
- UI 显示当前时间、仓库等待数量、传送中数量、出口等待数量、阻塞原因。
- 流程由 tick 推进，不是一帧完成。

暂不要求：

- 不要求真实碰撞检测。
- 不要求复杂路径规划。
- 不要求 PLC 级别节拍精度。
- 不要求工件真实占位体积计算。
- 不要求多个传送带或多工作台。

## 方案审查自检

- 边界：任务 4 是业务库流水线 demo，不需要修改 `cadnginx` 或 `fscadweb`。
- 注册链：新增 `PipelineEntity` 后必须补 `PipelineDisplay` 和 `TempCanvas.registerDisplayType(...)`。
- 命令链：创建、启动、停止、tick 都通过 command 触发。
- dirty：工件位置、工件状态、传送带状态、流水线统计变化后必须 dirty。
- 生命周期：自动 tick 定时器必须在 Vue `onUnmounted` 清理；Display 内手工 geometry/material 必须在 `onCleanup()` 释放。
- view 复用：不要把 pipeline 单例挂到模块全局；通过当前 view 的 document 查找实体。

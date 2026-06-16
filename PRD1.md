# PRD1：手动上下料传送带流程整改方案

## 1. 背景

当前示例页已经具备：

- 创建简单工件：`CreateSimpleWorkpieceCommand`
- 移动工件：`MoveWorkpieceCommand`
- 创建传送带：`CreateConveyorCommand`
- 启停传送带：`SetConveyorStatusCommand`
- 一键创建流水线演示：`CreatePipelineDemoCommand`
- 流水线 tick 推进：`TickPipelineCommand`
- 示例 UI：`examples/views/workpie_object.vue`

现有 Task4 方案偏向“一键创建流水线”，用户点击“创建流水线”后自动生成仓库、传送带、工件和流程状态。新的整改目标是去掉这个一键入口，把流程拆成真实业务动作：

1. 创建几何体，工件进入仓库。
2. 点击上料，将仓库中的工件放上传送带入口。
3. 启动传送带后，工件沿传送带移动到 B 点。
4. 工件到达 B 点后，点击下料，把工件从传送带出口拿下。
5. 页面不再出现“创建流水线”按钮，流水线由“仓库 -> 上料 -> 传送 -> 到 B 点 -> 下料”的手动操作串起来。

## 2. 设计边界

本次整改仍然遵守 WebCAD 业务库开发约束：

- 不直接 `scene.add` 裸 Three.js 对象。
- 工件、传送带、流程状态仍然进入 Entity / Display / Document 体系。
- 用户行为通过 Command 触发。
- 状态变化后必须调用 `dirty*()` 或 `view.dirty()` 触发视图刷新。
- 不修改 `cadnginx` / `fscadweb` 底座。
- 不追求工业精度，目标是一个能演示的最小业务流程。

## 3. 源码基线

### 3.1 工件

相关文件：

- `src/projects/template/model/workpiece/simple_workpiece.ts`
- `src/projects/template/model/workpiece/simple_workpiece_factory.ts`
- `src/projects/template/command/cmd_create_simple_workpiece.ts`
- `src/projects/template/command/cmd_move_workpiece.ts`

当前行为：

- `SimpleWorkpiece` 是 `FSCore.Model.Group`。
- 工件状态已有 `waiting / loading / moving / arrived / unloading / processing / done`。
- 工件可通过 `moveToPosition()` 修改位置，并触发 `dirtyPosition()` / `dirty()`。
- `CreateSimpleWorkpieceCommand` 会创建工件并加入 WebCAD 模型层。

### 3.2 传送带

相关文件：

- `src/projects/template/model/conveyor/conveyor_entity.ts`
- `src/projects/template/display/conveyor/conveyor_display.ts`
- `src/projects/template/command/cmd_create_conveyor.ts`
- `src/projects/template/command/cmd_set_conveyor_status.ts`

当前行为：

- `ConveyorEntity` 已有 `startPoint / endPoint / speed / capacity / status`。
- 传送带状态包含 `idle / running / stopped / blocked`。
- `ConveyorDisplay` 已能显示方向箭头和运行状态。

### 3.3 现有流水线演示

相关文件：

- `src/projects/template/model/pipeline/pipeline_entity.ts`
- `src/projects/template/display/pipeline/pipeline_display.ts`
- `src/projects/template/command/cmd_create_pipeline_demo.ts`
- `src/projects/template/command/cmd_set_pipeline_status.ts`
- `src/projects/template/command/cmd_tick_pipeline.ts`
- `examples/views/workpie_object.vue`

当前问题：

- UI 暴露了“创建流水线”按钮，流程由一键 demo 驱动。
- 新需求要求取消该按钮，改为用户逐步点击“创建工件、创建传送带、启动传送带、上料、下料”。
- 现有 `PipelineEntity` 的状态机可以作为参考，但不应再作为 UI 上的一键创建入口。

## 4. 目标流程

### 4.1 基础坐标约定

- 仓库：`warehouse_01`
- 传送带入口 A 点：`conveyor.startPoint`
- 传送带出口 B 点：`conveyor.endPoint`
- 工作台 / 下料点：`worktable_01`

默认传送带示例：

```ts
{
    id: 'conveyor_01',
    startPoint: [0, 0, 0],
    endPoint: [800, 0, 0],
    speed: 100,
    capacity: 2,
    status: 'idle'
}
```

### 4.2 用户操作流程

1. 用户点击“创建立方体”或“创建圆柱体”。
2. 工件被创建到仓库队列位置，状态为 `waiting`，位置为 `warehouse_01`。
3. 用户点击“创建传送带”。
4. 用户点击“启动传送带”，传送带状态变为 `running`。
5. 用户点击“上料”。
6. 系统从仓库等待队列中取一个工件，移动到传送带 A 点。
7. 如果传送带正在运行，工件沿 A -> B 移动。
8. 工件到达 B 点后，状态变为 `arrived`，位置为 `conveyor_exit`。
9. 用户点击“下料”。
10. 系统把 B 点等待工件移动到工作台，状态变为 `processing` 或 `done`。

## 5. 分步实现计划

### Step 1：统一仓库创建行为

目标：

- 所有新建工件默认进入仓库，而不是散落在普通画布坐标中。

需要做的工作：

- 调整 `CreateSimpleWorkpieceCommand` 的默认放置逻辑。
- 增加仓库布局 helper，例如 `getWarehousePosition(index)`，复用当前 `pipeline_layout.ts` 或抽到更通用的位置。
- 新建工件时：
  - `state = 'waiting'`
  - `location = 'warehouse_01'`
  - `center = warehouse queue position`
- 如果页面连续创建多个工件，自动按队列错开放置。

产出：

- 点击“创建立方体 / 创建圆柱体”后，工件显示在仓库区域。
- UI 能显示仓库等待数量。

### Step 2：定义手动上料命令

目标：

- 点击“上料”时，把仓库中的一个工件放到传送带入口 A 点。

需要做的工作：

- 新增命令：`LoadWorkpieceCommand`。
- 命令参数建议：

```ts
interface LoadWorkpieceParams {
    conveyorId: number;
    workpieceId?: number;
    duration?: number;
}
```

- 如果传入 `workpieceId`，优先上料该工件。
- 如果没有传入 `workpieceId`，从 `location === 'warehouse_01' && state === 'waiting'` 的工件中取第一个。
- 校验传送带入口是否空闲，传送带容量是否未满。
- 上料过程中工件状态：
  - 开始：`loading`
  - 到达 A 点：`moving`
  - 位置：`conveyor_01`
- 上料动画仍通过 Entity 位姿变化实现，不能直接操作 Three.js。

产出：

- UI 增加“上料”按钮。
- 点击后，一个仓库工件移动到传送带入口。
- 仓库等待数量减少。
- 入口被占用或容量满时，上料按钮禁用或命令取消并给出状态提示。

### Step 3：实现传送带带动工件到 B 点

目标：

- 传送带启动后，已上料工件沿 A -> B 移动。

需要做的工作：

- 新增或改造命令：`TickConveyorWorkpiecesCommand`。
- 每次 tick 根据传送带 `speed` 和 `deltaSeconds` 更新工件进度。
- 可以复用 `PipelineEntity.tick()` 中的进度计算思想，但 UI 不再暴露“创建流水线”。
- 工件到达 B 点后：
  - `state = 'arrived'`
  - `location = 'conveyor_exit'`
  - `remaining = 0`
- 如果 B 点已有等待下料工件，则后续工件停止在后方，传送带可变为 `blocked`。

产出：

- 点击“启动传送带”后，传送带箭头流动。
- 点击“上料”后，工件不是瞬移到 B 点，而是按 tick 沿传送带移动。
- 工件到达 B 点后停止等待下料。

### Step 4：定义手动下料命令

目标：

- 点击“下料”时，把 B 点工件从传送带出口拿到工作台。

需要做的工作：

- 新增命令：`UnloadWorkpieceCommand`。
- 命令参数建议：

```ts
interface UnloadWorkpieceParams {
    workpieceId?: number;
    duration?: number;
}
```

- 如果传入 `workpieceId`，下料该工件。
- 如果没有传入 `workpieceId`，从 `location === 'conveyor_exit' && state === 'arrived'` 中取第一个。
- 下料过程中工件状态：
  - 开始：`unloading`
  - 到达工作台：`processing` 或 `done`
  - 位置：`worktable_01`
- 工作台忙时，下料按钮禁用或命令取消。

产出：

- UI 增加“下料”按钮。
- B 点等待工件能被移动到工作台。
- B 点等待数量减少。
- 如果传送带因出口阻塞变为 `blocked`，下料成功后可以恢复运行。

### Step 5：移除一键流水线 UI

目标：

- 页面不再出现“创建流水线 / 启动流水线 / 暂停 / 单步 Tick”按钮。
- 流水线由用户按业务动作一步步触发。

需要做的工作：

- 修改 `examples/views/workpie_object.vue`。
- 删除或隐藏：
  - `createPipelineDemo`
  - `startPipeline`
  - `pausePipeline`
  - `tickPipelineOnce`
  - 流水线按钮行
- 新增按钮：
  - `上料`
  - `下料`
- 保留状态面板，但改名为“物流状态”或“仓库/传送状态”。
- 面板显示：
  - 仓库等待数量
  - 传送中数量
  - B 点等待数量
  - 传送带状态
  - 当前阻塞原因

产出：

- 用户视角不再需要“创建流水线”。
- 页面流程更接近：创建工件 -> 创建传送带 -> 启动传送带 -> 上料 -> 到 B 点 -> 下料。

### Step 6：梳理状态来源

目标：

- 明确状态到底存在哪里，避免 UI 自己维护一套和 Entity 不一致的流程状态。

推荐方案：

- 工件状态仍存在 `SimpleWorkpiece`。
- 传送带设备状态仍存在 `ConveyorEntity`。
- 传送中队列、出口等待、容量占用可以二选一：
  - 方案 A：继续复用 `PipelineEntity` 作为后台流程状态实体，但不暴露“创建流水线”按钮。
  - 方案 B：新增更轻量的 `ConveyorTransportEntity`，只管理传送带上的工件槽位。

建议优先选择方案 A：

- 当前仓库已经有 `PipelineEntity`、`PipelineDisplay`、`TickPipelineCommand`。
- 最小改动是把它从“一键 demo 实体”改成“后台流程状态实体”。
- UI 上不再叫流水线，也不暴露创建按钮。

需要做的工作：

- 将 `CreatePipelineDemoCommand` 拆分或废弃。
- 增加初始化/获取流程状态的方法，例如：
  - 创建传送带时自动创建或复用后台流程状态实体。
  - 第一次上料时如果没有状态实体，则自动创建。
- `TempViewHandle` 暴露业务方法：
  - `loadWorkpiece(...)`
  - `unloadWorkpiece(...)`
  - `tickConveyorWorkpieces(...)`
  - `getLogisticsSnapshot()`

产出：

- 状态来源闭合。
- UI 不需要自己维护工件队列。
- 后续多工件容量限制和出口阻塞仍有可扩展位置。

### Step 7：注册链和导出链补齐

目标：

- 所有新增命令都能通过 handle 执行。

需要做的工作：

- `cmd_types.ts`
  - 新增 `LOAD_WORKPIECE`
  - 新增 `UNLOAD_WORKPIECE`
  - 新增 `TICK_CONVEYOR_WORKPIECES`
- `cmd_register.ts`
  - 注册新增命令类。
- `temp_view_handle.ts`
  - 增加 `loadWorkpiece`
  - 增加 `unloadWorkpiece`
  - 增加 `tickConveyorWorkpieces`
- `index.ts`
  - 导出新增命令参数和事件类型。
- 如果新增实体或显示：
  - `temp_canvas.ts` 补 `registerDisplayType(...)`
  - `display/index.ts` / `model/index.ts` 补导出。

产出：

- UI 只调用 handle。
- 行为只通过 Command。
- 新增能力能进入 WebCAD 当前 view 的 `CommandManager`。

### Step 8：UI 状态和按钮可用性

目标：

- 用户能按正确顺序操作，不容易点出非法状态。

需要做的工作：

- “上料”按钮启用条件：
  - 存在传送带。
  - 仓库存在 `waiting` 工件。
  - 传送带入口未占用。
  - 传送带容量未满。
- “下料”按钮启用条件：
  - B 点存在 `arrived` 工件。
  - 工作台空闲。
- “启动传送带”按钮启用条件：
  - 存在传送带。
  - 传送带状态不是 `running`。
- “停止传送带”按钮启用条件：
  - 传送带状态是 `running` 或 `blocked`。

产出：

- 页面操作顺序清晰。
- 错误状态不依赖用户猜测。
- UI 文案从“流水线”改成“仓库 / 上料 / 传送 / 下料”。

## 6. 验收标准

- [ ] 点击“创建立方体 / 创建圆柱体”，工件出现在仓库区域。
- [ ] 工件初始状态为 `waiting`，位置为 `warehouse_01`。
- [ ] 页面显示仓库等待数量。
- [ ] 点击“创建传送带”，出现传送带，并显示 A 点、B 点、方向、速度、容量、状态。
- [ ] 点击“启动传送带”，传送带状态变为 `running`，方向提示可见。
- [ ] 点击“上料”，仓库中的一个工件移动到传送带入口 A 点。
- [ ] 上料后，仓库等待数量减少，传送中数量增加。
- [ ] 工件沿传送带移动到 B 点，而不是瞬间完成。
- [ ] 工件到达 B 点后状态变为 `arrived`，位置为 `conveyor_exit`。
- [ ] 点击“下料”，B 点工件移动到工作台。
- [ ] 下料后，B 点等待数量减少，工作台状态更新。
- [ ] 传送带容量限制生效。
- [ ] B 点被占用时，后续工件不能继续前进，传送带可显示 `blocked`。
- [ ] 页面不再出现“创建流水线”按钮。
- [ ] 所有动作由 Command 触发，UI 不直接改 Entity 或 Three.js 对象。
- [ ] 状态变化后视图能刷新。

## 7. 风险与注意事项

### 7.1 状态重复风险

不要让 Vue 组件单独维护一套仓库队列、传送中队列和 B 点队列。UI 应从 Entity / snapshot 读取状态。

### 7.2 view 复用风险

`CadApp.addView(...)` 会复用同 tag 的 view。页面中的定时器、监听器必须在 `onUnmounted` 中清理。

### 7.3 dirty 刷新风险

工件位置变化必须走 `moveToPosition()`，状态变化必须调用 `setState()` / `setLocation()`，这些方法内部要触发 dirty。

### 7.4 旧流水线代码处理

短期建议：

- 保留 `PipelineEntity` 作为后台状态容器。
- 移除 UI 上的“创建流水线”入口。
- 废弃或下沉 `CreatePipelineDemoCommand`，不要让用户继续一键创建完整 demo。

中期建议：

- 如果后续只需要传送带载荷管理，可以把 `PipelineEntity` 拆成更明确的 `LogisticsFlowEntity` 或 `ConveyorTransportEntity`。

## 8. 推荐实施顺序

1. 改造工件创建位置：让工件进入仓库。
2. 新增上料命令：仓库 -> 传送带 A 点。
3. 新增传送 tick：A 点 -> B 点。
4. 新增下料命令：B 点 -> 工作台。
5. 改造 UI：去掉“创建流水线”，增加“上料 / 下料”。
6. 整理状态面板：仓库等待、传送中、B 点等待、阻塞原因。
7. 补齐命令注册、handle、导出链。
8. 构建验证和页面烟测。

## 9. 最小验证命令

```bash
npm run build
```

如果构建输出仍有历史示例报错，需要确认新增文件是否出现在错误列表中。新增整改代码不能引入新的 TypeScript 错误。

## 10. 最小手工演示路径

1. 打开 `examples/views/workpie_object.vue` 对应页面。
2. 点击“创建立方体”三次，确认仓库中有 3 个工件。
3. 点击“创建传送带”。
4. 点击“启动传送带”。
5. 点击“上料”，观察第一个工件进入 A 点并沿传送带移动。
6. 工件到达 B 点后，点击“下料”。
7. 重复上料/下料，确认容量、B 点等待和阻塞状态可见。

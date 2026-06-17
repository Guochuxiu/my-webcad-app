# PRD3：下料完成区防重叠与手动下料位置整改

## 1. 背景

当前页面已经支持手动物流和自动化流水线：

- 工件：`SimpleWorkpiece`
- 传送带：`ConveyorEntity`
- 上下料装置：`LoadingDeviceEntity`
- 自动化流程：`PipelineEntity.tick(...)`
- 手动下料：`UnloadWorkpieceCommand`
- 布局工具：`pipeline_layout.ts`
- 示例页面：`examples/views/workpie_object.vue`

本次整改只处理两个位置布局问题，不改变 WebCAD 接入方式：

1. 自动化流水线多次运行后，下料完成的工件可能和上一轮自动化创建/完成的工件重叠。
2. 手动下料时，工件放置位置离下料装置过近，看起来像占据了下料装置，需要沿 Y 轴偏移。

所有行为仍然必须通过 Command / Entity 状态变化触发，不在 Vue 中直接移动实体，不直接 `scene.add` Three.js 对象。

## 2. 问题分析

### 2.1 自动化完成区重叠

当前自动化完成区位置主要由：

- `PipelineEntity._advanceWorktable(...)`
- `PipelineEntity._completedIds.length`
- `getCompletedPosition(index)`

共同决定。

问题在于：每次点击“自动化流水线”后，如果复用或重置 `PipelineEntity`，内部 `_completedIds` 会从 0 重新计数。新一轮自动化完成的工件会再次从 `getCompletedPosition(0)` 开始摆放，和上一轮已经完成、仍在场景中的工件重叠。

### 2.2 手动下料占据下料装置

当前手动下料位置主要由：

- `UnloadWorkpieceCommand._getWorktablePosition()`
- `PIPELINE_LAYOUT.worktablePoint`

共同决定。

手动下料直接把工件放到工作台区域，如果该点位离 `unloader_01` 太近，视觉上会像工件占据了下料装置。需求允许通过沿 Y 轴移动手动下料位置来解决。

## 3. 设计目标

- 自动化多轮运行时，完成工件按全局已完成数量继续排布，不和旧工件重叠。
- 手动下料后的工件位置沿 Y 轴偏移，避开下料装置显示区域。
- 自动化下料位置和手动下料位置都来自统一布局 helper，避免多个文件硬编码坐标。
- 状态变化后继续通过 `moveToPosition(...)`、`dirty*()`、`view.dirty()` 触发刷新。
- 不新增复杂工业节拍，仅满足可演示和可验收。

## 4. 分步实现计划

### Step 1：梳理完成区和手动下料的现有位置来源

目标：

- 明确自动化完成区和手动下料区分别由哪些代码计算坐标。

需要做的工作：

- 检查 `src/projects/template/model/pipeline/pipeline_layout.ts`：
  - `PIPELINE_LAYOUT.worktablePoint`
  - `PIPELINE_LAYOUT.completedStart`
  - `PIPELINE_LAYOUT.completedGap`
  - `getCompletedPosition(index)`
- 检查 `src/projects/template/model/pipeline/pipeline_entity.ts`：
  - `_advanceWorktable(...)`
  - `_completedIds`
  - `workpiece.moveToPosition(getCompletedPosition(completedIndex))`
- 检查 `src/projects/template/command/cmd_unload_workpiece.ts`：
  - `_getWorktablePosition()`
  - 当前 `doneCount * 90` 的 Y 轴偏移逻辑。

产出：

- 明确自动化完成区重叠来自“Pipeline 内部完成计数重置”。
- 明确手动下料偏移应该优先落在布局 helper，而不是只在命令中写死坐标。

### Step 2：在布局层新增统一的下料/完成区位置 helper

目标：

- 把自动化完成区和手动下料区的坐标计算集中到 `pipeline_layout.ts`。

需要做的工作：

- 新增手动下料区域配置，例如：
  - `manualUnloadStart`
  - `manualUnloadGap`
- 新增自动化完成区全局位置 helper，例如：
  - `getCompletedPosition(index)`
  - 保留现有函数，但后续传入全局完成序号。
- 新增手动下料位置 helper，例如：
  - `getManualUnloadPosition(index)`
- 手动下料位置建议沿 Y 轴远离下料装置，例如：
  - 基于 `worktablePoint`
  - Y 方向额外偏移 `180` 或更大
  - 后续每个工件再按 `90` 或 `110` 间距排列。

产出：

- 布局文件成为下料位置的唯一事实来源。
- 自动化完成区和手动下料区在视觉上分开。

### Step 3：修复自动化完成区全局计数

目标：

- 自动化流水线多次启动后，新完成工件不再从完成区第 0 个位置重新摆放。

需要做的工作：

- 在 `PipelineEntity._advanceWorktable(...)` 中，不再只使用 `_completedIds.length` 作为完成区序号。
- 增加一种全局完成序号来源，推荐最小改动方案：
  - 在 `PipelineTickContext` 中增加可选方法 `getCompletedIndex?(): number`。
  - `TickAutomationPipelineCommand` 调用 `pipeline.tick(...)` 时，从当前 `doc.entityList` 统计已经在完成区或工作台完成的工件数量。
  - `PipelineEntity` 中优先使用 `context.getCompletedIndex?.()`，没有提供时再回退到 `_completedIds.length`。
- 统计时要排除当前正在完成的工件，避免当前位置跳号：
  - 可按 `state === 'done'` 统计。
  - 或按 `location === 'done_area' || location === 'worktable_01' && state === 'done'` 统计。
- 工件完成后继续：
  - `setState('done')`
  - `setRemaining(0)`
  - `setLocation('done_area')`
  - `moveToPosition(getCompletedPosition(completedIndex))`

产出：

- 第一轮自动化完成 3 个工件后，占用完成区 0、1、2。
- 第二轮自动化新增工件完成后，从完成区 3、4、5 继续排列。
- 旧工件不被移动或删除。

### Step 4：修复手动下料位置占据下料装置

目标：

- 手动点击“下料”后，工件放到独立的手动下料/工作台展示区，不压住下料装置。

需要做的工作：

- 修改 `UnloadWorkpieceCommand._getWorktablePosition()`：
  - 不再直接使用 `PIPELINE_LAYOUT.worktablePoint`。
  - 改为调用 `getManualUnloadPosition(doneCount)`。
- `doneCount` 统计可以继续基于当前已手动下料完成的工件：
  - `location === LOGISTICS_LOCATIONS.worktable && state === 'done'`
- 手动下料完成后可以继续保持：
  - `target.setState('done')`
  - `target.setLocation(LOGISTICS_LOCATIONS.worktable)`
- 如果后续需要区分自动完成和手动完成，可在位置上区分即可，暂不新增状态。

产出：

- 手动下料工件沿 Y 轴偏移排列。
- 下料装置附近只显示设备和下料动作，不被完成工件长期占据。

### Step 5：检查物流快照和完成数量显示

目标：

- UI 显示的完成数量和实际场景中的完成工件一致。

需要做的工作：

- 检查 `createLogisticsSnapshot(...)` 的 `completedCount`：
  - 当前是否按 `workpiece.state === 'done'` 统计。
  - 确认自动化完成区和手动下料区都会被计入。
- 如果自动化完成和手动完成位置分区后，仍希望统一显示“已完成”，则不需要拆分字段。
- 如果希望更清晰，可后续扩展：
  - `automationCompletedCount`
  - `manualCompletedCount`
  本次不强制。

产出：

- 状态面板的“已完成”数量和场景中 done 工件数量一致。

### Step 6：补充边界保护

目标：

- 避免修复重叠时引入新的流程状态冲突。

需要做的工作：

- 自动化启动时，不移动已有 `done` 工件。
- 自动化 `resetWorkpieces(...)` 只重置本轮仓库等待工件，不清空场景中旧完成工件。
- 手动下料只处理 `arrived / conveyor_exit` 的工件。
- 自动化运行时 UI 已禁用手动下料，命令层如有必要可继续防御自动化运行中的手动操作。

产出：

- 多轮自动化和手动下料可以共存。
- 旧完成工件不会因为新一轮启动被重新排布或覆盖。

### Step 7：验证

目标：

- 验证两个整改点都能稳定复现并通过。

需要做的工作：

- 构建验证：
  ```bash
  npm run build
  ```
- 手动验证自动化完成区：
  - 点击“自动化流水线”，等待至少 3 个工件完成。
  - 再次点击“自动化流水线”或新增工件后再次启动。
  - 确认第二轮完成工件继续排列，不和第一轮完成工件重叠。
- 手动验证下料位置：
  - 创建传送带和上下料装置。
  - 创建工件并手动上料、启动传送带、到 B 点后点击下料。
  - 确认下料完成工件沿 Y 轴偏移，不压住下料装置。
- 状态验证：
  - “已完成”数量增加。
  - “下料装置”能恢复 `idle`。
  - 传送带出口释放后，阻塞状态能解除或继续推进。

产出：

- 两个视觉重叠问题被修复。
- 页面仍能完成手动流程和自动化流程。
- 无新增构建错误。

## 5. 验收标准

- [ ] 自动化流水线多次运行后，完成工件不与上一轮完成工件重叠。
- [ ] 点击自动化流水线后新增的工件，下料完成时能排到已有完成工件之后。
- [ ] 手动下料后的工件沿 Y 轴偏移，不占据下料装置显示位置。
- [ ] 自动化完成区和手动下料区位置计算来自统一布局 helper。
- [ ] 手动下料仍通过 `UnloadWorkpieceCommand` 触发，不在 Vue 中直接移动工件。
- [ ] 自动化下料仍通过 `PipelineEntity.tick(...)` 和自动化 tick 命令推进。
- [ ] 状态变化后视图刷新正常。
- [ ] `npm run build` 无本次新增错误。

## 6. 推荐实施顺序

1. 先在 `pipeline_layout.ts` 增加 `getManualUnloadPosition(index)` 等布局 helper。
2. 再修改 `UnloadWorkpieceCommand._getWorktablePosition()` 使用手动下料 helper。
3. 再扩展 `PipelineTickContext`，为自动化完成区提供全局 completed index。
4. 修改 `TickAutomationPipelineCommand` 传入全局完成数量。
5. 修改 `PipelineEntity._advanceWorktable(...)` 优先使用全局完成序号。
6. 最后验证页面手动下料和多轮自动化下料都不重叠。

## 7. 风险与注意事项

- 不要通过删除旧完成工件来规避重叠，需求是保留旧工件并继续排布。
- 不要把布局修复写死在 Vue 页面里，页面只负责触发命令和展示状态。
- 不要直接修改 Three.js 对象位置，应该继续调用工件实体的 `moveToPosition(...)`。
- 如果自动化流程复用 `PipelineEntity.resetWorkpieces(...)`，要确认它不会把旧完成工件纳入本轮队列。
- 手动下料位置偏移只解决视觉占位，不应改变下料装置自身的 `position` 或 `targetPoint`。

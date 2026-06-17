# PRD4：自动化持续运行与仓库底板常显整改方案

## 1. 背景

当前示例已经支持：

- 创建工件：`CreateSimpleWorkpieceCommand`
- 仓库排队位置：`getWarehousePosition(...)`
- 自动化流水线：`StartAutomationPipelineCommand`、`TickAutomationPipelineCommand`、`PipelineEntity.tick(...)`
- 仓库灰色底板显示：目前主要由 `PipelineDisplay` 绘制
- 示例页面：`examples/views/workpie_object.vue`

本次整改处理两个问题：

1. 如果仓库中仍有工件在排队，自动化流水线开启后不能提前进入 `completed` 并自动停止。
2. 创建工件时就需要出现灰色仓库底板，而不是只有启动自动化流水线后才出现。

说明：需求中的“弓箭”按上下文理解为“工件”。

## 2. 现状问题

### 2.1 自动化会提前完成

当前自动化流程的队列主要保存在 `PipelineEntity` 内部：

- `_workpieceIds`
- `_warehouseQueue`
- `_conveyorSlots`
- `_exitQueue`
- `_loaderTask`
- `_unloaderTask`
- `_worktableTask`
- `_completedIds`

启动自动化时，`StartAutomationPipelineCommand` 会读取当时在仓库中的 waiting 工件，并调用 `PipelineEntity.resetWorkpieces(workpieceIds)`。

问题在于：

- 如果自动化已经启动后又创建了新的仓库工件，这些新工件可能没有进入 `PipelineEntity._warehouseQueue`。
- `_finalizeStatus(...)` 只根据 Pipeline 内部队列判断是否完成。
- 因此场景中明明还有 `warehouse_01 + waiting` 工件，自动化仍可能把状态置为 `completed`。
- 页面检测到 `completed` 后会停止自动 tick，导致仓库中剩余工件不再被处理。

### 2.2 仓库底板依赖 PipelineDisplay

当前灰色仓库底板由 `PipelineDisplay` 绘制，例如：

```ts
root.add(this._createBox([-160, -340, 0], [190, 320, DEVICE_HEIGHT], 0x94a3b8, 0.22));
```

问题在于：

- 只有创建了 `PipelineEntity` 后才会创建 `PipelineDisplay`。
- 单独点击“创建工件”时，只创建了 `SimpleWorkpiece`，没有 Pipeline 实体。
- 所以创建工件后能看到工件排队，但看不到灰色仓库底板。

## 3. 设计目标

- 自动化运行时，只要文档里还有仓库等待工件，就不能自动完成或停止。
- 自动化运行过程中新增的仓库工件，也能进入等待队列并继续被上料。
- 自动化只在以下条件全部满足时进入 `completed`：
  - 仓库中没有 waiting 工件。
  - Pipeline 内部仓库队列为空。
  - 传送带上没有工件。
  - 出口没有等待下料工件。
  - 上料、下料、工作台都没有未完成任务。
- 仓库底板作为独立 WebCAD 对象存在，遵守 `Entity + Display` 结构。
- 创建工件和启动自动化两种入口，都能确保仓库底板存在。
- 不直接 `scene.add` 裸 Three.js 对象。
- 行为仍通过 Command 或 Command helper 触发。
- 状态变化后继续触发视图刷新。

## 4. 推荐设计

### 4.1 新增 WarehouseEntity

建议新增目录：

- `src/projects/template/model/warehouse/`
- `src/projects/template/display/warehouse/`

建议实体：

```ts
export interface WarehouseMeta {
    id: string;
    position: [number, number, number];
    size: [number, number, number];
    status: 'idle' | 'has_workpieces';
}
```

建议类名：

- `WarehouseEntity`
- `WarehouseDisplay`

职责：

- `WarehouseEntity` 保存仓库底板的业务信息。
- `WarehouseDisplay` 负责绘制灰色底板。
- 工件仍然是 `SimpleWorkpiece`，不归仓库 Display 直接管理。

### 4.2 抽出仓库布局常量

建议在 `pipeline_layout.ts` 中补充统一布局：

```ts
warehouseBasePoint: [-160, -340, 0],
warehouseBaseSize: [190, 320, 18],
```

后续 `WarehouseDisplay` 和工件排队位置都从同一个布局文件读取，避免硬编码散落在多个文件里。

### 4.3 新增 ensureWarehouseEntity helper

建议在 `pipeline_command_utils.ts` 中新增：

```ts
export function getOrCreateWarehouse(view: TempCanvas): WarehouseEntity
```

行为：

1. 查找文档中是否已有 `WarehouseEntity`。
2. 如果已有，返回已有实体。
3. 如果没有，创建 `WarehouseEntity` 并 `view.addModel(...)`。
4. 调用 `dirtyGeometry()`、`dirtyMaterial()`、`view.dirty()`。

调用入口：

- `CreateSimpleWorkpieceCommand`
- `StartAutomationPipelineCommand`
- 可选：`CreatePipelineDemoCommand`

这样无论用户先创建工件，还是先启动自动化，都能看到灰色仓库底板。

### 4.4 自动化队列需要持续同步仓库 waiting 工件

建议给 `PipelineEntity` 增加一个队列同步方法：

```ts
public syncWarehouseQueue(workpieceIds: number[]): void
```

行为：

1. 接收当前文档中所有 `warehouse_01 + waiting` 工件 id。
2. 过滤已经在 `_warehouseQueue`、`_conveyorSlots`、`_exitQueue`、`_completedIds`、任务中的 id。
3. 将未纳入 Pipeline 的 waiting 工件追加到 `_workpieceIds` 和 `_warehouseQueue`。
4. 保持已有队列顺序，不重置正在运行的任务。

建议调用位置：

- `StartAutomationPipelineCommand` 启动时同步一次。
- `TickAutomationPipelineCommand` 每次 tick 前同步一次。
- 或者在 `PipelineEntity.tick(...)` 开头通过 context 获取当前 waiting ids 后同步。

推荐最小改动：

- 在 `PipelineTickContext` 中增加可选方法：

```ts
getWarehouseWaitingIds?: () => number[];
```

- `TickAutomationPipelineCommand` 传入当前文档中的仓库 waiting 工件 ids。
- `PipelineEntity.tick(...)` 开头调用 `syncWarehouseQueue(...)`。

## 5. 分步实现计划

### Step 1：梳理自动化停止条件和仓库底板来源

目标：

- 明确自动化为什么会提前停止。
- 明确灰色仓库底板为什么只有自动化后才出现。

需要做的工作：

- 检查 `PipelineEntity._finalizeStatus(...)`。
- 检查 `PipelineEntity.resetWorkpieces(...)`。
- 检查 `StartAutomationPipelineCommand` 中工件队列初始化逻辑。
- 检查 `TickAutomationPipelineCommand` 中 tick context 的数据来源。
- 检查 `PipelineDisplay` 中仓库底板绘制代码。
- 检查 `CreateSimpleWorkpieceCommand` 创建工件时是否创建任何仓库显示实体。

产出：

- 确认自动化提前停止的根因是 Pipeline 内部队列没有持续同步文档中的仓库 waiting 工件。
- 确认灰色底板当前绑定在 `PipelineDisplay`，不是独立仓库对象。

### Step 2：新增仓库 Entity 和 Display

目标：

- 让仓库底板成为独立 WebCAD 实体，而不是 PipelineDisplay 的附属几何。

需要做的工作：

- 新增 `src/projects/template/model/warehouse/warehouse_entity.ts`。
- 新增 `src/projects/template/model/warehouse/index.ts`。
- 新增 `src/projects/template/display/warehouse/warehouse_display.ts`。
- 新增 `src/projects/template/display/warehouse/index.ts`。
- `WarehouseEntity` 保存：
  - `businessId`
  - `position`
  - `size`
  - `status`
- `WarehouseDisplay` 使用灰色半透明盒体绘制仓库底板。
- `WarehouseDisplay` 中统一管理 geometry/material 的释放。

产出：

- 仓库底板进入 WebCAD 实体体系。
- 后续创建工件时可以只创建一次仓库底板，并复用已有实体。

### Step 3：注册仓库模型和显示映射

目标：

- 让 `WarehouseEntity` 能被 Canvas 正常创建 Display。

需要做的工作：

- 在 `src/projects/template/view/temp_canvas.ts` 中注册：

```ts
this.registerDisplayType(WarehouseEntity, e => this.createDisplay(e, WarehouseDisplay));
```

- 在 `src/projects/template/model/index.ts` 或相关导出文件中导出仓库模型。
- 在 `src/projects/template/display/index.ts` 或相关导出文件中导出仓库显示。
- 在 `src/projects/template/index.ts` 中补充导出。

产出：

- `view.addModel(new WarehouseEntity(...))` 后，画布能显示灰色仓库底板。
- 后续 Command 不需要直接操作 Three.js。

### Step 4：抽出仓库底板布局常量

目标：

- 仓库底板位置、尺寸和工件排队位置使用同一套布局来源。

需要做的工作：

- 在 `pipeline_layout.ts` 中增加：
  - `warehouseBasePoint`
  - `warehouseBaseSize`
- `WarehouseEntity` 默认 meta 使用这些布局常量。
- `WarehouseDisplay` 不硬编码底板坐标。
- 可选：从 `PipelineDisplay` 中移除原来的仓库底板绘制，避免自动化启动后出现两层灰色底板。

产出：

- 仓库底板位置统一。
- 创建工件和自动化场景下看到的是同一个仓库底板对象。

### Step 5：新增 getOrCreateWarehouse helper

目标：

- 所有入口都通过统一方法确保仓库底板存在。

需要做的工作：

- 在 `pipeline_command_utils.ts` 中新增 `getOrCreateWarehouse(view)`。
- 查找已有 `WarehouseEntity`，存在则复用。
- 不存在则创建并加入文档：

```ts
const warehouse = new WarehouseEntity({
    id: 'warehouse_01',
    position: PIPELINE_LAYOUT.warehouseBasePoint,
    size: PIPELINE_LAYOUT.warehouseBaseSize,
    status: 'idle'
});
view.addModel(warehouse);
warehouse.dirtyGeometry();
warehouse.dirtyMaterial();
view.dirty();
```

产出：

- 创建仓库底板的逻辑集中在一处。
- 避免多个 Command 重复创建多个仓库底板。

### Step 6：创建工件时确保仓库底板存在

目标：

- 点击“创建工件”后，即使没有启动自动化，也能看到灰色仓库底板。

需要做的工作：

- 修改 `CreateSimpleWorkpieceCommand.commit()`。
- 创建工件前或创建工件后调用 `getOrCreateWarehouse(this._view)`。
- 保持工件仍通过 `SimpleWorkpieceFactory.create(...)` 创建。
- 工件仍放到 `getWarehousePosition(waitingIndex)`。
- 添加模型后继续调用：
  - `workpiece.dirtyGeometry()`
  - `this._view.dirty()`
  - 物流快照事件

产出：

- 单独创建工件即可显示仓库底板。
- 不需要启动自动化流水线。

### Step 7：启动自动化时也确保仓库底板存在

目标：

- 自动化入口也复用同一个仓库底板，不依赖 PipelineDisplay 画仓库。

需要做的工作：

- 修改 `StartAutomationPipelineCommand.commit()`。
- 在创建传送带、上下料装置、工件之前或之后调用 `getOrCreateWarehouse(this._view)`。
- 如果 `PipelineDisplay` 中已经移除仓库底板，则自动化场景仍能显示仓库。
- 如果暂时保留 `PipelineDisplay` 的底板，需要确认不会视觉叠加过深，推荐移除旧绘制。

产出：

- 手动创建工件和自动化启动都能看到同一个灰色仓库底板。
- 仓库底板不会重复创建。

### Step 8：扩展 PipelineTickContext，提供当前仓库等待工件

目标：

- 自动化每次 tick 都能知道文档里真实存在的仓库 waiting 工件。

需要做的工作：

- 修改 `pipeline_types.ts` 中的 `PipelineTickContext`。
- 增加可选方法：

```ts
getWarehouseWaitingIds?: () => number[];
```

- 修改 `TickAutomationPipelineCommand`。
- 在调用 `pipeline.tick(...)` 时传入：

```ts
getWarehouseWaitingIds: () => getWarehouseWorkpieces(this._view.app.doc.entityList).map(workpiece => workpiece.id)
```

产出：

- Pipeline 不再只依赖启动瞬间的工件列表。
- 自动化运行中新增的仓库工件可以被 Pipeline 感知。

### Step 9：给 PipelineEntity 增加仓库队列同步

目标：

- 将文档中的新增 waiting 工件追加到 Pipeline 内部队列，且不影响正在运行的工件。

需要做的工作：

- 在 `PipelineEntity` 中新增：

```ts
public syncWarehouseQueue(workpieceIds: number[]): void
```

- 内部去重时需要排除：
  - `_warehouseQueue`
  - `_conveyorSlots`
  - `_exitQueue`
  - `_completedIds`
  - `_loaderTask`
  - `_unloaderTask`
  - `_worktableTask`
- 对新增 id：
  - 追加到 `_workpieceIds`
  - 追加到 `_warehouseQueue`
- 调用 `_syncGeometryMeta()`。
- 调用 `dirtyGeometry()`、`dirtyMaterial()`、`dirty()`。

产出：

- 自动化运行中新增的工件能排入队列。
- 不会把正在传送、下料、加工或已完成的工件重复入队。

### Step 10：修改 PipelineEntity.tick 开头同步仓库队列

目标：

- 每次自动 tick 前先吸收新增仓库 waiting 工件，避免提前完成。

需要做的工作：

- 在 `PipelineEntity.tick(...)` 中，状态判断之后、推进流程之前调用：

```ts
const waitingIds = context.getWarehouseWaitingIds?.();
if (waitingIds) {
    this.syncWarehouseQueue(waitingIds);
}
```

- 如果当前状态是 `completed`，但又出现新的 waiting 工件，建议允许重新进入 `running`：
  - 可以在 `syncWarehouseQueue(...)` 中判断新增数量。
  - 如果有新增 waiting 工件且当前状态为 `completed`，将状态改为 `running`。

产出：

- 只要仓库还有 waiting 工件，自动化不会因为旧队列完成而停止。
- 新增工件会在后续 tick 中被上料。

### Step 11：调整完成判定

目标：

- 自动化只在真实没有待处理工件时完成。

需要做的工作：

- 修改 `_finalizeStatus(context)`。
- 完成条件除内部队列为空外，还要确认当前文档没有仓库 waiting 工件。
- 可通过 `context.getWarehouseWaitingIds?.()` 获取。
- 推荐完成条件：

```ts
const externalWaitingCount = context.getWarehouseWaitingIds?.().length ?? 0;
const isCompleted =
    externalWaitingCount === 0 &&
    this._warehouseQueue.length === 0 &&
    this._conveyorSlots.length === 0 &&
    this._exitQueue.length === 0 &&
    !this._loaderTask &&
    !this._unloaderTask &&
    !this._worktableTask;
```

- 不建议继续强依赖 `_completedIds.length === _workpieceIds.length`，因为 `_workpieceIds` 可能会动态追加。

产出：

- 仓库有等待工件时，状态不会进入 `completed`。
- 页面不会因为 `completed` 而停止自动 tick。

### Step 12：检查页面自动 tick 停止逻辑

目标：

- UI 只在真正完成或手动暂停时停止定时器。

需要做的工作：

- 检查 `examples/views/workpie_object.vue` 中：

```ts
if (lastSnapshot.value?.automationStatus === 'completed' || lastSnapshot.value?.automationStatus === 'paused') {
    stopAutomationTimer();
}
```

- 确认后端状态修复后，这段逻辑无需额外改动。
- 如果仍存在边界问题，可增加一层保护：
  - 当 `completed` 但 `warehouseWaiting > 0` 时，不停止 timer。
  - 更推荐把判断修在 Command / Entity 层，UI 不重复维护业务规则。

产出：

- UI 继续保持只负责触发命令和显示状态。
- 自动停止条件由业务实体保证。

### Step 13：补充中文注释

目标：

- 给关键业务点加少量中文注释，方便后续阅读。

需要做的工作：

- 在 `WarehouseEntity` 注释其职责：只表示仓库区域，不直接管理工件。
- 在 `getOrCreateWarehouse(...)` 注释：多入口复用，避免重复创建底板。
- 在 `syncWarehouseQueue(...)` 注释：自动化运行时吸收新创建的仓库 waiting 工件。
- 在 `_finalizeStatus(...)` 注释：完成判定必须同时看文档中的真实仓库等待数量。

产出：

- 代码意图清晰。
- 注释聚焦业务规则，不解释显而易见的语法。

### Step 14：验证

目标：

- 确认两个整改点都通过。

需要做的工作：

- 构建验证：

```bash
npm run build
```

- 手动验证仓库底板：
  1. 刷新页面。
  2. 不启动自动化。
  3. 点击“创建立方体”或“创建圆柱体”。
  4. 确认工件出现在仓库排队位置。
  5. 确认灰色仓库底板同时出现。

- 手动验证自动化持续运行：
  1. 启动自动化流水线。
  2. 在自动化运行中继续创建新工件。
  3. 确认新工件进入仓库排队。
  4. 确认旧工件完成后，自动化不会因为旧队列完成而停止。
  5. 确认新工件继续被上料、传送、下料。
  6. 确认只有所有仓库 waiting 工件、传送中工件、出口等待工件、工作台任务都完成后，状态才变为 `completed`。

产出：

- 单独创建工件时有灰色仓库底板。
- 自动化运行时新增仓库工件不会被遗漏。
- 自动化不会在仓库仍有 waiting 工件时停止。
- 构建无本次新增错误。

## 6. 验收标准

- [ ] 点击创建工件后，未启动自动化流水线也能看到灰色仓库底板。
- [ ] 灰色仓库底板通过 `WarehouseEntity + WarehouseDisplay` 显示，不直接 `scene.add`。
- [ ] 自动化启动时复用已有仓库底板，不重复创建多个底板。
- [ ] 自动化运行时，如果仓库中仍有 waiting 工件，状态不会进入 `completed`。
- [ ] 自动化运行过程中新增的仓库工件会进入 Pipeline 队列。
- [ ] 传送带入口被占用、上料装置忙或容量满时，新增工件继续在仓库排队。
- [ ] 所有工件处理完成后，自动化才进入 `completed` 并停止 tick。
- [ ] 页面状态中的仓库等待数量与场景中的 waiting 工件一致。
- [ ] 状态变化后视图刷新正常。
- [ ] `npm run build` 无本次新增错误。

## 7. 推荐实施顺序

1. 先新增 `WarehouseEntity` 和 `WarehouseDisplay`。
2. 注册仓库 Display 映射和统一导出。
3. 在 `pipeline_layout.ts` 中补充仓库底板布局常量。
4. 新增 `getOrCreateWarehouse(view)` helper。
5. 修改 `CreateSimpleWorkpieceCommand`，创建工件时确保仓库底板存在。
6. 修改 `StartAutomationPipelineCommand`，启动自动化时确保仓库底板存在。
7. 从 `PipelineDisplay` 中移除原仓库底板绘制，避免重复显示。
8. 扩展 `PipelineTickContext`，提供当前仓库 waiting 工件 ids。
9. 给 `PipelineEntity` 增加 `syncWarehouseQueue(...)`。
10. 在 `PipelineEntity.tick(...)` 开头同步新增仓库工件。
11. 修改 `_finalizeStatus(...)`，完成判定必须考虑真实仓库 waiting 数量。
12. 验证创建工件、自动化运行中新增工件、全部完成后三个场景。

## 8. 风险与注意事项

- 不要为了显示仓库底板直接在 Vue 或 Display 外部调用 `scene.add`。
- 不要每次创建工件都创建一个新的仓库底板，应复用同一个 `WarehouseEntity`。
- 不要在同步仓库队列时重置正在传送、下料或加工的工件。
- 不要把已完成的 `done` 工件重新加入仓库队列。
- 不建议让 UI 自己决定“仓库有工件所以不能 completed”，该规则应放在 `PipelineEntity` 或 Command 层。
- 如果保留 `PipelineDisplay` 原来的仓库底板，会和 `WarehouseDisplay` 叠加，建议迁移后移除旧绘制。

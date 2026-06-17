# PRD5：视图聚焦、手动工作台显示与工件线框联动高亮整改方案

## 1. 背景

当前示例已经支持工件、传送带、上下料装置、仓库底板、手动上下料和自动化流水线。现有实现中仍有三个体验问题需要整改：

1. 点击“创建上下料”时，视图需要自适应到上下料装置；点击“创建传送带”时，视图需要自适应到传送带装置。
2. 工作台目前只有自动流水线时出现，手动上下料流程也需要出现，可在点击“创建上下料”时出现。
3. 点击工件表面时，不止表面颜色需要变化，线框也要改变颜色；现在只有点到线框时，线框颜色才会改变。

所有整改仍遵守：

- 不直接 `scene.add` 裸 Three.js 对象。
- 新对象优先抽象为 `Entity + Display`。
- 行为通过 `Command` 或 Command helper 触发。
- 状态变化后能触发视图刷新。

## 2. 当前问题分析

### 2.1 创建命令 FitView 目标不明确

当前创建类命令容易使用全场景 `fitView()`。当场景里已有仓库底板、仓库工件或完成区工件时，全场景包围盒会把镜头拉向其它对象。

需要调整为：

- 创建传送带后，只聚焦传送带实体。
- 创建上下料后，只聚焦上料装置、下料装置和工作台。

### 2.2 工作台依赖 PipelineDisplay

当前工作台主要由 `PipelineDisplay` 绘制，因此只有创建自动化流水线或 `PipelineEntity` 后才出现。手动流程只创建工件、传送带、上下料装置时，没有独立工作台实体，所以看不到工作台。

需要将工作台拆成独立对象：

- `WorktableEntity`
- `WorktableDisplay`

并在“创建上下料”命令中创建或复用它。

### 2.3 工件表面选中时线框不联动

当前工件结构是：

```text
SimpleWorkpiece(Group)
  - BatchMesh  主体表面
  - BatchLine  特征线 / 线框
  - BatchPoint 特征点
```

现象：

- 点击表面时，只有表面 Display 进入选中态。
- 点击线框时，线框 Display 才进入选中态。
- 虽然 UI 可以通过 parent 找到同一个 `SimpleWorkpiece`，但视觉高亮没有同步到同一工件的线框。

需要让“选中工件任意部分”时，同一工件的线框也进入高亮态。

## 3. 设计目标

- 点击“创建传送带”后，视图自适应到传送带装置。
- 点击“创建上下料”后，视图自适应到上料装置、下料装置和工作台。
- 手动流程中，点击“创建上下料”即可看到上料装置、下料装置和工作台。
- 工作台通过 `WorktableEntity + WorktableDisplay` 显示。
- 自动流水线和手动流程复用同一个工作台对象，不重复显示两个工作台。
- 点击工件表面、线框或特征点时，都能识别为同一个工件被选中。
- 点击工件表面时，线框颜色也同步变化。
- 切换选择或清空选择时，旧工件线框恢复默认颜色。

## 4. 分步实现计划

### Step 1：梳理当前 FitView 调用点

目标：

- 明确创建传送带和创建上下料时，当前视图自适应在哪里触发。

需要做的工作：

- 搜索：

```bash
rg -n "fitView\\(|runInNewFrame|select\\(\\[" src/projects/template -S
```

- 重点检查：
  - `src/projects/template/command/cmd_create_conveyor.ts`
  - `src/projects/template/command/cmd_create_loading_devices.ts`
  - `src/projects/template/command/pipeline_command_utils.ts`

产出：

- 明确哪些地方仍在使用全场景 `fitView()`。
- 明确哪些地方已经可以复用按实体聚焦 helper。

### Step 2：实现或复用按实体聚焦 helper

目标：

- 将创建命令的视图聚焦统一为“按目标实体 id 聚焦”。

需要做的工作：

- 在 `pipeline_command_utils.ts` 中实现或确认已有：

```ts
export function focusEntitiesInNextFrame(view: TempCanvas, entityIds: number[]): void
```

- 推荐逻辑：

```ts
const ids = entityIds.filter(id => Number.isFinite(id));
if (ids.length === 0) return;

view.runInNewFrame(() => {
    view.select(ids);
    view.fitView(ids, [100, 100, 100, 100]);
});
```

产出：

- 后续命令不再直接做全场景 `fitView()`。
- 仓库工件不会影响本次创建对象的镜头聚焦。

### Step 3：修改创建传送带命令

目标：

- 点击“创建传送带”后，视图自适应到传送带装置。

需要做的工作：

- 修改 `CreateConveyorCommand`。
- 新建传送带后调用：

```ts
focusEntitiesInNextFrame(this._view, [conveyor.id]);
```

- 更新已有传送带后调用：

```ts
focusEntitiesInNextFrame(this._view, [existed.id]);
```

- 删除旧的全场景 `fitView()` 私有方法或旧逻辑。

产出：

- 创建或复用传送带后，镜头只聚焦传送带。
- 选中对象为传送带。

### Step 4：新增工作台布局常量

目标：

- 统一工作台位置和尺寸，避免硬编码分散。

需要做的工作：

- 在 `pipeline_layout.ts` 中确认已有：

```ts
worktablePoint: [960, 170, 70]
```

- 新增建议：

```ts
worktableSize: [150, 130, 18]
```

产出：

- `WorktableEntity`、`WorktableDisplay`、自动化下料位置都能复用同一套布局。

### Step 5：新增 WorktableEntity

目标：

- 让工作台成为独立 WebCAD 实体。

需要做的工作：

- 新增目录和文件：

```text
src/projects/template/model/worktable/worktable_entity.ts
src/projects/template/model/worktable/index.ts
```

- 定义：

```ts
export type WorktableStatus = 'idle' | 'busy';

export interface WorktableMeta {
    id: string;
    position: [number, number, number];
    size: [number, number, number];
    status?: WorktableStatus;
}
```

- `WorktableEntity` 建议提供：
  - `businessId`
  - `worktablePosition`
  - `size`
  - `status`
  - `setStatus(status)`
  - `setLayout(position, size)`

- 状态变化触发：
  - `dirtyMaterial()`
  - `dirty()`

- 布局变化触发：
  - `dirtyGeometry()`
  - `dirty()`

产出：

- 工作台进入 WebCAD 实体体系。
- 后续可以通过 `doc.entityList` 查询工作台。

### Step 6：新增 WorktableDisplay

目标：

- 让工作台在手动上下料流程中可见。

需要做的工作：

- 新增目录和文件：

```text
src/projects/template/display/worktable/worktable_display.ts
src/projects/template/display/worktable/index.ts
```

- 用简单半透明盒体绘制工作台。
- 根据 `status` 改变颜色：
  - `idle`：绿色或浅绿色。
  - `busy`：紫色或高亮色。
- 管理 `geometry/material` 的释放。
- 可选：实现 `createPickObject()`，允许选中工作台。

产出：

- 创建 `WorktableEntity` 后，画布能显示工作台。
- 工作台状态变化时颜色能刷新。

### Step 7：注册和导出工作台

目标：

- 打通 `WorktableEntity -> WorktableDisplay` 显示链路。

需要做的工作：

- 在 `temp_canvas.ts` 中注册：

```ts
this.registerDisplayType(WorktableEntity, e => this.createDisplay(e, WorktableDisplay));
```

- 补充导出：
  - `src/projects/template/model/worktable/index.ts`
  - `src/projects/template/display/worktable/index.ts`
  - `src/projects/template/index.ts`
  - `src/projects/template/display/index.ts`

产出：

- `view.addModel(worktable)` 后能正常显示。

### Step 8：新增 getOrCreateWorktable helper

目标：

- 手动流程和自动化流程复用同一个工作台，不重复创建。

需要做的工作：

- 在 `pipeline_command_utils.ts` 中新增：

```ts
export const DEFAULT_WORKTABLE_ID = 'worktable_01';

export function getOrCreateWorktable(view: TempCanvas): WorktableEntity
```

- 行为：
  1. 查找已有 `WorktableEntity`。
  2. 已存在则更新布局和状态后返回。
  3. 不存在则创建并 `view.addModel(worktable)`。
  4. 调用 `dirtyGeometry()`、`dirtyMaterial()`、`view.dirty()`。

产出：

- 创建上下料、自动化启动都可以复用工作台。

### Step 9：创建上下料时创建工作台并聚焦

目标：

- 点击“创建上下料”后，同时出现上料装置、下料装置和工作台，并视图自适应到它们。

需要做的工作：

- 修改 `CreateLoadingDevicesCommand`。
- 保留：

```ts
const conveyor = getOrCreateConveyor(this._view);
const devices = getOrCreateLoadingDevices(this._view, conveyor);
```

- 新增：

```ts
const worktable = getOrCreateWorktable(this._view);
```

- 聚焦：

```ts
focusEntitiesInNextFrame(this._view, [
    devices.loader.id,
    devices.unloader.id,
    worktable.id
]);
```

- 保留物流快照：

```ts
dispatchLogisticsSnapshot(this._view, conveyor);
```

产出：

- 手动流程中点击“创建上下料”即可看到工作台。
- 镜头聚焦上下料装置和工作台，不被仓库工件拉走。

### Step 10：自动化入口复用工作台

目标：

- 自动流水线与手动流程共用同一个工作台对象。

需要做的工作：

- 修改 `StartAutomationPipelineCommand`。
- 启动自动化时调用：

```ts
getOrCreateWorktable(this._view);
```

- 检查 `PipelineDisplay` 中是否仍绘制 `_worktableMesh`。
- 推荐在独立工作台落地后，从 `PipelineDisplay` 移除工作台绘制，避免两个工作台重叠。

产出：

- 自动化和手动流程不会显示两个工作台。

### Step 11：同步工作台状态

目标：

- 工作台颜色能反映忙/闲。

需要做的工作：

- 在 `pipeline_command_utils.ts` 中新增：

```ts
export function syncWorktableStatus(view: TempCanvas): void
```

- 内部基于现有逻辑：

```ts
getWorktableBusyWorkpiece(view.app.doc.entityList)
```

- 有忙碌工件则：

```ts
worktable.setStatus('busy');
```

- 否则：

```ts
worktable.setStatus('idle');
```

- 建议接入：
  - `CreateLoadingDevicesCommand`
  - `UnloadWorkpieceCommand`
  - `TickAutomationPipelineCommand`
  - `StartAutomationPipelineCommand`

产出：

- 手动下料和自动化加工时，工作台状态颜色能刷新。

### Step 12：梳理工件选择链路

目标：

- 明确点击表面时如何找到对应工件和线框。

需要做的工作：

- 检查：
  - `SimpleWorkpieceFactory`
  - `SimpleWorkpiece`
  - `TempCanvas._registerDisplay()`
  - `TempViewHandle.findSimpleWorkpieceByEntityIds(...)`
  - `signals_module/index.ts`

- 确认点击表面时，选择事件中收到的是：
  - `BatchMesh` id
  - 或父级 `SimpleWorkpiece` id
  - 或 Display 的 `entityId`

产出：

- 明确线框联动高亮应该在 Canvas 选择监听、ViewHandle、还是 `SimpleWorkpiece` 中处理。

### Step 13：为 SimpleWorkpiece 增加选择态

目标：

- 让工件拥有统一的业务选中状态。

需要做的工作：

- 在 `SimpleWorkpiece` 中增加：

```ts
private _selected = false;

public get selected(): boolean {
    return this._selected;
}

public setSelected(selected: boolean): void {
    if (this._selected === selected) return;
    this._selected = selected;
    this.dirtyMaterial();
    this.forEachChild(child => {
        child.dirtyMaterial();
        child.dirty();
    });
}
```

产出：

- 点击表面、线框或点后，都可以把父级工件设置为 selected。

### Step 14：让线框颜色响应工件 selected

目标：

- 点击工件表面时，线框颜色同步改变。

推荐方案 A：直接维护线框实体颜色。

需要做的工作：

- 在 `SimpleWorkpieceFactory` 中记录默认线框颜色，例如：

```ts
const DEFAULT_LINE_COLOR = 0x1f2937;
const SELECTED_LINE_COLOR = 0xff7a18;
```

- 新增方法或 helper：

```ts
syncWorkpieceLineHighlight(workpiece, selected)
```

- 找到工件子实体中的 `FSCore.Model.BatchLine`。
- 选中时设置为 `SELECTED_LINE_COLOR`。
- 取消选中时恢复 `DEFAULT_LINE_COLOR`。
- 调用：
  - `line.dirtyMaterial()`
  - 必要时 `line.dirtyGeometry()`

产出：

- 点击表面时，线框颜色同步变为选中态。
- 点击其它对象或空白时，旧工件线框恢复默认颜色。

### Step 15：在选择事件中同步工件高亮

目标：

- 将用户选择操作和工件线框高亮连接起来。

需要做的工作：

- 推荐在 `TempCanvas` 或 `TempViewHandle` 增加方法：

```ts
syncWorkpieceSelectionHighlight(selectedIds: number[]): void
```

- 步骤：
  1. 根据 `selectedIds` 向上查找父级 `SimpleWorkpiece`。
  2. 得到当前选中的工件 id 集合。
  3. 遍历所有 `SimpleWorkpiece`。
  4. 命中的工件 `setSelected(true)`，未命中的工件 `setSelected(false)`。

- 页面 `workpie_object.vue` 的 selection listener 中调用该方法，或在 Canvas 选择监听内部统一处理。

产出：

- 点击表面、线框、点时，都能让同一工件整体进入选中视觉状态。

## 5. 验证计划

### 5.1 构建验证

```bash
npm run build
```

目标：

- 无本次新增 TS 或构建错误。

### 5.2 视图聚焦验证

步骤：

1. 刷新页面。
2. 创建多个工件，让仓库中有明显队列。
3. 点击“创建传送带”。
4. 确认视图自适应到传送带。
5. 点击“创建上下料”。
6. 确认视图自适应到上料装置、下料装置和工作台。

### 5.3 手动工作台验证

步骤：

1. 不启动自动化流水线。
2. 点击“创建上下料”。
3. 确认工作台出现。
4. 创建工件、上料、启动传送带、到 B 点后下料。
5. 确认工作台在手动流程中可见，且不依赖自动化流水线。

### 5.4 工件线框联动验证

步骤：

1. 创建立方体或圆柱体。
2. 点击工件表面。
3. 确认表面颜色变化。
4. 确认线框颜色同步变化。
5. 点击线框。
6. 确认仍识别为同一个工件选中。
7. 点击空白或其它对象。
8. 确认旧工件线框恢复默认颜色。

## 6. 验收标准

- [ ] 点击“创建传送带”后，视图自适应到传送带装置。
- [ ] 点击“创建上下料”后，视图自适应到上料装置、下料装置和工作台。
- [ ] 创建上下料时，已有仓库工件不会把视图拉回仓库。
- [ ] 手动流程中点击“创建上下料”后，工作台会出现。
- [ ] 工作台通过 `WorktableEntity + WorktableDisplay` 显示。
- [ ] 自动化流程和手动流程复用同一个工作台，不重复显示两个工作台。
- [ ] 手动下料时工作台显示正常。
- [ ] 点击工件表面时，表面颜色变化，线框颜色也同步变化。
- [ ] 点击工件线框或点时，仍能识别为同一个工件选中。
- [ ] 切换选中对象或清空选择后，旧工件线框恢复默认颜色。
- [ ] 不直接 `scene.add` 裸 Three.js 对象。
- [ ] 状态变化后视图刷新正常。
- [ ] `npm run build` 无本次新增错误。

## 7. 推荐实施顺序

1. 先确认并复用 `focusEntitiesInNextFrame(...)`。
2. 修改 `CreateConveyorCommand` 聚焦传送带。
3. 新增 `worktableSize` 布局常量。
4. 新增 `WorktableEntity`。
5. 新增 `WorktableDisplay`。
6. 注册并导出工作台模型和显示。
7. 新增 `getOrCreateWorktable(...)` 和 `syncWorktableStatus(...)`。
8. 修改 `CreateLoadingDevicesCommand`：创建上下料时同时创建工作台并聚焦三者。
9. 修改自动化入口复用工作台，并移除或停用 `PipelineDisplay` 内的重复工作台绘制。
10. 梳理选择事件到 `SimpleWorkpiece` 的解析路径。
11. 增加工件 selected 状态。
12. 实现工件线框颜色随 selected 同步变化。
13. 接入选择事件，同步所有工件高亮状态。
14. 构建和手动验证。

## 8. 风险与注意事项

- 不要用全场景 `fitView()` 修复局部聚焦问题，否则仓库工件仍会影响镜头。
- 不要让 `PipelineDisplay` 和 `WorktableDisplay` 同时绘制同一个工作台。
- 不要在 Vue 页面中直接操作 Three.js 材质或相机。
- 不要为每次“创建上下料”重复创建多个工作台。
- 修改线框颜色时，必须处理取消选中后的颜色恢复。
- 如果修改 `BatchLine.color` 后显示不刷新，需要补 `dirtyMaterial()` 或 `dirtyGeometry()`。
- 如果底层 Display 的选中高亮和业务改色冲突，以最终视觉一致为准，必要时改为同步选择同一工件的多个子实体。

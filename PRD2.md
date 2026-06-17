# PRD2：上下料装置与自动化流水线整改方案

## 1. 背景

当前示例已经具备：

- 工件：`SimpleWorkpiece`、`SimpleWorkpieceFactory`、`CreateSimpleWorkpieceCommand`
- 传送带：`ConveyorEntity`、`ConveyorDisplay`、`CreateConveyorCommand`、`SetConveyorStatusCommand`
- 手动物流命令：`LoadWorkpieceCommand`、`TickConveyorWorkpiecesCommand`、`UnloadWorkpieceCommand`
- 状态快照：`createLogisticsSnapshot(...)`
- 示例页面：`examples/views/workpie_object.vue`
- 旧版自动流水线参考：`PipelineEntity`、`PipelineDisplay`、`TickPipelineCommand`

本次整改是在 PRD1 的“手动上料/传送/下料”基础上继续完善：

1. 增加可视化的上料装置和下料装置。
2. 调整工件尺寸与传送带承载高度，避免工件上料后穿透传送带。
3. 新增“自动化流水线”按钮，一键进入自动 tick 流程。
4. 自动流程仍然遵守 WebCAD 业务库规则：对象进入 Entity / Display / Document，行为通过 Command 触发，状态变化后刷新视图。

## 2. 设计边界

- 不直接 `scene.add` 裸 Three.js 对象。
- 新增上下料装置优先抽象为 `Entity + Display`。
- 自动化按钮只触发 Command 或 Handle 方法，不在 Vue 中直接改 Entity。
- 工件、传送带、上下料装置、流水线状态都应能通过实体或快照读取。
- 不修改 `cadnginx` / `fscadweb` 底座。
- 本任务只追求演示闭环，不追求真实工业节拍和碰撞精度。

## 3. 当前问题

### 3.1 缺少上下料装置实体

现在上料和下料只是命令动作，页面能看到工件移动，但场景中没有“上料装置”和“下料装置”的设备对象。

### 3.2 工件与传送带高度关系不合理

当前传送带厚度约为 `12`，皮带中心位于 `conveyor.startPoint.z`。工件默认尺寸较大：

- box 默认 `120 x 90 x 70`
- cylinder 默认半径 `45`、高度 `100`

如果上料时直接把工件中心放到传送带中心高度，工件会穿过传送带，需要统一承载高度。

### 3.3 自动流水线入口需要恢复

PRD1 移除了“一键创建流水线”。本次需求不是恢复旧的 demo 按钮，而是新增一个更合理的“自动化流水线”按钮：

- 复用已有工件、传送带、上下料装置。
- 按 tick 自动尝试上料、传送、下料。
- 不绕过 Entity / Command 体系。

## 4. 目标流程

自动化流水线按钮启动后，流程如下：

1. 仓库中有多个工件排队。
2. 如果传送带入口空闲，且上料装置空闲，则上料装置把一个工件放到传送带入口。
3. 如果传送带入口被占用，或上料装置忙，工件继续在仓库等待。
4. 传送带启动后，工件沿传送带从 A 移动到 B。
5. 工件到达传送带出口后，等待下料。
6. 如果工作台空闲，且下料装置空闲，则下料装置把工件从传送带出口拿下，放到工作台。
7. 如果工作台忙，工件停在传送带出口，传送带状态变为 `blocked`。
8. 如果传送带出口阻塞，后续工件不能继续前进，形成等待。

## 5. 推荐落点

### 5.1 新增设备实体

建议新增目录：

- `src/projects/template/model/loading_device/`
- `src/projects/template/display/loading_device/`

建议实体：

```ts
type LoadingDeviceKind = 'loader' | 'unloader';
type LoadingDeviceStatus = 'idle' | 'busy';

interface LoadingDeviceMeta {
    id: string;
    kind: LoadingDeviceKind;
    position: [number, number, number];
    targetPoint: [number, number, number];
    status: LoadingDeviceStatus;
}
```

实体建议命名：

- `LoadingDeviceEntity`

显示建议命名：

- `LoadingDeviceDisplay`

默认设备：

- 上料装置：`{ id: 'loader_01', kind: 'loader', position: [-80, 0, 70], targetPoint: conveyor.startPoint, status: 'idle' }`
- 下料装置：`{ id: 'unloader_01', kind: 'unloader', position: [880, 0, 70], targetPoint: conveyor.endPoint, status: 'idle' }`

### 5.2 统一物流布局

建议把传送带承载高度、工件尺寸、上下料点位统一到一个布局文件，避免各命令各算各的：

- 可继续放在 `pipeline_layout.ts`
- 或新增 `src/projects/template/model/logistics/logistics_layout.ts`

建议常量：

```ts
const WORKPIECE_SIZE = {
    box: { width: 60, height: 44, depth: 36 },
    cylinder: { radius: 24, height: 42 },
};

const CONVEYOR_BELT = {
    thickness: 12,
    topOffset: 6,
};

const WORKPIECE_ON_BELT_Z = conveyor.startPoint[2] + CONVEYOR_BELT.topOffset + WORKPIECE_SIZE.box.depth / 2;
```

注意：如果工件几何是以自身中心建模，放到传送带上时应移动“工件中心”，而不是移动底面点。

### 5.3 自动化流水线状态来源

建议优先复用当前已有 `PipelineEntity` 的思路，但要从“旧 demo 一键创建”调整成“自动运行控制器”：

- 工件状态仍存在 `SimpleWorkpiece`
- 传送带状态仍存在 `ConveyorEntity`
- 上下料装置状态存在 `LoadingDeviceEntity`
- 自动流程的队列、出口等待、工作台任务可以由 `PipelineEntity` 或轻量 `LogisticsAutomationEntity` 管理

如果希望最小改动：

- 继续复用 `PipelineEntity.tick(...)`
- 增加从“当前场景已有实体”初始化队列的方法
- 不再强依赖 `CreatePipelineDemoCommand` 自动创建所有对象

如果希望结构更清楚：

- 新增 `LogisticsAutomationEntity`
- 只负责自动流程状态，不负责创建工件和传送带

本 PRD 推荐先走最小改动：复用 `PipelineEntity` 的 tick 逻辑，补齐上下料设备状态和 UI 自动按钮。

## 6. 分步实现计划

### Step 1：梳理现有手动流程和布局基线

目标：

- 明确当前工件、传送带、物流快照和页面按钮的真实状态来源。

需要做的工作：

- 检查 `SimpleWorkpieceFactory` 的默认尺寸。
- 检查 `ConveyorDisplay` 的皮带厚度、中心高度和箭头高度。
- 检查 `LoadWorkpieceCommand` 上料后把工件移动到哪里。
- 检查 `TickConveyorWorkpiecesCommand` 是否直接使用 `conveyor.startPoint/endPoint`。
- 检查 `workpie_object.vue` 中自动 tick 定时器的清理逻辑。

产出：

- 明确“工件中心高度”和“传送带上表面高度”的计算方式。
- 明确自动化按钮可以复用哪些现有命令。

### Step 2：减小工件体积并统一承载高度

目标：

- 工件上料后看起来位于传送带上方，不再穿透皮带。

需要做的工作：

- 调整 `SimpleWorkpieceFactory` 默认尺寸：
  - box 建议改为 `60 x 44 x 36`
  - cylinder 建议改为 `radius = 24`、`height = 42`
- 新增或复用布局 helper：
  - `getWorkpieceOnBeltPosition(conveyor, progress, workpieceType)`
  - `getWorkpieceOnBeltZ(conveyor, workpieceType)`
- 修改上料和传送 tick：
  - 上料到 A 点时使用传送带上表面的工件中心点。
  - 沿 A -> B 移动时保持同一承载高度。
  - 到达 B 点后停在出口上方，而不是传送带中心线上。
- 修改仓库位置时可以保持工件在地面/展示高度，但要和上料轨迹衔接自然。

产出：

- 创建的工件体积更适合传送带宽度。
- 工件位于皮带上方，肉眼不再出现贯穿。
- 后续上下料装置和自动流程都复用同一套布局 helper。

### Step 3：新增上料装置和下料装置 Entity

目标：

- 场景中能看到独立的上料装置和下料装置，并能显示 `idle/busy` 状态。

需要做的工作：

- 新增 `LoadingDeviceEntity`。
- 元数据包含：
  - `id`
  - `kind`
  - `position`
  - `targetPoint`
  - `status`
- 提供方法：
  - `setStatus(status)`
  - `setTargetPoint(point)`
  - `setPosition(point)`
- 状态变化时调用：
  - `dirtyMaterial()`
  - `dirty()`

产出：

- 上料装置和下料装置进入 WebCAD 实体体系。
- 可通过 `doc.entityList` 查询。
- 可被后续命令修改状态。

### Step 4：新增上下料装置 Display

目标：

- 用简单几何可视化设备，不直接向 scene 塞 Three.js 对象。

需要做的工作：

- 新增 `LoadingDeviceDisplay`。
- 根据 `kind` 显示不同颜色或形态：
  - 上料装置：靠近 A 点，建议绿色/蓝色。
  - 下料装置：靠近 B 点，建议橙色/红色。
- 根据 `status` 改变材质：
  - `idle`：半透明或灰色。
  - `busy`：高亮。
- 可选：增加从设备指向目标点的短箭头或连线。
- 在 `TempCanvas` 中注册：
  - `registerDisplayType(LoadingDeviceEntity, LoadingDeviceDisplay)`
- 在 `display/index.ts`、`model/index.ts`、`src/projects/template/index.ts` 补导出。

产出：

- 创建设备后能显示。
- 状态变化后设备颜色能变化。
- Display 的几何、材质、动画资源能在 cleanup 时释放。

### Step 5：新增创建设备命令

目标：

- 通过 Command 创建或复用上下料装置。

需要做的工作：

- 新增命令：`CreateLoadingDevicesCommand`
- 命令行为：
  - 查找当前传送带。
  - 如果没有设备，则创建 `loader_01` 和 `unloader_01`。
  - 如果已有设备，则更新位置、目标点和状态。
  - 通过 `view.addModel(...)` 接入文档。
  - 调用 `dirtyGeometry()` / `view.dirty()`。
- 注册链补齐：
  - `cmd_types.ts`
  - `cmd_register.ts`
  - `temp_view_handle.ts`
  - `index.ts`

产出：

- 页面可以通过按钮或自动化初始化流程创建设备。
- 设备不会由 Vue 直接 new，也不会直接 `scene.add`。

### Step 6：改造手动上料和下料命令

目标：

- 手动流程也能体现上下料装置参与，而不是只有工件瞬移。

需要做的工作：

- `LoadWorkpieceCommand`：
  - 上料前检查 `loader_01.status === 'idle'`。
  - 上料开始时设置上料装置 `busy`。
  - 工件状态设置为 `loading`，位置从仓库移动/放到 A 点上方。
  - 上料结束后工件状态为 `moving`，设备恢复 `idle`。
- `UnloadWorkpieceCommand`：
  - 下料前检查 `unloader_01.status === 'idle'`。
  - 下料前检查工作台是否空闲。
  - 下料开始时设置下料装置 `busy`。
  - 工件状态设置为 `unloading`，位置移动到工作台。
  - 下料结束后设备恢复 `idle`，工件进入 `processing` 或 `done`。
- 如果暂不做动画，也要保留状态切换和快照刷新。

产出：

- 上料/下料按钮会影响设备状态。
- 物流状态面板能看到上下料装置忙/闲。
- 手动流程与自动流程共用同一套状态规则。

### Step 7：扩展物流快照

目标：

- 页面能够展示自动流程所需的关键状态。

需要做的工作：

- 扩展 `LogisticsSnapshot`：
  - `loaderStatus`
  - `unloaderStatus`
  - `worktableStatus`
  - `automationStatus`
  - `completedCount`
- 扩展阻塞原因：
  - `loader_busy`
  - `unloader_busy`
  - `worktable_busy`
  - `conveyor_entry_occupied`
  - `conveyor_exit_occupied`
  - `conveyor_full`
- `createLogisticsSnapshot(...)` 从实体列表中读取：
  - 工件队列
  - 传送带状态
  - 上下料装置状态
  - 出口等待
  - 工作台占用

产出：

- UI 不维护自己的队列。
- 面板能显示当前时间、仓库等待、传送中、出口等待、上下料装置状态、阻塞原因。

### Step 8：新增自动化流水线启动/停止命令

目标：

- 页面点击“自动化流水线”后，自动按 tick 推进完整流程。

需要做的工作：

- 新增命令：
  - `StartAutomationPipelineCommand`
  - 可选：`StopAutomationPipelineCommand`
- 启动命令负责：
  - 确保传送带存在。
  - 确保上下料装置存在。
  - 确保仓库中至少有 3 个工件；不足时可提示或自动补足，建议本阶段自动补足演示工件。
  - 初始化或复用 `PipelineEntity` / `LogisticsAutomationEntity`。
  - 设置传送带为 `running`。
  - 发出状态快照事件。
- 停止命令负责：
  - 设置自动化状态为 `paused/stopped`。
  - 设置传送带为 `stopped`。
  - 不删除已有工件和设备。

产出：

- 自动化流程入口通过 Command 触发。
- 可以启动和停止。
- 不破坏手动流程已有实体。

### Step 9：实现自动化 tick

目标：

- 自动流程按固定 tick 推进，不瞬间完成。

需要做的工作：

- 方案 A：复用 `PipelineEntity.tick(...)`
  - 修改 tick 逻辑，使其读取/更新 `LoadingDeviceEntity` 状态。
  - 修改上料/传送/下料位置，使用新的承载高度 helper。
  - 支持从当前仓库 waiting 工件初始化队列。
- 方案 B：新增 `TickAutomationPipelineCommand`
  - 直接组合现有手动命令的规则。
  - 每次 tick 尝试：
    - 推进上料装置任务。
    - 推进传送带工件。
    - 推进下料装置任务。
    - 推进工作台加工任务。
- 推荐先选方案 A，复用已有 `PipelineEntity` 的队列、出口、工作台任务结构。

产出：

- 自动化启动后，工件依次从仓库进入传送带。
- 传送带容量限制生效。
- B 点阻塞时后续工件等待。
- 工作台忙时传送带能进入 `blocked`。

### Step 10：改造页面 UI

目标：

- 页面同时支持手动流程和自动化流程。

需要做的工作：

- 新增按钮：
  - `创建上下料装置`
  - `自动化流水线`
  - 可选：`暂停自动化`
- 保留按钮：
  - 创建工件
  - 创建传送带
  - 启动/停止传送带
  - 上料
  - 下料
  - 单步 Tick
- 页面定时器：
  - 自动化启动后开启 interval。
  - 每次 interval 调用自动化 tick 命令。
  - `onUnmounted` 中必须清理 interval 和事件监听。
- 面板显示：
  - 当前时间
  - 自动化状态
  - 仓库等待数量
  - 传送中数量
  - 出口等待数量
  - 上料装置状态
  - 下料装置状态
  - 工作台状态
  - 阻塞原因

产出：

- 用户可以手动操作，也可以一键启动自动流程。
- 自动化按钮不是旧的“一键瞬间生成结果”，而是持续 tick 推进。

### Step 11：补齐注册链和导出链

目标：

- 新增能力能被当前 WebCAD view 正常发现、执行和显示。

需要做的工作：

- `cmd_types.ts`
  - `CREATE_LOADING_DEVICES`
  - `START_AUTOMATION_PIPELINE`
  - `STOP_AUTOMATION_PIPELINE`
  - `TICK_AUTOMATION_PIPELINE`
- `cmd_register.ts`
  - 注册新增命令。
- `temp_canvas.ts`
  - 注册 `LoadingDeviceEntity -> LoadingDeviceDisplay`。
- `temp_view_handle.ts`
  - 暴露 `createLoadingDevices(...)`
  - 暴露 `startAutomationPipeline(...)`
  - 暴露 `stopAutomationPipeline(...)`
  - 暴露 `tickAutomationPipeline(...)`
- `index.ts`
  - 导出新增 entity、display、command 参数、事件类型。

产出：

- UI 只调用 handle。
- 命令进入 `CommandManager`。
- 设备进入 `Document` 后能创建 Display。

### Step 12：验证和验收

目标：

- 确认整改没有破坏 PRD1 手动链路，并新增自动化闭环。

需要做的工作：

- 构建验证：

```bash
npm run build
```

- 手动验证：
  - 创建 3 个工件，确认体积变小。
  - 创建传送带，确认工件上料后在传送带上方。
  - 创建上下料装置，确认能显示。
  - 点击上料/下料，确认设备状态变化。
- 自动验证：
  - 点击自动化流水线。
  - 确认工件按 tick 依次上料。
  - 确认工件沿 A -> B 移动。
  - 确认到 B 点后等待下料。
  - 确认工作台忙时出口阻塞。
  - 确认传送带状态能变为 `blocked`。
  - 确认后续工件不会穿过出口等待工件。

产出：

- 构建无新增错误。
- 页面演示能完成一轮自动流水线。
- 状态面板与场景显示一致。

## 7. 验收标准

- [ ] 场景中能看到上料装置和下料装置。
- [ ] 上下料装置进入 WebCAD Entity / Display / Document 体系。
- [ ] 上下料装置状态至少支持 `idle` 和 `busy`。
- [ ] 工件体积明显小于传送带宽度。
- [ ] 工件上料后位于传送带上方，不再贯穿皮带。
- [ ] 页面存在“自动化流水线”按钮。
- [ ] 点击自动化按钮后，至少 3 个工件从仓库队列开始自动流转。
- [ ] 传送带入口被占用时，仓库工件继续等待。
- [ ] 上料装置忙时，不会启动新的上料任务。
- [ ] 工件沿传送带从 A 点移动到 B 点，不是瞬间完成。
- [ ] 工件到达 B 点后进入 `arrived` / `conveyor_exit`。
- [ ] 下料装置空闲且工作台空闲时，工件能被移动到工作台。
- [ ] 工作台忙时，B 点工件等待，传送带可显示 `blocked`。
- [ ] 出口阻塞时，后续工件不能继续穿过前方工件。
- [ ] 页面能显示当前时间、仓库等待数量、传送中数量、出口等待数量、上下料装置状态、阻塞原因。
- [ ] 自动化流程按 tick 推进，不是一次按钮瞬间完成。
- [ ] 所有动作通过 Command / Handle 触发，Vue 不直接改 Entity 或 Three.js。
- [ ] 状态变化后视图刷新。

## 8. 风险与注意事项

### 8.1 坐标重复计算风险

工件在仓库、传送带、B 点、工作台之间移动时，不要在多个命令里各自硬编码 Z 值。应统一使用布局 helper。

### 8.2 自动流程与手动流程状态冲突

自动化运行时，如果用户继续点击手动上料/下料，可能造成队列重复操作。建议自动化运行时禁用手动按钮，或在命令中检查自动化状态。

### 8.3 view 复用与定时器清理风险

`CadApp.addView(...)` 会复用同 tag 的 view。页面中的自动化 interval、selection listener、command listener 必须在 `onUnmounted` 中清理。

### 8.4 设备 Display 资源释放风险

`LoadingDeviceDisplay` 如果创建了 Three geometry、material、动画帧，需要在 `onCleanup()` 中释放，避免 view 复用后残留。

### 8.5 旧 PipelineEntity 语义风险

如果继续复用 `PipelineEntity`，要避免它仍然承担“创建完整 demo”的职责。自动化按钮应创建或复用当前场景中的对象，而不是重建一套和用户已有对象脱节的对象。

## 9. 推荐实施顺序

1. 减小工件尺寸，统一传送带承载高度。
2. 新增上下料装置 Entity / Display。
3. 新增创建设备命令，并接注册链。
4. 改造手动上料/下料命令，让设备状态参与流程。
5. 扩展物流快照，显示上下料状态和阻塞原因。
6. 新增自动化启动/停止/tick 命令。
7. 复用或改造 `PipelineEntity`，实现仓库 -> 上料 -> 传送 -> 下料 -> 工作台的自动 tick。
8. 改造 `workpie_object.vue`，新增“自动化流水线”按钮和状态面板。
9. 补齐导出链。
10. 执行构建和页面冒烟验证。


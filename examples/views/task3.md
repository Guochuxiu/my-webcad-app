# 任务 3：创建固定方向运动的传送带

## Task Routing

- task_type: `solution-write`
- evidence: 本任务要求把“固定方向运动的传送带”拆成可实现步骤，并写入方案文档，不是立即落代码。
- kb_root: `.ai-workflow/knowledge/webcad/`
- source_roots:
  - `src/projects/template/`
  - `src/common/`
  - `examples/views/workpie_object.vue`
- expected_output: 分步实现计划，每一步都有目标、工作内容、验收点和对应代码锚点。

## 任务目标

实现一个设备类实体 `ConveyorEntity`，表示一条固定从 A 点运动到 B 点的传送带：

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

本任务重点是熟悉设备类 `Entity / Display` 和设备自身状态，不要求真正带动工件。

## 当前已有基础

任务 1 和任务 2 已经建立了业务库的基本扩展链路：

```text
workpie_object.vue
  -> TempViewHandle
  -> Command
  -> Entity / Factory
  -> TempCanvas.registerDisplayType(...)
  -> WebCAD Display 系统显示
```

传送带任务继续复用这条链路：

```text
workpie_object.vue
  -> TempViewHandle.createConveyor(...)
  -> CreateConveyorCommand
  -> ConveyorFactory.create(...)
  -> ConveyorEntity
      -> ConveyorDisplay
  -> TempCanvas.registerDisplayType(ConveyorEntity, ConveyorDisplay)
```

注意：仍然不要直接 `scene.add` 裸 Three.js 对象。传送带必须作为 WebCAD Entity 进入模型层，再由 Display 负责显示。

## Edit Plan

- anchor_files:
  - `src/projects/template/model/workpiece/simple_workpiece.ts`
  - `src/projects/template/model/workpiece/simple_workpiece_factory.ts`
  - `src/projects/template/command/cmd_create_simple_workpiece.ts`
  - `src/projects/template/command/cmd_register.ts`
  - `src/projects/template/command/cmd_types.ts`
  - `src/projects/template/view/temp_canvas.ts`
  - `src/projects/template/view/temp_view_handle.ts`
  - `examples/views/workpie_object.vue`
- reuse_pattern: 复用当前仓库已验证的 `CmdBase -> registerCmds -> TempCanvas._registerDisplay/_registerCommands -> BaseViewHandle.executeCommand` 链路。
- extension_point: `Entity` / `Display` / `Command` / `Canvas` / `Handle` / example UI。
- registration_path: UI 按钮调用 `TempViewHandle`，handle 执行命令，命令创建 `ConveyorEntity` 并 `addModel`，Canvas 根据 `registerDisplayType` 创建 `ConveyorDisplay`。
- runtime_risks: display 注册遗漏、状态变更不 dirty、动画帧清理、view 复用后重复动画、pick/selection 暂不做强验收。

## 推荐实现顺序

### 第 1 步：定义传送带数据模型

目标：先把传送带建成设备类业务实体，而不是先画几何。

建议新增：

```text
src/projects/template/model/conveyor/conveyor_entity.ts
src/projects/template/model/conveyor/index.ts
```

建议类型：

```ts
export type ConveyorStatus = 'idle' | 'running' | 'stopped';

export interface ConveyorMeta {
    id: string;
    startPoint: [number, number, number];
    endPoint: [number, number, number];
    speed: number;
    capacity: number;
    status?: ConveyorStatus;
}
```

建议实体：

```ts
export class ConveyorEntity extends FSCore.Model.CADEntity<ConveyorMeta> {
    // 保存 id、startPoint、endPoint、speed、capacity、status
}
```

如果当前类型继承 `CADEntity<Meta>` 不方便，也可以继承 `FSCore.Model.Group`，把传送带本体和方向提示作为子实体承载。实现前以当前 TypeScript 类型能通过为准。

要做的工作：

1. 保存 `id / startPoint / endPoint / speed / capacity / status`。
2. 增加方向计算：

```ts
public get direction(): [number, number, number]
```

方向由 `endPoint - startPoint` 归一化得到。

3. 增加状态方法：

```ts
public start(): void;
public stop(): void;
public setStatus(status: ConveyorStatus): void;
```

4. 状态变化触发 `dirtyMaterial()` 或 `dirty()`。
5. 起点/终点/speed/capacity 变化触发合适 dirty：
   - 几何路径变了：`dirtyGeometry()`
   - 状态颜色变了：`dirtyMaterial()`

产出：

- `ConveyorEntity` 能表达设备数据和运行状态。
- 能计算固定方向。
- 能 start / stop。

验收点：

- 不把运行状态放在 Vue 层临时变量里。
- 不把 Three.js Mesh 当成数据模型。
- `status` 默认是 `idle`。

### 第 2 步：实现传送带显示 Display

目标：让传送带可见，并能看到起点、终点和方向。

建议新增：

```text
src/projects/template/display/conveyor/conveyor_display.ts
src/projects/template/display/conveyor/index.ts
```

推荐显示内容：

```text
ConveyorDisplay
├─ beltBody：一条从 startPoint 到 endPoint 的长条或线段
├─ startMarker：起点标记
├─ endMarker：终点标记
└─ directionArrow：方向箭头或流动提示
```

第一版可以用简单 Three.js 对象，但必须由 `ConveyorDisplay._createViewObj()` 返回，不能在外部 `scene.add`：

```ts
export class ConveyorDisplay extends FSApp.View.Three.ThreeDisplay<ConveyorEntity> {
    protected _createViewObj(): THREE.Object3D {
        const root = new THREE.Group();
        // 创建本体、端点、箭头，加入 root
        return root;
    }
}
```

要做的工作：

1. 根据 `startPoint/endPoint` 创建传送带主体：
   - 最小实现：一条粗线或长方体。
   - 可视化更清楚：用矩形带状 mesh。
2. 起点 A 和终点 B 分别用不同颜色小球或小方块标记。
3. 方向提示用箭头：
   - 最小实现：沿方向放 2 到 3 个小箭头。
   - 运行时增强：`running` 状态下让箭头颜色变亮或沿方向流动。
4. `status === 'idle' / 'stopped'` 时显示灰色或低亮度。
5. `status === 'running'` 时显示绿色或蓝色高亮。
6. 在 `onCleanup()` 释放手工创建的 geometry/material。

产出：

- `ConveyorDisplay` 能把设备显示出来。
- 起点、终点、方向可见。
- 状态变化后外观能刷新。

验收点：

- Display 由 Entity 驱动。
- 不在 Entity 中创建或持有渲染资源。
- 手工创建的材质和几何在 cleanup 里释放。

### 第 3 步：实现方向提示动画

目标：运行时有可见方向提示，例如箭头流动或颜色变化。

推荐先做最小动画：

- `running`：箭头颜色高亮，并用 `requestAnimationFrame` 改变箭头沿方向的位置或透明度。
- `idle/stopped`：停止动画，箭头回到静态状态。

实现位置：

```text
src/projects/template/display/conveyor/conveyor_display.ts
```

要做的工作：

1. Display 内保存动画帧 id：

```ts
private _frameId: number | null = null;
```

2. 在 `_onMaterialDirty()` 或自定义刷新方法中根据 `entity.status` 启停动画。
3. 每帧只更新 Display 自己创建的方向提示对象，不改业务 Entity 数据。
4. `onCleanup()` 中取消 RAF。

说明：

- 这里动画只是设备运行提示，不是业务状态推进。
- 业务状态仍由 `ConveyorEntity.status` 控制。
- 如果实现中发现 Display 内 RAF 和底座 render loop 生命周期不好收口，可以降级为颜色变化：`running` 高亮，`idle/stopped` 灰色。本任务验收允许“箭头流动或颜色变化”。

产出：

- `running` 时能看出方向提示在变化。
- `stop` 后方向提示停止或变灰。

验收点：

- 不创建全局动画定时器。
- view dispose / clear 后不继续跑 RAF。
- 状态变化后调用 dirty 触发 Display 更新。

### 第 4 步：实现创建传送带命令

目标：通过 Command 创建传送带，而不是页面直接 new entity。

建议新增：

```text
src/projects/template/command/cmd_create_conveyor.ts
```

建议参数：

```ts
export interface CreateConveyorParams {
    id?: string;
    startPoint?: [number, number, number];
    endPoint?: [number, number, number];
    speed?: number;
    capacity?: number;
}
```

命令逻辑：

```text
CreateConveyorCommand.commit()
1. 组装默认参数：
   id = 'conveyor_01'
   startPoint = [0, 0, 0]
   endPoint = [800, 0, 0]
   speed = 100
   capacity = 2
   status = 'idle'
2. 创建 ConveyorEntity
3. this._view.addModel(conveyor)
4. conveyor.dirtyGeometry()
5. this._view.dirty()
6. fitView 可选
7. super.commit()
```

产出：

- 能通过命令创建一条默认传送带。

验收点：

- 不直接 `scene.add`。
- 传送带进入 WebCAD 实体体系。
- 参数缺失时使用默认值。

### 第 5 步：实现启动和停止命令

目标：通过命令切换设备运行状态。

建议新增：

```text
src/projects/template/command/cmd_set_conveyor_status.ts
```

建议参数：

```ts
export interface SetConveyorStatusParams {
    conveyorId: number;
    status: 'idle' | 'running' | 'stopped';
}
```

命令逻辑：

```text
SetConveyorStatusCommand.commit()
1. 根据 conveyorId 从 app.doc 找 entity
2. 判断 entity instanceof ConveyorEntity
3. conveyor.setStatus(params.status)
4. conveyor.dirtyMaterial()
5. view.dirty()
6. super.commit()
```

也可以把命令拆成两个更直观的命令：

```text
StartConveyorCommand
StopConveyorCommand
```

但第一版推荐用一个 `SetConveyorStatusCommand`，减少注册点数量。

产出：

- 能启动传送带：`idle/stopped -> running`
- 能停止传送带：`running -> stopped`

验收点：

- UI 不直接改 `conveyor.status`。
- 状态变化后 Display 能刷新颜色或动画。

### 第 6 步：补命令类型和注册链

目标：让创建、启动、停止命令能被 `CommandManager` 找到。

需要修改：

```text
src/projects/template/command/cmd_types.ts
src/projects/template/command/cmd_register.ts
```

在 `cmd_types.ts` 增加：

```ts
CREATE_CONVEYOR = 'create_conveyor',
SET_CONVEYOR_STATUS = 'set_conveyor_status'
```

在 `cmd_register.ts` 增加：

```ts
[CMD_TYPES.CREATE_CONVEYOR]: CreateConveyorCommand,
[CMD_TYPES.SET_CONVEYOR_STATUS]: SetConveyorStatusCommand
```

产出：

- 新命令进入统一命令注册表。
- `TempCanvas._registerCommands()` 自动注册新命令。

验收点：

- 不直接 `new CreateConveyorCommand()`。
- 不绕过 `TempViewHandle.executeCommand(...)`。

### 第 7 步：补 Display 注册链

目标：让 `ConveyorEntity` 能创建对应 Display。

需要修改：

```text
src/projects/template/view/temp_canvas.ts
```

在 `_registerDisplay()` 中增加：

```ts
this.registerDisplayType(ConveyorEntity, e => this.createDisplay(e, ConveyorDisplay));
```

如果 `ConveyorDisplay` 内部使用底座 `BatchMesh/BatchLine/BatchPoint` 子实体方案，则也要确认对应 batch display 已注册。当前任务 1 已经在 `TempCanvas` 注册了这些 batch display，可以复用。

产出：

- `ConveyorEntity -> ConveyorDisplay` 映射闭合。

验收点：

- 创建传送带后能显示。
- 不依赖父类 display 兜底。

### 第 8 步：补 Handle API

目标：给示例页一个稳定调用入口。

需要修改：

```text
src/projects/template/view/temp_view_handle.ts
```

建议新增：

```ts
public createConveyor(params?: CreateConveyorParams): Promise<void> {
    return this.executeCommand(CMD_TYPES.CREATE_CONVEYOR, params);
}

public setConveyorStatus(params: SetConveyorStatusParams): Promise<void> {
    return this.executeCommand(CMD_TYPES.SET_CONVEYOR_STATUS, params);
}
```

可选增加查询 helper：

```ts
public findConveyorByEntityIds(ids: number[]): ConveyorEntity | null
public findFirstConveyor(): ConveyorEntity | null
```

产出：

- UI 不需要接触 canvas、doc 或 command manager 内部。
- 示例页能创建、启动、停止传送带。

验收点：

- UI 只通过 handle 调命令。
- 选择/查询逻辑集中在 handle。

### 第 9 步：补示例页入口

目标：交付一个能演示的小功能。

建议复用现有示例页：

```text
examples/views/workpie_object.vue
```

或者新建：

```text
examples/views/conveyor_object.vue
```

第一版建议复用 `workpie_object.vue`，因为任务 3 暂不要求带动工件，只要在同一个 WebCAD 画布里演示设备。

建议 UI：

```html
<button type="button" @click="createConveyor">创建传送带</button>
<button type="button" :disabled="!selectedConveyor" @click="startConveyor">启动传送带</button>
<button type="button" :disabled="!selectedConveyor" @click="stopConveyor">停止传送带</button>
```

信息面板显示：

```text
id
startPoint
endPoint
direction
speed
capacity
status
```

如果暂不做选择传送带，也可以保存 `createdConveyorId`：

```ts
const activeConveyor = ref<ConveyorEntity | null>(null);
```

创建命令结束后通过 handle 查询第一条传送带，并显示数据。

产出：

- 页面按钮能创建、启动、停止传送带。
- 页面能看到 speed、capacity、status。

验收点：

- 运行状态改变后画面有变化。
- 页面显示的数据来自 `ConveyorEntity`，不是另维护一份假数据。

### 第 10 步：补导出

目标：让示例页能从模板项目入口导入传送带类型和命令参数。

需要修改：

```text
src/projects/template/index.ts
```

增加：

```ts
export * from './model/conveyor';
export * from './command/cmd_create_conveyor';
export * from './command/cmd_set_conveyor_status';
```

如果新增了 display 目录，一般不必对外导出 display，除非示例页或外部库需要直接引用。

产出：

- 示例页 import 路径简洁。

验收点：

- 不从深层内部路径到处乱引。

### 第 11 步：最小验证

目标：实现后能证明任务 3 的验收项成立。

手动验证：

1. 打开示例页。
2. 点击“创建传送带”。
3. 看到一条从 `[0, 0, 0]` 到 `[800, 0, 0]` 的传送带。
4. 页面显示：
   - `id = conveyor_01`
   - `speed = 100`
   - `capacity = 2`
   - `status = idle`
   - `direction = [1, 0, 0]`
5. 点击“启动传送带”。
6. `status` 变为 `running`。
7. 画面出现方向提示变化：箭头流动或颜色高亮。
8. 点击“停止传送带”。
9. `status` 变为 `stopped`。
10. 方向提示停止或变灰。

命令行验证：

```bash
npm run build
```

如果全量 build 仍输出 examples 旧文件类型问题，可以过滤任务 3 相关文件：

```bash
npx vue-tsc --noEmit --pretty false 2>&1 | Select-String -Pattern "conveyor|cmd_create_conveyor|cmd_set_conveyor_status|temp_canvas|temp_view_handle|workpie_object"
```

## 推荐最终文件改动清单

```text
src/projects/template/model/conveyor/conveyor_entity.ts
  - 新增 ConveyorEntity
  - 保存 startPoint / endPoint / speed / capacity / status
  - 提供 direction / start / stop / setStatus
  - 状态变化触发 dirty

src/projects/template/model/conveyor/index.ts
  - 导出 ConveyorEntity 相关类型

src/projects/template/display/conveyor/conveyor_display.ts
  - 新增 ConveyorDisplay
  - 绘制传送带本体、起点、终点、方向箭头
  - running 状态下高亮或流动
  - cleanup 释放 geometry/material/RAF

src/projects/template/display/conveyor/index.ts
  - 导出 ConveyorDisplay

src/projects/template/command/cmd_create_conveyor.ts
  - 新增 CreateConveyorCommand
  - 创建默认传送带并 addModel

src/projects/template/command/cmd_set_conveyor_status.ts
  - 新增 SetConveyorStatusCommand
  - 根据 id 找 ConveyorEntity 并切换 status

src/projects/template/command/cmd_types.ts
  - 新增 CREATE_CONVEYOR
  - 新增 SET_CONVEYOR_STATUS

src/projects/template/command/cmd_register.ts
  - 注册 CreateConveyorCommand
  - 注册 SetConveyorStatusCommand

src/projects/template/view/temp_canvas.ts
  - 注册 ConveyorEntity -> ConveyorDisplay

src/projects/template/view/temp_view_handle.ts
  - 新增 createConveyor(...)
  - 新增 setConveyorStatus(...)
  - 可选新增 findConveyorByEntityIds(...)

src/projects/template/index.ts
  - 导出 conveyor model 和 command 参数

examples/views/workpie_object.vue
  - 增加创建/启动/停止按钮
  - 增加传送带信息面板
```

## 任务 3 的最小完成定义

最小完成版本只需要做到：

- 能通过命令创建 `ConveyorEntity`。
- 传送带显示起点、终点和方向。
- `ConveyorEntity` 持有 `speed / capacity / status`。
- 能通过命令启动和停止。
- `running` 状态有可见方向提示，颜色变化也可以。
- 状态变化后能触发视图刷新。
- 不直接 `scene.add`，不绕过 `CommandManager`，不把状态只存在 Vue 页面里。

暂不要求：

- 不要求带动工件。
- 不要求真实物流节拍。
- 不要求碰撞检测。
- 不要求工业级传送带建模精度。

# Task 2 线框移动滞后问题分析

## Task Routing

- task_type: `code-write`
- evidence: `webcad.cmd kb-route` 返回 `code-write`；本次产出是缺陷分析 artifact，不直接修改运行代码。
- kb_root: `.ai-workflow/knowledge/webcad/`
- source_roots:
  - `examples/views/workpie_object.vue`
  - `src/projects/template/model/workpiece/`
  - `src/projects/template/command/`
  - `src/projects/template/view/`
- expected_output: `bug.md`，说明复现、根因、解决方案和验证方式。

## Edit Plan

- anchor_files:
  - `src/projects/template/model/workpiece/simple_workpiece.ts`
  - `src/projects/template/model/workpiece/simple_workpiece_factory.ts`
  - `src/projects/template/command/cmd_move_workpiece.ts`
  - `src/projects/template/view/temp_canvas.ts`
  - `.ai-workflow/knowledge/webcad/source/business/rendering-display-lifecycle.md`
  - `.ai-workflow/knowledge/webcad/source/business/batch-rendering.md`
  - `.ai-workflow/knowledge/webcad/source/pitfalls/dirty-marking.md`
  - `.ai-workflow/knowledge/webcad/source/pitfalls/batch-shared-buffer-lifecycle.md`
- reuse_pattern: 继续走 `Command -> Entity -> dirty -> Display`，不直接操作 Three.js scene 或 display 对象。
- extension_point: `Command` + `Entity` + `Display` 注册链；核心风险在 `BatchLineDisplay` 的 shared buffer 刷新。
- registration_path: `TempCanvas._registerDisplay()` 注册 `SimpleWorkpiece -> Group`、`BatchMesh -> BatchMeshDisplay`、`BatchLine -> BatchLineDisplay`、`BatchPoint -> BatchPointDisplay`；`cmd_register.ts` 注册 `MoveWorkpieceCommand`。
- runtime_risks: dirty 类型不匹配、batch shared buffer 局部刷新滞后、view 复用后静态 batch map 残留、pick/render buffer 不同步。

## 证据索引

- `src/projects/template/command/cmd_move_workpiece.ts`: `_startAnimation(...)` 每帧调用 `workpiece.moveToPosition(current)` 和 `this._view.dirty()`。
- `src/projects/template/model/workpiece/simple_workpiece.ts`: `moveToPosition(...)` 当前对子实体只做 `dirtyPosition()` 和通用 `dirty()`。
- `src/projects/template/model/workpiece/simple_workpiece_factory.ts`: `featureLines` 使用 `FSCore.Model.BatchLine`，并设置 `lineWidth: 2`。
- `src/projects/template/view/temp_canvas.ts`: `BatchLine` 注册到 `Display.BatchLineDisplay`，显示链路闭合。
- `lib/index.js`: `BatchBaseDisplay._onPositionDirty()` 会写入 `entity.positionView` 并局部标记 position attribute；`BatchLineDisplay._onGeometryDirty()` 会把 attributes/index 标记为 `needsUpdate`。

## 现象

点击“移动到 B 点”后：

1. 工件主体面正常移动。
2. 特征点正常移动。
3. 特征线框停留在原地。
4. 再点击“创建新的几何体”后，原本停在原地的线框恢复到正确位置。

这个现象不是命令没有执行，也不是 `SimpleWorkpiece` 父级位姿没有变化。主体和点能移动，说明 `MoveWorkpieceCommand -> SimpleWorkpiece.moveToPosition(...) -> view.dirty()` 主链路已经生效。

## 源码事实

`MoveWorkpieceCommand` 每帧调用 `workpiece.moveToPosition(current)`，然后调用 `this._view.dirty()`：

```ts
workpiece.moveToPosition(current);
workpiece.setRemaining((1 - progress) * duration);
this._view.dirty();
```

`SimpleWorkpiece.moveToPosition(...)` 当前会 dirty 父实体和每个子实体：

```ts
this.setPosition(position[0], position[1], position[2]);
this.dirtyPosition();
this.dirty();
this.forEachChild(child => {
    child.dirtyPosition();
    child.dirty();
});
```

工件由三个 batch 子实体组成：

```ts
BatchMesh  -> 主体面
BatchLine  -> 特征线
BatchPoint -> 特征点
```

其中特征线创建时设置了 `lineWidth: 2`，会走粗线 batch 渲染路径。

`TempCanvas` 已注册这三个 display，注册链是闭合的：

```ts
this.registerDisplayType(FSCore.Model.BatchMesh, e => this.createDisplay(e, Display.BatchMeshDisplay));
this.registerDisplayType(FSCore.Model.BatchLine, e => this.createDisplay(e, Display.BatchLineDisplay));
this.registerDisplayType(FSCore.Model.BatchPoint, e => this.createDisplay(e, Display.BatchPointDisplay));
```

## 知识库事实

WebCAD 的 display 刷新依赖 `Entity dirty -> Display dirtyGraph -> onDraw`。几何、材质、位置要使用对应 dirty 类型。

Batch 渲染不是每个 entity 一个独立 Three.js 对象。知识库说明 `BatchBaseDisplay` 使用共享 buffer / batch object：同 batchId 的多个 display 可能共享同一个渲染对象，并通过 `positionView`、`indexView`、`statusView` 等 typed array 局部更新。

随包打包产物也能看到相同机制：`BatchBaseDisplay._onPositionDirty()` 会把矩阵增量写入 `entity.positionView`，再标记 `viewObj.geometry.attributes.position` 的局部 update range；`BatchLineDisplay._onGeometryDirty()` 则会把所有 attributes 和 index 标为 `needsUpdate`。

## 根因判断

最可能根因是：移动时当前实现主要触发 `dirtyPosition()`，但粗线 `BatchLineDisplay` 依赖 shared batch geometry / instance geometry。对这类线框，单纯 position dirty 的局部刷新疑似不够稳定，线段的 shared buffer 或粗线实例 attribute 没有在当前帧完整 flush 到 GPU；而新建几何体会再次触发 batch display 创建或 shared batch 对象属性更新，所以旧线框被顺带刷新，表现为“创建新几何体后恢复正常”。

这也解释了为什么主体和点正常：

- `BatchMeshDisplay` 和 `BatchPointDisplay` 的刷新路径与粗线不同。
- 当前异常只集中在 `BatchLine(lineWidth: 2)` 的线框。
- 新建几何体能恢复，说明数据并非永久错误，而是 batch display/attribute 更新时机或 dirty 粒度不足。

当前源码里 `SimpleWorkpieceFactory` 已经把工件几何构建为局部坐标，再把 `center` 放到父级位姿上；所以“center 同时写入子顶点和父级位姿”不是当前版本的主要原因。

## 可选解决方案

### 方案 A：移动时对子 batch 做更强 dirty

在 `SimpleWorkpiece.moveToPosition(...)` 中，继续保留父级 `dirtyPosition()`，但对子实体根据类型补更明确的刷新：

- `BatchMesh`：`dirtyPosition()`
- `BatchPoint`：`dirtyPosition()`，必要时 `dirtyGeometry()`
- `BatchLine`：`dirtyPosition()` + `dirtyGeometry()`

粗线 `BatchLineDisplay._onGeometryDirty()` 会把 attributes/index 全量标记 `needsUpdate`，比仅 position dirty 更能覆盖 shared buffer 未刷新的情况。该判断仍需要通过浏览器实测关闭：补 `BatchLine.dirtyGeometry()` 后，移动完成且不创建新几何体时，线框必须已经位于 B 点。

优点：改动小，仍在 Entity dirty 链路内。  
缺点：移动动画每帧对线框 `dirtyGeometry()` 会更重，工件数量多时可能有性能压力。

### 方案 B：把工件移动改成几何数据重写

移动时不移动父级 Group，而是把 `BatchMesh/BatchLine/BatchPoint` 的 `positionView` 或几何顶点按目标位置重算，然后触发 `dirtyGeometry()`。

优点：最直接刷新 batch buffer。  
缺点：会把“位姿变化”写成“几何变化”，不符合任务 2 原方案；也更容易破坏 pick、包围盒和后续装配/运动学语义。

### 方案 C：避免线框使用粗线 batch 路径

把特征线的 `lineWidth` 从 `2` 改成默认细线，降低粗线 `LineSegmentsGeometry`/instance attribute 路径的刷新风险。

优点：改动非常小。  
缺点：只是规避，不是修复；视觉效果变弱，而且仍需要验证细线 batch position dirty 是否完全稳定。

### 方案 D：自定义业务 FeatureLine entity/display

为工件特征线定义业务实体和 display，使用非 batch 的普通 Three line 或明确管理自己的 geometry update。

优点：刷新语义最可控。  
缺点：改动最大，需要新增 Entity/Display、注册链、pick 身份、cleanup 验证；当前任务不建议优先走这条。

## 推荐修复

优先采用方案 A：在当前业务库内补足 dirty 粒度，不改底座。

建议把 `SimpleWorkpiece.moveToPosition(...)` 调整为“父级位置 dirty + 子 batch 分类 dirty”。对 `BatchLine` 补 `dirtyGeometry()`，让粗线 shared geometry 的 attributes/index 在移动帧被明确标记更新。

如果性能成为问题，再降级为“只在动画结束帧对 BatchLine dirtyGeometry()”，或改用细线规避粗线路径。

## 最小验证

1. 打开 `examples/views/workpie_object.vue` 对应页面。
2. 创建一个立方体。
3. 选中该工件。
4. 点击“移动到 B 点”。
5. 验证主体面、特征点、特征线框同步移动，不出现原地残留线框。
6. 移动完成后不创建新几何体，线框也应已经在 B 点。
7. 连续创建多个工件并分别移动，确认 shared batch 不互相污染。
8. 运行构建或最小类型过滤检查：

```bash
npm run build
```

或只过滤本任务相关文件的类型输出：

```bash
npx vue-tsc --noEmit --pretty false 2>&1 | Select-String -Pattern "cmd_move_workpiece|simple_workpiece|simple_workpiece_factory|workpie_object|temp_canvas|cmd_register|cmd_types"
```

## 审查结论

这不是 `cadnginx` / `fscadweb` 底座必须改造的问题。当前业务库已经正确接入 Command、Entity、Display 注册链，缺陷更像是业务侧对 batch 粗线实体的 dirty 粒度不足。先在业务库对 `BatchLine` 补足 geometry dirty，并用移动后不创建新几何体的场景做回归验证。

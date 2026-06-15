# WebCAD AI 入口

先判断任务类型：`solution-write`、`solution-review`、`code-write`、`code-review`、`kb-maintain`。
默认先读本文件、[`manifest.json`](./manifest.json)、[`foundations/shared-facts.md`](./foundations/shared-facts.md)，再补最小必要主题。

路由或别名不确定时，先读 [`workflows/routing-preflight.md`](./workflows/routing-preflight.md)，确认 task type -> role file、entry / role / topic / risk 最小加载和 manifest 漂移检查。

## 知识优先级

1. 当前仓库 `knowledge/webcad/source/`
2. 当前仓库 `src/`
3. 随包 WebCAD 知识库中的底座源码用法摘要
4. 当前仓库或已发布包内 `lib/`

## 最小加载集

### `solution-write`

1. [`roles/solution-writer.md`](./roles/solution-writer.md)
2. [`foundations/shared-facts.md`](./foundations/shared-facts.md)
3. [`foundations/architecture-and-boundaries.md`](./foundations/architecture-and-boundaries.md)
4. [`foundations/entity-display-lifecycle.md`](./foundations/entity-display-lifecycle.md)
5. [`business/cadapp-and-canvas.md`](./business/cadapp-and-canvas.md)
6. [`business/registration-and-bootstrap.md`](./business/registration-and-bootstrap.md)
7. [`decisions/code-placement.md`](./decisions/code-placement.md)
8. [`patterns/spec-template.md`](./patterns/spec-template.md)

### `solution-review`

1. [`roles/solution-reviewer.md`](./roles/solution-reviewer.md)
2. [`foundations/shared-facts.md`](./foundations/shared-facts.md)
3. [`pitfalls/review-hotspots.md`](./pitfalls/review-hotspots.md)
4. [`pitfalls/multi-view-and-singletons.md`](./pitfalls/multi-view-and-singletons.md)
5. [`workflows/author-review-revise.md`](./workflows/author-review-revise.md)

### `code-write`

1. [`roles/code-writer.md`](./roles/code-writer.md)
2. [`foundations/shared-facts.md`](./foundations/shared-facts.md)
3. [`business/cadapp-and-canvas.md`](./business/cadapp-and-canvas.md)
4. [`business/registration-and-bootstrap.md`](./business/registration-and-bootstrap.md)
5. [`patterns/skills/README.md`](./patterns/skills/README.md)
6. [`patterns/entity-extension-template.md`](./patterns/entity-extension-template.md)
7. [`patterns/display-extension-template.md`](./patterns/display-extension-template.md)
8. [`patterns/command-extension-template.md`](./patterns/command-extension-template.md)
9. [`patterns/loader-extension-template.md`](./patterns/loader-extension-template.md)

### `code-review`

1. [`roles/code-reviewer.md`](./roles/code-reviewer.md)
2. [`foundations/shared-facts.md`](./foundations/shared-facts.md)
3. [`pitfalls/review-hotspots.md`](./pitfalls/review-hotspots.md)
4. [`pitfalls/index.md`](./pitfalls/index.md)
5. [`workflows/author-review-revise.md`](./workflows/author-review-revise.md)

### `kb-maintain`

1. [`roles/kb-reviewer.md`](./roles/kb-reviewer.md)
2. [`decisions/source-consistency.md`](./decisions/source-consistency.md)
3. [`foundations/shared-facts.md`](./foundations/shared-facts.md)
4. 需要修订的目标文档
5. 对应源码文件

## 按需补充读取

只有需求明确涉及专项主题时，才补读对应专题：

- App / View / Document 生命周期：[`business/app-view-document-lifecycle.md`](./business/app-view-document-lifecycle.md)
- Entity / CADEntity / dirty / destroy：[`business/entity-model-and-dirty.md`](./business/entity-model-and-dirty.md)
- Display / Rendering 生命周期：[`business/rendering-display-lifecycle.md`](./business/rendering-display-lifecycle.md)
- 批量渲染：[`business/batch-rendering.md`](./business/batch-rendering.md)
- 点云：[`business/pointcloud.md`](./business/pointcloud.md)
- Command / Tool 生命周期：[`business/command-and-tool-lifecycle.md`](./business/command-and-tool-lifecycle.md)
- 捕捉：[`business/snap-engine.md`](./business/snap-engine.md)
- Gizmo：[`business/gizmo-usage.md`](./business/gizmo-usage.md)
- Loader：[`business/model-loaders.md`](./business/model-loaders.md)
- Resource / SES 持久化：[`business/resource-and-ses-persistence.md`](./business/resource-and-ses-persistence.md)
- CSS2D/CSS3D 与场景：[`business/scene-and-css-rendering.md`](./business/scene-and-css-rendering.md)
- 运动学：[`business/kinematics.md`](./business/kinematics.md)
- Kinematics / Simulation / Animation：[`business/kinematics-simulation-animation.md`](./business/kinematics-simulation-animation.md)
- 通用 WebCAD 实现模式模板：[`patterns/skills/README.md`](./patterns/skills/README.md)
- Canvas 开发：[`patterns/skills/webcad-canvas-development.md`](./patterns/skills/webcad-canvas-development.md)
- Command 开发：[`patterns/skills/webcad-command-development.md`](./patterns/skills/webcad-command-development.md)
- Entity / Display 开发：[`patterns/skills/webcad-entity-display-development.md`](./patterns/skills/webcad-entity-display-development.md)
- Observer 开发：[`patterns/skills/webcad-observer-development.md`](./patterns/skills/webcad-observer-development.md)
- Handle 层开发：[`patterns/skills/webcad-handle-layer-development.md`](./patterns/skills/webcad-handle-layer-development.md)
- 模块验证矩阵：[`workflows/module-verification-matrix.md`](./workflows/module-verification-matrix.md)
- Agent 正反例：[`workflows/agent-positive-negative-examples.md`](./workflows/agent-positive-negative-examples.md)

## 关键风险入口

出现下面任一关键词时，优先补读对应陷阱：

- 多视图、复用、单例、销毁：[`pitfalls/multi-view-and-singletons.md`](./pitfalls/multi-view-and-singletons.md)
- 键盘、Enter、Esc、快捷键：[`pitfalls/keyboard-input-bridge.md`](./pitfalls/keyboard-input-bridge.md)
- 拾取、hover、右键、反查 entity：[`pitfalls/gpu-pick-id-color.md`](./pitfalls/gpu-pick-id-color.md)
- pick、selection、inputStack、observer 聚合风险：[`pitfalls/pick-selection-input-chain.md`](./pitfalls/pick-selection-input-chain.md)
- inputStack observer 优先级和 consumed 顺序：[`pitfalls/inputstack-observer-order.md`](./pitfalls/inputstack-observer-order.md)
- 点云 pick 与点级 selection：[`pitfalls/pointcloud-pick-selection.md`](./pitfalls/pointcloud-pick-selection.md)
- dirty、刷新不生效：[`pitfalls/dirty-marking.md`](./pitfalls/dirty-marking.md)
- display 匹配错误：[`pitfalls/display-registration-order.md`](./pitfalls/display-registration-order.md)
- viewObj / pickObj 懒创建时序：[`pitfalls/viewobj-timing.md`](./pitfalls/viewobj-timing.md)
- snap pick size 与单例污染：[`pitfalls/snap-pick-size-and-singleton.md`](./pitfalls/snap-pick-size-and-singleton.md)
- gizmo input / signal 生命周期：[`pitfalls/gizmo-input-and-signal-lifecycle.md`](./pitfalls/gizmo-input-and-signal-lifecycle.md)
- batch shared buffer 生命周期、`pickColorView`、`statusView`、批量对象销毁：[`pitfalls/batch-shared-buffer-lifecycle.md`](./pitfalls/batch-shared-buffer-lifecycle.md)
- destroy 链和缓存残留：[`pitfalls/entity-destroy-chain.md`](./pitfalls/entity-destroy-chain.md)
- signal listen / unlisten 生命周期：[`pitfalls/signal-lifecycle.md`](./pitfalls/signal-lifecycle.md)

## 发布要求

如果希望下游业务仓库里的 AI 直接使用这套知识，发布包至少要包含：

- `knowledge/webcad/source/`
- `AGENTS.md`
- `lib/*.d.ts`

## 维护要求

- 每个事实文档都要尽量给出源码锚点
- 索引中引用的文件必须真实存在
- 长流程文档不进入默认加载集
- 每次改动后运行知识库校验脚本


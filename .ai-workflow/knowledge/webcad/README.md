# WebCAD Knowledge Pack

这是从外部知识库复制进来的 WebCAD 领域知识包。

## 来源

原始来源：

- `内部 WebCAD 知识源快照`

复制目标：

- `knowledge/webcad/source/`

## 结构说明

```text
knowledge/webcad/
  README.md
  route-manifest.json
  mvp-lane-map.md
  load-by-task.md
  load-by-topic.md
  source/
    business/
    decisions/
    foundations/
    patterns/
      skills/   # implementation pattern templates; not native agent SKILL.md packages
    pitfalls/
    roles/
    workflows/
    index.md
    manifest.json
```

## 读取原则

不要直接整包读取 `source/`。

请优先按以下顺序读取：

1. `knowledge/webcad/README.md`
2. `knowledge/webcad/route-manifest.json`
3. `knowledge/webcad/source/index.md`
4. 对应任务的最小加载集
5. 若命中主题或风险关键词，再补读专项文档

## 何时使用

适用于以下场景：

- WebCAD 业务库方案设计
- WebCAD 方案审查
- WebCAD 代码实现
- WebCAD 代码审查
- WebCAD 知识库维护

## 与 MVP 的关系

这个知识包是 Knowledge Layer 的一个领域知识源。

它不取代：

- 项目真实源码
- 当前任务 state/runtime
- 当前任务 artifact

它只提供：

- 领域事实
- 设计边界
- 常见陷阱
- 角色化最小读取集
- Canvas / Command / Entity-Display / Observer / Handle 的通用实现模式模板

## 首选入口

如果你要在本 MVP 中使用这套知识，建议先读：

- `knowledge/webcad/mvp-lane-map.md`
- `knowledge/webcad/load-by-task.md`

## 实现模式模板入口

业务库代码实现或审查涉及具体扩展层时，先读：

- `knowledge/webcad/source/patterns/skills/README.md`

然后按落点补读一个或多个具体模板：

- `knowledge/webcad/source/patterns/skills/webcad-canvas-development.md`
- `knowledge/webcad/source/patterns/skills/webcad-command-development.md`
- `knowledge/webcad/source/patterns/skills/webcad-entity-display-development.md`
- `knowledge/webcad/source/patterns/skills/webcad-observer-development.md`
- `knowledge/webcad/source/patterns/skills/webcad-handle-layer-development.md`

注意：这些文件虽然保留在 `patterns/skills/` 目录下，但属于知识库实现模式模板，不是 `.claude` / `.codex` 原生自动触发的 `SKILL.md` skill 包。


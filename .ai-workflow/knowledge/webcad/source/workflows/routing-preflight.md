# Routing Preflight

这份工作流用于 WebCAD CLI / agent 在进入方案、实现或审查前做最小加载检查。它不替代角色文档，只负责防止 entry、role、topic、risk 路由漏读或 manifest 漂移。

## Task Type To Role

| task_type | role file |
|---|---|
| `solution-write` | [`../roles/solution-writer.md`](../roles/solution-writer.md) |
| `solution-review` | [`../roles/solution-reviewer.md`](../roles/solution-reviewer.md) |
| `code-write` | [`../roles/code-writer.md`](../roles/code-writer.md) |
| `code-review` | [`../roles/code-reviewer.md`](../roles/code-reviewer.md) |
| `kb-maintain` | [`../roles/kb-reviewer.md`](../roles/kb-reviewer.md) |

如果用户输入的词是 `code writer`、`实现`、`审 diff`、`维护 KB` 这类别名，先归一到上表 5 个 `task_type` 之一，再加载 role file。

## Minimum Load Check

每次 WebCAD 路由生效后，先确认以下四类文件已命中：

1. entry：[`../index.md`](../index.md)、[`../manifest.json`](../manifest.json)、[`../foundations/shared-facts.md`](../foundations/shared-facts.md)。
2. role：上表中当前 `task_type` 对应的角色文档。
3. topic：按 `route-manifest.json.topic_routes` 和 `source/manifest.json.topic_routes` 命中的专项文档。
4. risk：按两个 manifest 的 `risk_routes` 命中的陷阱或验证文档。

没有 topic 或 risk 命中时，可以继续；但如果输入出现 `display`、`pointcloud`、`pick`、`selection`、`SES`、`URDF`、`snap`、`gizmo`、`worker`、`destroy`、`signal` 等关键词却没有命中文档，要先修正路由或说明证据不足。

## Alias Families

匹配 `topic_routes` alias 前必须先做大小写归一。manifest 中保留 lowercase / camelCase 主 key，不保留只在大小写上不同的重复别名，以兼容 Windows PowerShell `ConvertFrom-Json`；例如输入 `CADEntity`、`SES`、`URDF` 时应先归一后命中 `cadentity`、`ses`、`urdf`。

优先按这些 alias family 归类，而不是只做精确匹配：

- App / View / Document：`app`、`view`、`canvas`、`document`、`lifecycle`。
- Entity / Display：`entity`、`cadentity`、`dirty`、`destroy`、`display`、`rendering`、`screenBox`、`viewObj`、`createPickObject`。
- Interaction：`pick`、`selection`、`hover`、`inputStack`、`observer`、`right-click`。
- Command / Snap / Gizmo：`command`、`tool`、`snap`、`gizmo`、`hotkey`、`Mousetrap`、`pickSize`。
- Loader / Kinematics：`loader`、`ResourceManager`、`ses`、`urdf`、`kinematics`、`Link`、`Joint`、`rootLink.update`；用户输入 `SES` / `URDF` 时先归一到 canonical lowercase。
- Performance / Rendering：`batch`、`statusView`、`pickColor`、`worker`、`material`、`postprocess`、`config`、`instance`、`animation`。

## Manifest Drift Check

`knowledge/webcad/route-manifest.json` 是 canonical。维护时必须检查：

1. 两个 manifest 都是合法 JSON。
2. `task_routes`、`topic_routes`、`risk_routes` key 集合一致，除非报告里显式说明 intentional difference。
3. 每个 route target 文件真实存在。
4. 新增业务或 pitfall 文档后，至少补一个 topic 或 risk alias，并在索引中可见。

建议校验命令：

```powershell
npm run validate:webcad-kb
# 或直接运行：
node .ai-workflow/knowledge/webcad/scripts/validate-webcad-knowledge.mjs
```

该脚本会检查双 manifest JSON 可解析、PowerShell 兼容的大小写重复 key、task/topic/risk key 与 target 同步、route target 存在、canonical alias，以及核心业务 / pitfall 文档的固定章节。Workflow 类文档如果不适用固定章节结构，必须在脚本的 waiver 中写明原因。

## Review Prompt

在正式输出前，自检：

- 我是否说明了当前 `task_type` 和 role file。
- 我是否加载了 entry + role + topic + risk 的最小集合。
- 我是否避免使用未在 manifest 中存在、或目标文件不存在的 route。
- 我是否比较了两个 manifest 的路由 key 差异。

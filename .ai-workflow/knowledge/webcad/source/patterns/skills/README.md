# WebCAD 开发实现模式模板

本目录存放面向 WebCAD 下游业务库开发的通用实现模式模板。

这些模板聚焦可复用的扩展层开发流程和验证检查点，具体业务功能由业务库代码承载。
模板不绑定固定业务目录、文件名或本机源码路径。使用时应先在当前工作区搜索真实锚点，再按已有基类、注册链和生命周期落地。

注意：这些文件虽然保留在 `patterns/skills/` 目录下，但不是 `.claude` / `.codex` 原生自动触发的 `SKILL.md` skill 包；它们由 `AGENTS.md` / `CLAUDE.md` 的任务路由规则触发读取。

通用不等于占位。凡是进入代码产出、代码审查或实测评分，必须使用目标仓库已经存在的真实 import、基类、方法名、注册入口和生命周期钩子。找不到对应锚点时，结论应停在“证据不足/需要补查”，不要用 `Current*`、`Xxx*` 等占位结构冒充可落地代码。

当前推荐的业务库标准链路来自 `cadnginx` 与 `webcad-weld` 的真实用法：

```text
WebCadApiBase
  -> BaseViewHandle
  -> Base3DCanvas
  -> _registerDisplay / _registerCommands / _registerPickHelper
  -> registerCmds + CmdBase.commit()
  -> Entity dirty / Display onCleanup
```

历史或专项 SDK 里可能存在 `ReverseAppCanvas`、单例 observer、手写 `cmdManager.register` 等模式。除非目标仓库已经采用这套模式，否则默认优先使用上面的业务库标准链路。

## Templates

- `webcad-canvas-development`: Canvas/view 运行时容器开发。
- `webcad-entity-display-development`: Entity 与 Display 映射开发。
- `webcad-command-development`: Command 类型、实现、注册和执行开发。
- `webcad-observer-development`: Canvas observer 与事件转译开发。
- `webcad-handle-layer-development`: 面向 UI 的 handle API 开发。

## 加载规则

优先使用与当前开发层级匹配的最小模板。涉及跨层交互时，按实际落点分别使用 command、observer、canvas 或 handle 相关模板。
如果找不到某个模板要求的基类、注册入口或清理入口，先停在证据不足，不要发明 API 或目录结构。
质量评分必须区分“静态文本改善”和“实测改善”。只有基于目标仓库真实结构生成代码，并通过 typecheck、lint、测试或人工可编译性审查后，才能把效果维度计为有效提升。

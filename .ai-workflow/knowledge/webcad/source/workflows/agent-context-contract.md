# Agent 上下文契约

这份文档定义 WebCAD 业务库开发流程中的统一输入、统一过程输出、统一交接方式。
目标不是替代 `spec.md`、`code-review.md` 等正式产物，而是让不同 agent 在不同阶段都能用同一套上下文骨架理解任务。

适用阶段：

- 方案编写
- 方案审查
- 代码实现
- 代码审查
- 验收

## 总原则

- 所有阶段都先判断任务属于：业务库方案设计、业务库方案审查、业务库代码实现、业务库代码审查、知识库维护。
- 所有阶段都先给出“当前任务定位”和“知识来源根路径”。
- 所有正式结论都必须能回溯到 `knowledge/webcad/source/` 或源码事实。
- 过程输出服务于后续 agent 交接，必须比闲聊更结构化，但比正式文档更轻量。

## 先做任务路由

这份契约不是“一套字段无差别套所有任务”，而是“先判任务类型，再选对应模板”。
每个 agent 开始时必须先完成任务路由，再决定读取哪些知识、整理哪些输入、产出哪些结果。

### 路由规则

| task_type | 适用场景 | 禁止误判为 |
|------|------|------|
| solution-write | 用户要方案、设计、拆分、验收项、扩展点选择 | code-write / code-review |
| solution-review | 用户要审查方案、挑问题、看边界和风险 | solution-write / code-review |
| code-write | 用户要落代码、接注册链、补生命周期、做最小验证 | solution-write / solution-review |
| code-review | 用户要 review 代码、diff、实现结果 | solution-review / code-write |
| kb-maintain | 用户要维护知识库或 skill 自身 | 业务库开发任务 |

### 路由判定问题

开始前至少回答下面 4 个问题：

1. 用户现在要的是方案，还是代码，还是审查，还是知识库维护？
2. 当前输入的主体是需求描述、方案文档、代码 diff，还是知识文件？
3. 本阶段的正式产物应该是 `spec.md`、`spec-review.md`、代码修改、`code-review.md`，还是知识库文件？
4. 当前阶段是否要求新 reviewer 接手，而不是作者继续自判？

如果这 4 个问题的答案与当前 `task_type` 不一致，先修正 `task_type`，再继续。

## 多需求隔离

同一时期可能有多个需求并行开发。这时不能只靠 `task_type` 区分，还必须再区分“这是哪个需求实例”。
否则最常见的问题是：

- 把 A 需求的方案审查意见写进 B 需求的实现上下文
- 把 A 需求的 diff 当成 B 需求的代码审查输入
- 多个需求共用一份 `过程上下文`，导致 facts、risks、decisions 混在一起

### 每个需求都必须有唯一标识

每个需求实例至少要补这几个字段：

| 字段 | 含义 |
|------|------|
| feature_key | 需求唯一标识，推荐短横线命名，例如 `beam-batch-edit` |
| feature_title | 面向人的需求名称 |
| request_source | 需求来源，例如用户消息、issue、spec、口头补充 |
| artifact_root | 该需求自己的产物目录或产物前缀 |

约束：

- `feature_key` 在同一工作区内必须唯一。
- 一个 agent 一次只处理一个 `feature_key`。
- 如果用户一条消息里提了多个需求，先拆成多个 `feature_key`，再分别路由。

### 多需求拆分规则

出现下面任一情况时，视为“多个需求”，不能继续共用一份上下文：

1. 目标不同：例如一个需求是“设计批量编辑方案”，另一个是“修复选择状态污染”。
2. 产物不同：一个要 `spec.md`，另一个要代码修改或 `code-review.md`。
3. 代码区域不同且可以独立推进。
4. 审查结论不能共享，例如一个需求必须修方案，另一个已经进入实现。

### 多需求工作方式

当存在多个需求时，必须按下面方式处理：

1. 先列出需求清单，每条包含 `feature_key + feature_title + candidate_task_type`。
2. 对每个 `feature_key` 单独建立一份 `任务输入`。
3. 对每个 `feature_key` 单独维护一份 `过程上下文`。
4. 每个正式产物都标明它属于哪个 `feature_key`。
5. reviewer 只审查自己对应的 `feature_key`，不能跨需求合并结论。

### 标准产物目录

为了让“需求隔离”和“文件隔离”一致，默认每个需求都使用独立目录：

```text
features/<feature_key>/
```

其中：

- `feature_key` 必须与上下文里的 `feature_key` 完全一致
- `artifact_root` 默认就是 `features/<feature_key>/`
- 如果仓库已有既定目录结构，可以覆盖默认值，但必须在 `artifact_root` 明确写出

### 标准产物文件

默认文件组织如下：

```text
features/<feature_key>/
  spec.md
  spec-review.md
  implementation-notes.md
  code-review.md
  acceptance.md
```

说明：

- `spec.md`：方案编写与方案修订共用，持续更新
- `spec-review.md`：方案审查输出
- `implementation-notes.md`：代码实现说明与最小验证记录
- `code-review.md`：代码审查输出
- `acceptance.md`：验收结果

### 文件隔离规则

- 不同 `feature_key` 不能共用同一份 `spec.md`
- 不同 `feature_key` 不能共用同一份 `spec-review.md`
- 不同 `feature_key` 不能共用同一份 `code-review.md`
- 即使多个需求最终改到同一组源码文件，过程产物仍然要按 `feature_key` 分开
- 如果一次提交同时覆盖多个 `feature_key`，提交说明里也要能映射回各自产物目录

### 禁止事项

- 禁止把多个需求写进同一份未区分的 `任务输入`。
- 禁止把多个需求共用一份未区分的 `过程上下文`。
- 禁止在没有 `feature_key` 的情况下进入方案、实现或审查。
- 禁止用“顺手一起改”跳过需求拆分；即使一起改代码，也要在上下文和产物中分开记录。

## 按任务类型裁剪输入

只有公共字段对所有任务都通用。其余字段要按 `task_type` 选择，不要全部展开，避免 agent 被无关字段误导。

### 公共输入字段

所有任务都保留：

- `task_type`
- `feature_key`
- `feature_title`
- `artifact_root`
- `feature_name`
- `goal`
- `workspace`
- `kb_root`
- `source_roots`
- `inputs`
- `constraints`
- `expected_output`

### 方案编写输入

仅在 `solution-write` 使用或强调：

- `in_scope`
- `out_of_scope`
- `open_questions`
- `existing_artifacts` 中与需求、旧方案、既有业务库结构相关的部分

### 方案审查输入

仅在 `solution-review` 使用或强调：

- `existing_artifacts` 中的 `spec.md`
- 审查目标和审查范围
- 需要抽查的源码区域

### 代码实现输入

仅在 `code-write` 使用或强调：

- `existing_artifacts` 中的 `spec.md`、`spec-review.md`
- 审查后的必须修订项
- 相关现有代码文件

### 代码审查输入

仅在 `code-review` 使用或强调：

- `inputs` 中的 diff、变更文件、实现说明
- `existing_artifacts` 中的 `spec.md`
- 审查范围

### 知识库维护输入

仅在 `kb-maintain` 使用或强调：

- 需要维护的知识文件或 skill 文件
- 相关源码事实
- 需要回写或同步的目标位置

## 统一初始输入

每个 agent 开始工作时，先根据 `task_type` 从下面字段中选取必要项整理用户输入；缺失字段可以根据工作区推断，但要标明“已推断”。

| 字段 | 含义 |
|------|------|
| task_type | 当前任务类型：solution-write / solution-review / code-write / code-review / kb-maintain |
| feature_key | 需求唯一标识 |
| feature_title | 需求标题 |
| artifact_root | 当前需求的产物根目录，默认 `features/<feature_key>/` |
| feature_name | 功能或主题名 |
| goal | 用户要解决的问题 |
| in_scope | 本次明确要做的内容 |
| out_of_scope | 明确不做的内容 |
| workspace | 当前工作区路径 |
| kb_root | 本次使用的知识库根路径 |
| source_roots | 本次需要抽查的源码根路径 |
| inputs | 用户提供的文档、代码、diff、截图、口头约束 |
| existing_artifacts | 已存在的 `spec.md`、`spec-review.md`、`code-review.md`、实现代码等 |
| constraints | API 约束、时间约束、兼容性约束、必须复用的底座能力 |
| open_questions | 当前还不确定但会影响结论的问题 |
| expected_output | 本阶段应产出的正式结果 |

推荐输出形式：

```md
## 任务输入
- task_type:
- feature_key:
- feature_title:
- artifact_root:
- feature_name:
- goal:
- in_scope:
- out_of_scope:
- workspace:
- kb_root:
- source_roots:
- inputs:
- existing_artifacts:
- constraints:
- open_questions:
- expected_output:
```

## 统一过程输出

每个 agent 在正式结果之外，都应持续维护一份“过程上下文摘要”。这份摘要用于：

- 让后续 reviewer 快速接手
- 让作者修订时不必重读全量上下文
- 让 AI 在长流程里保持事实一致

过程上下文摘要至少包含：

| 字段 | 含义 |
|------|------|
| stage | 当前阶段 |
| current_status | 进行中 / 待审查 / 待修订 / 已完成 |
| files_read | 本阶段实际读取过的知识文件和源码文件 |
| facts_used | 本阶段用到的关键事实 |
| decisions | 已做出的设计或实现决策 |
| risks | 已发现风险 |
| unresolved | 仍未解决的问题 |
| next_action | 下一步动作 |
| handoff_to | 下一阶段交给哪个角色 |

推荐输出形式：

```md
## 过程上下文
- stage:
- current_status:
- files_read:
- facts_used:
- decisions:
- risks:
- unresolved:
- next_action:
- handoff_to:
```

## 分阶段正式产出规范

### 1. 方案编写

对应 `task_type = solution-write`

输入重点：

- 用户需求
- 现有业务库结构
- 相关底座扩展点

正式输出：

- `spec.md`

过程输出重点：

- 需求如何映射到底座扩展点
- 哪些内容放业务库，哪些不能放到底座
- 初步风险和验收标准

### 2. 方案审查

对应 `task_type = solution-review`

输入重点：

- `spec.md`
- 相关知识库事实
- 必要的源码抽查

正式输出：

- `spec-review.md`
- `required-revisions.md` 或等价“必须修订项”

过程输出重点：

- 哪些判断来自知识库
- 哪些判断来自源码抽查
- 哪些问题属于 must-fix

### 3. 代码实现

对应 `task_type = code-write`

输入重点：

- 已通过或待修订的 `spec.md`
- 审查意见
- 业务库现有代码

正式输出：

- 代码修改
- `implementation-notes.md` 或等价实现说明
- 最小必要验证记录

过程输出重点：

- 实际改了哪些注册链和生命周期链
- 哪些设计在实现时被调整
- 哪些验证已经执行

### 4. 代码审查

对应 `task_type = code-review`

输入重点：

- 代码 diff
- `spec.md`
- 实现说明

正式输出：

- `code-review.md`
- `must-fix.md` 或等价“必须修复项”

过程输出重点：

- 生命周期问题
- 注册遗漏
- 单例污染
- 多视图复用问题
- 与方案不一致的实现

### 5. 验收

输入重点：

- 最终代码
- `spec.md`
- 审查结果

正式输出：

- `acceptance.md`

过程输出重点：

- 是否满足验收项
- 是否仍存在可接受遗留问题

## 交接规则

- 方案编写完成后，必须把 `任务输入 + 过程上下文 + features/<feature_key>/spec.md` 交给新的方案审查 agent。
- 方案审查完成后，必须把 `任务输入 + 过程上下文 + features/<feature_key>/spec-review.md` 回交作者修订。
- 代码实现完成后，必须把 `任务输入 + 过程上下文 + diff + features/<feature_key>/implementation-notes.md` 交给新的代码审查 agent。
- 代码审查完成后，必须把 `任务输入 + 过程上下文 + features/<feature_key>/code-review.md` 回交作者修订。
- 验收阶段必须读取前面阶段的正式产物，而不是只看最后代码。

## 最小上下文读取策略

为了避免每次加载全量知识库，统一采用两段式读取：

1. 先完成任务路由，再读 `roles/对应角色.md` + 本文档 + 该角色约定的最小知识集。
2. 只有当任务触及专项主题时，才补读对应 `business/`、`patterns/`、`pitfalls/`、`workflows/` 文档。

## 推荐起手式

建议每个 agent 在开头先用下面 3 段完成上下文定型：

```md
## 任务路由
- feature_key:
- feature_title:
- artifact_root:
- candidate_task_type:
- evidence:
- corrected_task_type:
- expected_output:

## 任务输入
- task_type:
- feature_key:
- feature_title:
- artifact_root:
- feature_name:
- goal:
- workspace:
- kb_root:
- source_roots:
- inputs:
- constraints:
- expected_output:
```

然后再按 `task_type` 追加该任务专属字段。

## 推荐交接摘要模板

```md
## 任务输入
- task_type:
- feature_key:
- feature_title:
- artifact_root:
- feature_name:
- goal:
- in_scope:
- out_of_scope:
- workspace:
- kb_root:
- source_roots:
- inputs:
- existing_artifacts:
- constraints:
- open_questions:
- expected_output:

## 过程上下文
- stage:
- current_status:
- files_read:
- facts_used:
- decisions:
- risks:
- unresolved:
- next_action:
- handoff_to:
```


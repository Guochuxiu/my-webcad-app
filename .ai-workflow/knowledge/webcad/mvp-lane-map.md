# WebCAD KB To MVP Lane Map

这份映射用于把 WebCAD 原始知识库中的任务路由，接到本 MVP 的 lane 上。

## Lane 到 KB 任务类型

### `feature`

优先映射：

1. `solution-write`
2. `solution-review`
3. `code-write`
4. `code-review`

适用场景：

- 新功能
- 中大型改造
- 扩展点选择

### `light-feature`

优先映射：

1. `solution-write`
2. `code-write`
3. `code-review`

适用场景：

- 小范围能力扩展
- 已知扩展点下的低风险开发

### `bugfix`

优先映射：

1. `code-review`
2. `code-write`
3. 视需要补 `solution-review`

适用场景：

- 生命周期错误
- 注册顺序问题
- dirty / pick / 键盘桥接等缺陷

### `hotfix`

优先映射：

1. `code-review`
2. `code-write`

补充要求：

- 优先读 `pitfalls/`
- 优先读风险关键词命中的陷阱文档

### `research`

优先映射：

1. `solution-write`
2. `solution-review`
3. 视需要补专题业务文档

适用场景：

- 技术选型
- 架构预研
- 方案比选

## 推荐使用顺序

### Feature / Light-Feature

1. 读 `source/index.md`
2. 读 `solution-write` 最小加载集
3. 如需审查，再读 `solution-review`
4. 进入实现前，再读 `code-write`

### Bugfix / Hotfix

1. 读 `source/index.md`
2. 读 `code-review` 最小加载集
3. 命中风险关键词时补读 `pitfalls/*`
4. 确认修复路径后，再读 `code-write`

### Research

1. 读 `source/index.md`
2. 读 `solution-write`
3. 读对应专题业务文档
4. 输出 decision record

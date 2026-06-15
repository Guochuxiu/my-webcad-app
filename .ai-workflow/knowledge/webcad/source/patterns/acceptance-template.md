# 验收模板

## 使用时机

- 方案和代码都已过修订
- 需要对单个 `feature_key` 给出最终验收结果
- 需要明确是否可以关闭该需求

## 模板

```md
# {feature_title} 验收报告

## 1. 验收对象
- feature_key: `{feature_key}`
- spec: `features/{feature_key}/spec.md`
- spec_review: `features/{feature_key}/spec-review.md`
- implementation_notes: `features/{feature_key}/implementation-notes.md`
- code_review: `features/{feature_key}/code-review.md`

## 2. 验收结论
- conclusion: 通过 / 不通过
- summary:

## 3. 验收项核对
- [ ] 验收项 1
- [ ] 验收项 2
- [ ] 验收项 3

## 4. 质量核对
- [ ] 生命周期清理正常
- [ ] 注册链完整
- [ ] 无明显多视图污染
- [ ] 无明显单例污染
- [ ] 关键交互路径正常

## 5. 验证记录
- automated_checks:
- manual_checks:
- unresolved_checks:

## 6. 遗留问题
- 问题 1
- 问题 2
```

## WebCAD 专项补充项

验收时要确认：

- spec 中承诺的接入点已经落地
- 审查阶段提出的 must-fix 已关闭
- 业务库正确接入底座，而不是靠临时绕过底座实现

# 方案审查模板

## 使用时机

- 已有 `features/<feature_key>/spec.md`
- 需要对方案做正式审查
- 需要给作者返回必须修订项和审查结论

## 模板

```md
# {feature_title} 方案审查

## 1. 审查对象
- feature_key: `{feature_key}`
- spec: `features/{feature_key}/spec.md`
- reviewer:
- review_scope:
- knowledge_sources:
- source_spot_checks:

## 2. 审查结论
- conclusion: 通过 / 有条件通过 / 不通过
- summary:

## 3. Findings
### [S1] 标题
- severity: must-fix / should-fix / follow-up
- problem:
- impact:
- evidence:
- required_revision:

### [S2] 标题
- severity:
- problem:
- impact:
- evidence:
- required_revision:

## 4. Open Questions
- 问题 1
- 问题 2

## 5. Required Revisions
- [ ] 修订项 1
- [ ] 修订项 2

## 6. Residual Risks
- 风险 1
- 风险 2
```

## WebCAD 专项补充项

方案审查要优先检查：

- 是否把业务库开发误写成底座改造
- 扩展点是否选对
- 生命周期、signal、dirty、pick、layer、destroy/clear 是否考虑完整
- 多视图与单例风险是否被覆盖
- 验收项是否能映射回真实接入点

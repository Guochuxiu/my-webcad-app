# 代码审查模板

## 使用时机

- 已有实现代码或 diff
- 需要做正式 WebCAD 专项 code review
- 需要给作者返回必须修复项和验收风险

## 模板

```md
# {feature_title} 代码审查

## 1. 审查对象
- feature_key: `{feature_key}`
- spec: `features/{feature_key}/spec.md`
- implementation_notes: `features/{feature_key}/implementation-notes.md`
- reviewer:
- review_scope:
- diff_scope:

## 2. 审查结论
- conclusion: 通过 / 有条件通过 / 不通过
- summary:

## 3. Findings
### [C1] 标题
- severity: must-fix / should-fix / follow-up
- file:
- lines:
- problem:
- impact:
- evidence:
- fix_direction:

### [C2] 标题
- severity:
- file:
- lines:
- problem:
- impact:
- evidence:
- fix_direction:

## 4. Must Fix
- [ ] 修复项 1
- [ ] 修复项 2

## 5. Test Gaps
- 缺口 1
- 缺口 2

## 6. Residual Risks
- 风险 1
- 风险 2
```

## WebCAD 专项补充项

代码审查优先检查：

- entity-display 生命周期是否闭合
- 注册链、导出链、bootstrap 链是否遗漏
- destroy / clear / signal 清理是否完整
- 多视图复用和单例状态是否污染
- pick、layer、outline、boundingBox、LOD、selection、snap 是否同步

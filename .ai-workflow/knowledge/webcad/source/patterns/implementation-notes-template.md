# 实现说明模板

## 使用时机

- 已进入 `code-write`
- 需要记录本次实现做了什么、改了哪些链路、做了哪些验证
- 需要为后续 `code-review` 提供清晰输入

## 模板

```md
# {feature_title} 实现说明

## 1. 实现对象
- feature_key: `{feature_key}`
- spec: `features/{feature_key}/spec.md`
- related_reviews:
  - `features/{feature_key}/spec-review.md`
- implementation_scope:

## 2. 代码改动概览
- 变更文件:
  - `...`
  - `...`
- 新增类型:
- 修改类型:

## 3. 接入链说明
- entity / display:
- command:
- loader:
- export:
- bootstrap / config:
- destroy / clear:

## 4. 与方案差异
- 差异 1:
- 原因:
- 是否回写 spec:

## 5. 验证记录
- [ ] type-check / build
- [ ] targeted tests
- [ ] smoke path
- [ ] manual verification

### 验证结果
- 命令:
- 结果:
- 未执行项:

## 6. 已知风险
- 风险 1
- 风险 2
```

## WebCAD 专项补充项

实现说明里要明确：

- 哪些注册链被补齐
- 哪些生命周期链被修改
- 是否触及多视图、单例、selection、snap、gizmo、LOD、batch 或 instance
- 哪些点需要 reviewer 重点复查

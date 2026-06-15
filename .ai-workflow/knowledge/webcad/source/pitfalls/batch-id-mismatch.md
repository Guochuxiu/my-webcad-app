# Batch ID 错配

## 问题描述

BatchEntity 的 `batchId` 用于 GPU 批量渲染分组。相同 `batchId` 的实体会被合并到同一个 GPU buffer，对应一次 draw call。如果需要合并渲染的实体使用了不同的 `batchId`，会导致 draw call 膨胀，严重时还会出现渲染闪烁或错位。

## 典型错误代码

```typescript
// 同一组的面使用了不同的 batchId —— 不会被合并
const face1 = new Face(geometry1, 1);  // batchId = 1
const face2 = new Face(geometry2, 2);  // batchId = 2
```

## 正确写法

```typescript
// 同一组的面共享一个 batchId
const batchId = IdGenerator.next();
const face1 = new Face(geometry1, batchId);
const face2 = new Face(geometry2, batchId);
```

### batchId 使用策略

| 场景 | 策略 | 原因 |
|------|------|------|
| 同一对象的多个面 | 共享一个 batchId | 减少该对象的 draw call |
| 不同对象的面 | 使用不同 batchId | 避免渲染错位 |
| 需要独立操控的面 | 使用不同 batchId | 单独高亮/选中时需要独立 buffer |

## 影响范围

- 所有使用 `Face`、`Edge` 等 BatchEntity 的场景
- 动态添加/移除 BatchEntity 后是否触发了对应 batch 的重建
- 性能敏感场景（大量小面）需要特别注意 batchId 分组策略

## 检查要点

- 同一渲染组的 Face/Edge 是否使用了相同的 `batchId`
- `batchId` 是否通过 `IdGenerator.next()` 生成而非硬编码数字
- 不同对象是否错误共享了同一 `batchId`
- 新增 BatchEntity 时是否正确传递了 `batchId`

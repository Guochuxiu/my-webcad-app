# LayerType 使用不当

## 问题描述

将 Entity 添加到错误的 LayerType，会导致渲染顺序异常或拾取失败。不同图层有不同的渲染策略、深度测试设置和拾取参与规则。误用后表现为实体不可见、被遮挡、无法选中或在不该清理的时候被清理。

## 典型错误代码

```typescript
// 预览实体放在了 Model 层 —— 命令结束后不会消失
app.addToView(previewEntity, view, LayerType.Model);

// 持久实体放在了 Temp 层 —— 命令 onCleanup 时会被意外删除
app.addToView(permanentEntity, view, LayerType.Temp);
```

## 正确写法

```typescript
// 持久实体 -> Model 层
app.addToView(permanentEntity, view, LayerType.Model);

// 命令预览 -> Temp 层（命令结束时自动清理）
app.addToView(previewEntity, view, LayerType.Temp);

// 操作手柄 -> Gizmo 层
app.addToView(gizmoEntity, view, LayerType.Gizmo);

// 预览叠加 -> Preview 层
app.addToView(overlayEntity, view, LayerType.Preview);
```

### LayerType 对应表

| LayerType | 用途 | 特点 | 典型场景 |
|-----------|------|------|---------|
| `Model` | 持久实体 | 主场景内容，参与拾取 | 最终模型的面、边、体 |
| `Temp` | 命令预览 | 命令结束自动清理 | 拖拽预览、临时辅助线 |
| `Gizmo` | 操作手柄 | 始终最上层，关闭深度测试 | 移动/旋转/缩放手柄 |
| `Preview` | 预览叠加 | 半透明叠加显示 | 高亮选中、悬停反馈 |
| `Batch` | 批量渲染 | GPU 合并渲染优化 | 大量相同类型的小面 |
| `Environment` | 环境背景 | 天空盒、地面网格等 | 背景网格、坐标轴 |

### 常见误用

| 错误做法 | 后果 | 正确做法 |
|---------|------|---------|
| 预览放在 Model 层 | 预览残留，命令结束后不消失 | 放在 Temp 层 |
| 持久实体放在 Temp 层 | 命令结束时被意外删除 | 放在 Model 层 |
| 辅助线放在 Gizmo 层 | 不参与深度测试，穿透显示 | 放在 Temp 或 Model 层 |
| 高亮放在 Model 层 | z-fighting 闪烁 | 放在 Preview 层 |

## 影响范围

- 所有调用 `addToView` 的地方
- 渲染顺序：Environment → Model → Batch → Temp → Preview → Gizmo
- 拾取规则：只有 Model 层和 Gizmo 层参与射线拾取
- 生命周期：Temp 层实体在命令 `onCleanup` 时被自动清理

## 检查要点

- 预览类实体是否使用了 `LayerType.Temp`
- 持久实体是否使用了 `LayerType.Model`
- 需要拾取的实体是否在参与拾取的图层中
- 高亮/选中效果是否使用了 `LayerType.Preview`

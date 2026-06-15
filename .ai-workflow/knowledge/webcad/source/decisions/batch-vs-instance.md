# 批量渲染 vs 实例化渲染

## 核心区别

| | 批量渲染 (Batch) | 实例化渲染 (Instance) |
|-|-----------------|---------------------|
| 原理 | 合并顶点到共享 GPU buffer | 一个几何体 + 矩阵数组渲染多个实例 |
| 几何体 | 每个图元可以不同 | 所有实例共享同一个 |
| 差异维度 | 顶点/颜色/索引均可不同 | 仅位置/旋转/缩放/颜色不同 |
| Draw Call | 同 batchId 合并为 1 个 | 所有实例合并为 1 个 |
| 内存模型 | ArrayBufferChunk 共享内存 | InstancedBufferAttribute |

## 选择 Batch

适用条件：

- 每个图元的几何体不同（CAD 面片、边线、点云）
- 需要动态修改顶点/颜色/索引
- 需要虚线、箭头等线段特效（BatchLine 独有）
- 需要 LOD（BatchLineDisplay / BatchPointDisplay 内置）

架构：

```
BatchEntity<T>
  ├── BatchLine        ← 线段
  ├── BatchMesh        ← 三角面片
  └── BatchPoint       ← 点

BatchBaseDisplay<T>
  ├── BatchLineDisplay
  ├── BatchMeshDisplay
  └── BatchPointDisplay
```

## 选择 Instance

适用条件：

- 所有图元几何体完全相同（螺栓、标准件、树木）
- 实例之间只有位置/颜色不同
- 不需要修改几何体数据，只更新实例属性

架构：

```
TemplateDisplay         ← 几何体模板
  ├── TemplateLineDisplay
  └── TemplateMeshDisplay

InstanceDisplay         ← 实例管理
  ├── InstanceLineDisplay
  └── InstanceMeshDisplay
```

## 决策流程

1. 图元几何体是否完全相同？
   - 不同 → Batch
   - 相同 → 继续
2. 是否需要动态修改几何体？
   - 是 → Batch
   - 否 → 继续
3. 图元数量是否过万？
   - 是 → Instance
   - 否 → 继续
4. 是否需要虚线/箭头/LOD？
   - 是 → Batch
   - 否 → Instance

## 快速选择指南

| 场景 | 推荐 | 原因 |
|------|------|------|
| CAD 模型面片 | Batch (BatchMesh) | 每个面片几何体不同 |
| CAD 模型边线 | Batch (BatchLine) | 需要虚线、箭头 |
| 点云 | Batch (BatchPoint) | 内置 LOD |
| 大量相同螺栓/标准件 | Instance | 几何体相同，仅位置不同 |
| 测量标注线 | Batch (BatchLine) | 需要箭头和虚线 |
| 粒子效果 | Instance | 大量相同小球 |

## 性能参考

| 场景 | 独立 Entity | Batch | Instance |
|------|------------|-------|----------|
| 1000 个不同面片 | ~1000 Draw Calls | ~1-3 | 不适用 |
| 1000 个相同立方体 | ~1000 | ~1-3 | ~1 |
| 100000 个点 | ~100000 | ~1-2 | ~1 |

## 混合使用

复杂场景可以混用：CAD 模型用 Batch，标准件用 Instance。

## 注意事项

- Batch 的 `batchId` 管理很关键：需要合并渲染的图元必须共享 batchId，错误分配会增加 Draw Call
- Batch 有三档批次大小：SMALL（64KB）、MEDIUM（1MB）、LARGE（16MB）
- BatchLine/BatchPoint 颜色用 `Uint8Array`（0-255），BatchMesh 用 `Float32Array`（0.0-1.0）
- Instance 不支持每个实例不同几何体，需要不同形状必须用 Batch

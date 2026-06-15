# 批量渲染系统

## 架构事实

源码主线：

- `src/model/batch_line.ts`
- `src/model/batch_mesh.ts`
- `src/model/batch_point.ts`
- `fscadweb 模块：core\model\cad\batch\`

两层结构：

- **模型层**：`BatchEntity` -> `BatchLine` / `BatchMesh` / `BatchPoint`，管数据与内存
- **显示层**：`BatchBaseDisplay` -> `BatchLineDisplay` / `BatchMeshDisplay` / `BatchPointDisplay`，管 Three.js 渲染

```
BatchEntity<T>
  ├── BatchLine<T>       -- 线段：子路径、虚线、箭头
  ├── BatchMesh<T>       -- 三角面片：顶点/法线/UV
  └── BatchPoint<T>      -- 点：包围盒、射线拾取

BatchBaseDisplay<E, V>
  ├── BatchLineDisplay   -- 自定义 ShaderMaterial / LineSegments2
  ├── BatchMeshDisplay   -- MeshPhysicalMaterial + status 注入
  └── BatchPointDisplay  -- 自定义 ShaderMaterial + LOD
```

## batchId 共享机制

`_batchId` 是批次的 UUID，核心作用有三：

1. **GPU Buffer 共享**：同一 batchId 的所有 Display 共享同一个 Three.js 渲染对象（viewObj），实现合批渲染
2. **引用计数**：`batchRefCountMap` 追踪每个 batchId 的使用次数，归零时释放 GPU 资源
3. **空间复用**：新图元优先在已有 batchId 对应的批次中分配空间

```
batchId: "uuid-xxx"
  ├── BatchLine entity1  (共享 positionView, indexView)
  ├── BatchLine entity2  (共享同一 GPU Buffer)
  └── BatchLine entity3  (共享同一 GPU Buffer)

对应 Display 层：
  BatchBaseDisplay.batchObjectMap.get("uuid-xxx") -> 同一个 Object3D
```

对下游业务库的含义：

- 如果你的业务实体需要"同一个 draw call 里渲染"，必须让它们共享同一个 batchId
- 如果你需要独立 draw call（比如需要单独控制可见性而不影响其他实体），分配不同的 batchGroupId

## BatchLine 使用

### 基本创建

```typescript
import { Model } from '@fsdev/cadnginx';

const line = new Model.BatchLine({
  vertex: new Float32Array([0, 0, 0, 10, 0, 0, 20, 0, 0]),
  color: 0xff0000,
  lineWidth: 1,
}, entityId);
```

### 虚线

```typescript
line.setDashParam(
  128,    // dashSize (0-255)
  64,     // gapSize (0-255)
  [],     // 子路径索引（空数组=所有路径）
  1,      // dashScaleRatio
  1       // gapScaleRatio
);
```

### 带箭头的线段

```typescript
const arrowLine = new Model.BatchLine({
  vertex: positions,
  vertexIndex: indices,
  color: 0x1a1a1a,
  arrow: {
    enable: true,
    color: 0xff0000,
    getArrowPoints: (line) => [line.getMidPt()],
    precisionEnable: true,
    samplePrecision: 0.2,
  },
}, entityId);
```

### 粗线

当 `lineWidth > 1` 时自动使用 `LineSegments2` + `LineMaterial`（实例化渲染）。

### 子路径

线段通过 `INVALID_INDEX` 分隔为多条子路径。每条子路径可设置独立的虚线参数。通过 `line.pathInfos` 获取 `IPathInfo[]`。

## BatchMesh 使用

```typescript
import { Model, FSCore } from '@fsdev/cadnginx';

const mesh = new Model.BatchMesh({
  vertex: new Float32Array([0, 0, 0, 10, 0, 0, 5, 10, 0]),
  normal: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
  vertexIndex: new Uint32Array([0, 1, 2]),
  color: 0xf3f3f3,
}, entityId, FSCore.Model.BatchSize.MEDIUM);
```

注意事项：

- `color` 格式是 `Float32Array`（0.0-1.0），和 BatchLine 的 `Uint8Array`（0-255）不同
- 未提供 normal 时自动通过 `computeVertexNormals()` 计算

## BatchPoint 使用

```typescript
import { Model } from '@fsdev/cadnginx';

const point = new Model.BatchPoint({
  vertex: positions,
  color: 0x101010,
}, entityId);
```

射线拾取：

```typescript
const result = point.getClosestPointByRay(ray, sqThreshold);
if (result) {
  // result.point, result.distance
}
```

状态位操作：

```typescript
import { FSCore } from '@fsdev/cadnginx';

// bit 0: 可见性, bit 1: 选中状态
statusView[i] = FSCore.Util.NumberBitOps.setBit(statusView[i], 0, 1);  // 设可见
statusView[i] = FSCore.Util.NumberBitOps.setBit(statusView[i], 1, 1);  // 设选中
const isSelected = FSCore.Util.NumberBitOps.getBit(statusView[i], 1);
```

## 批次大小选择

```typescript
export const BatchSize = Object.freeze({
  SMALL:  64 * 1024,         // 64KB  -- 小模型
  MEDIUM: 1024 * 1024,       // 1MB   -- 中型模型
  LARGE:  1024 * 1024 * 16,  // 16MB  -- 大规模场景（默认线段批次大小）
});
```

过大的批次会增加单次分配的内存开销。按场景规模选择。

## 隐藏实现

BatchBaseDisplay 的隐藏不销毁 geometry，而是通过替换索引实现：

```typescript
// 隐藏时：缓存原始索引，填入 INVALID_INDEX
// 显示时：恢复原始索引
```

位置更新使用增量矩阵变换，避免全量重算。

## 合并导出

```typescript
const mergedGeometry = Model.BatchLine.mergeBatchLines([line1, line2, line3]);
scene.add(new THREE.Line(mergedGeometry, material));
```

## 性能参考

| 场景 | 非批量 (Draw Calls) | 批量 (Draw Calls) |
|------|---------------------|-------------------|
| 1000 条线段 | ~1000 | ~1-5 |
| 500 个面片 | ~500 | ~1-3 |
| 100,000 点 | ~100,000 | ~1-2 |

## 对下游业务库的注意点

- 新增业务 Entity 如果需要高性能渲染，优先复用 `Model.BatchLine` / `Model.BatchMesh` / `Model.BatchPoint`
- display 必须注册到业务 canvas 的 `registerDisplayType()`，否则不会渲染
- 不要绕过 batchId 机制直接操作 Three.js geometry，否则引用计数和 GPU Buffer 管理会失真
- 销毁实体时调 `destroy()` 而不是手动清理，否则 batchRefCountMap 不会递减

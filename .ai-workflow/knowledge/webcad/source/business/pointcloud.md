# 点云

## 业务库默认入口

点云相关用法默认走底层 `FSCore`：

- `FSCore.Model.PointCloud`
- `FSCore.Model.PointCloudSlice`
- `FSCore.Util.NumberBitOps`

原因：

- `fscadweb 模块：core\model\cad\pointcloud\pointcloud.ts` 上的点云 API 更完整
- 这里直接提供了 `addPoints()`、`addVoxelizedPoints()`、`addVoxelizedPointsByBuffer()`、`getPointCloudData()`、`voxelizePoints()`
- 当前 `cadnginx` 自己的 `src/model/pointcloud/` 更像显示参数包装层，不应作为业务库默认入口

## 源码用法摘要

- `fscadweb 模块：core\model\cad\pointcloud\pointcloud.ts:30` 定义点级选择模式：`Replace = 0`、`Add = 1`、`Remove = 2`。
- `fscadweb 模块：core\model\cad\pointcloud\pointcloud.ts:54` 通过 `sliceChildren` 只收集 `PointCloudSlice` 子节点。
- `fscadweb 模块：core\model\cad\pointcloud\pointcloud.ts:188`、`:215`、`:251` 分别提供全局点索引反查、按点索引选择、导出已选点索引。
- `fscadweb 模块：core\model\cad\pointcloud\pointcloud_slice.ts:18`、`:36`、`:51`、`:125` 说明 slice 的 `startIndex`、`pointIndexView`、全局点索引到本地 index 映射、已选点索引写出。
- `fscadweb 模块：app\view\three\three_canvas.ts:783`、`:824`、`:890`、`:904` 分别是点云点选、点云框选、删除选中点、裁剪选中点入口。
- `fscadweb 模块：core\worker\userworkers\pointcloud\pointcloud.worker.ts:224`、`:282`、`:300` 是 worker 内部框选、删除、裁剪对 `statusView` 的实际修改。

## 最小用法

```ts
import { CadApp, View, FSApp, FSCore } from '@fsdev/cadnginx';
import * as THREE from 'three';

const app = new CadApp();
const canvas = await app.addView(container, View.Cad3DCanvas, 'main');

const cloud = new FSCore.Model.PointCloud();
cloud.addPoints(
  FSCore.Model.PointCloudSlice,
  new Float32Array([0, 0, 0, 10, 0, 0, 0, 10, 0]),
  0x4a90e2,
  1e5
);

app.addToView(cloud, canvas, FSApp.View.Three.LayerType.Model);
```

## 常用能力

### 直接加点

```ts
cloud.addPoints(FSCore.Model.PointCloudSlice, points, 0x4a90e2, 1e5);
cloud.addPoints(FSCore.Model.PointCloudSlice, points, colors, 1e5);
```

### 体素化

```ts
await cloud.addVoxelizedPoints(
  points,
  colors,
  1,
  1,
  1,
  FSCore.Model.PointCloudSlice
);
```

### 从 buffer 载入

```ts
await cloud.addVoxelizedPointsByBuffer(
  FSCore.Model.PointCloudSlice,
  buffer,
  2,
  2,
  2
);
```

### 剖切与方向着色

```ts
cloud.clippingPlanes = [
  new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
];

cloud.updateColorByDirection(true);
cloud.updateColorDirection(new THREE.Vector3(0, 0, 1));
cloud.updatePointProjectOnDir();
```

### 导出与重采样

```ts
const { points, colors } = cloud.getPointCloudData();
cloud.voxelizePoints(FSCore.Model.PointCloudSlice, 2, 2, 2);
```

## 状态位

```ts
const visible = FSCore.Util.NumberBitOps.getBit(status, 0);
const selected = FSCore.Util.NumberBitOps.getBit(status, 1);
```

当前源码里点云至少有三层“选择”概念，不能混写：

- `Entity / Slice selection`：`PointCloud` 和 `PointCloudSlice` 仍然是 document 里的 entity，`view.select(ids)` / `app.selection.select(ids)` 修改的是 entity 的 `selected` flag。
- `Point-index selection`：全局点索引通过 `PointCloud.selectPointsByIndices(indices, mode)` 映射到 slice 本地 index，再写入 slice 的 `statusView` 第 1 bit。
- `Worker selection`：框选、删除、裁剪等大批量点级操作走 `PointCloudUtil` / pointcloud worker，worker 直接修改传入的 `statusView`。

`statusView` 的高频语义：

- bit 0：点是否可见。`deletePointsBySelected()` 会把已选点的可见 bit 置 0，`clipPointsBySelected()` 会把未选点的可见 bit 置 0。
- bit 1：点是否选中。`selectPointsByIndices()`、`PointCloudSlice.setPointSelectedByLocalIndex()` 和 worker `selectPointsByFrustum()` 都写这个 bit。
- display 刷新依赖 `geometry.attributes.status.needsUpdate = true`。`ThreeCanvas.deletePointsBySelected()`、`clipPointsBySelected()` 和 `PointCloudDisplay.pickArea()` 已经在 worker 返回后更新该 attribute；直接调用模型层 `selectPointsByIndices()` 时要自行确认显示刷新路径。

## 点索引选择

源码支持“全局点索引 -> slice 本地 index -> `statusView`”的闭环：

```ts
const changedCount = cloud.selectPointsByIndices([10, 42, 9001], 1);
const selectedIndices = cloud.getSelectedPointIndices(false);
const pointInfo = cloud.getPointInfoByIndex(42);
```

使用约束：

- `selectPointsByIndices(indices, 0)` 会先 `clearPointSelection()` 再重新选择。
- `selectPointsByIndices(indices, 1)` 是增量选择。
- `selectPointsByIndices(indices, 2)` 是按点索引取消选择。
- 连续 slice 通过 `startIndex + localIndex` 反推全局点索引；带 `pointIndexView` 的体素化/重排 slice 通过 `pointIndexView[localIndex]` 保存原始全局索引。
- `getSelectedPointIndices(includeHidden)` 默认排除不可见点；传 `true` 才会把 hidden/不可见但仍 selected 的点写出。

## 正例

- 业务需要导出用户选中的点时，使用 `cloud.getSelectedPointIndices()`，不要把 `Selection.selectedIds` 当成点索引。
- 外部算法返回的是原始点序号时，使用 `cloud.selectPointsByIndices(indices, mode)`，让源码处理 continuous slice 与 custom `pointIndexView` 的差异。
- 修改点级选择后，确认目标 view 的 `PointCloudSliceDisplay.viewObj.geometry.attributes.status.needsUpdate` 已被置位，或走已有 canvas/worker 方法。

## 反例

- `view.select([pointIndex])`：这里的参数是 entity id，不是点索引。
- 只选择 `PointCloud` 父 entity，却期望 `getSelectedPointIndices()` 自动得到点级选择。
- 体素化后忽略 `pointIndexView`，用 slice 顺序和本地 index 拼出全局点索引。

## Worker Pipeline

点云框选、删除、裁剪是大数据路径，不是普通 `Selection.select()` 的纯 entity 操作：

1. `ThreeCanvas.pickPointCloudArea(box, selectMode)` 用屏幕框创建 frustum，过滤 `PointCloudDisplay`。
2. `PointCloudDisplay.pickArea(frustum, selectMode, selectSet, unSelectSet)` 收集 slice 的 `positionView` 和 `statusView`。
3. `PointCloudUtil.selectPointsByFrustum(...)` 创建 worker session，调用 pointcloud worker。
4. worker 按 frustum、clippingPlanes、可见 bit 和 `selectMode` 修改 `statusView` 第 1 bit。
5. display 将 `geometry.attributes.status.needsUpdate` 置为 `true`，并把有选中点的 slice id 加入 `selectSet`，把没有选中点的 slice id 加入 `unSelectSet`。

删除和裁剪同样只改变点级 `statusView`：

- `ThreeCanvas.deletePointsBySelected(sliceList)` 把指定 slice 的 `statusView` 交给 worker，worker 将 selected 点的 visible bit 清 0。
- `ThreeCanvas.clipPointsBySelected()` 遍历 document 中所有 `PointCloudSlice`，worker 将未 selected 点的 visible bit 清 0。
- 两者都不会删除 `PointCloudSlice` entity 本身，也不会把点索引从 typed array 中物理移除。

## Pick 边界

普通实体 pick 与点云 pick 的入口不同：

- 普通实体：`ThreeCanvas.pick(...)` / `pickArea(...)` 走 `ColorPickContext` 或 ray pick，并通过 pick result id 映射回 display/entity。
- 点云点选：`ThreeCanvas.pickPointCloud(...)` 用 ray 与 `PointCloudDisplay.boundingBox` / slice `boundingBox` 相交，再找最近点。
- 点云 slice display 的 `createPickObject()` 当前返回 `undefined`，所以不能假设点云点级拾取会天然进入普通 GPU pick。

点云 pick / selection 风险详见 `../pitfalls/pointcloud-pick-selection.md`。

## 审查清单

- 是否还在优先生成 `Model.PointCloud`
- 是否忘了 `addVoxelizedPoints*` 是异步方法
- 是否错误把点云写成 `cadnginx` 自己的包装层 API
- 是否在业务层重复实现 `FSCore` 已有的点云切片和体素化流程
- 是否区分了 entity/slice selection、point-index selection、`statusView` bit、worker selection
- 是否把 point index 当成 entity id 传给 `view.select(...)`
- 是否说明直接改 `statusView` 后的 display attribute 刷新路径
- 是否把点云 pick 误写成普通 GPU pick

## 最小验证

- 调用 `cloud.selectPointsByIndices([...], mode)` 后，确认 `getSelectedPointIndices()` 返回的全局点索引与输入一致。
- 对带 `pointIndexView` 的 slice 执行一次点级选择，确认导出的索引仍是原始全局点索引而不是本地 index。
- 执行一次 `pickPointCloud(...)` 和一次 `pickPointCloudArea(...)`，确认点选与框选都走点云专用路径，而不是普通 entity GPU pick。
- 执行一次 `deletePointsBySelected()` 或 `clipPointsBySelected()`，确认只修改点级 `statusView`，不会删除 `PointCloudSlice` entity。

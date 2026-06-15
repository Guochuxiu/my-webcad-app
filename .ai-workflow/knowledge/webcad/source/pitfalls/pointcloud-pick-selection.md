# 点云 Pick 与点级 Selection

## 源码用法摘要

- `fscadweb 模块：app\view\three\three_canvas.ts:755` 普通 `pick(...)` 可走 GPU pick 或 ray pick。
- `fscadweb 模块：app\view\three\three_canvas.ts:783` `pickPointCloud(...)` 用 ray、点云 display 包围盒和 closest point 做点云点选。
- `fscadweb 模块：app\view\three\three_canvas.ts:824` `pickPointCloudArea(...)` 用屏幕框创建 frustum 并调用 `PointCloudDisplay.pickArea(...)`。
- `fscadweb 模块：app\view\three\display\pointcloud\pointcloud_slice.ts:159` `PointCloudSliceDisplay.createPickObject()` 当前返回 `undefined`。
- `fscadweb 模块：app\view\three\display\pointcloud\pointcloud.ts:49` `PointCloudDisplay.getClosestPoint(...)` 在可见 slice 中按 ray 找最近点。
- `fscadweb 模块：core\model\cad\pointcloud\pointcloud_slice.ts:150` `PointCloudSlice.getClosestPointByRay(...)` 返回 `pointIndex`、`batchIndex`、`localIndex`。
- `fscadweb 模块：core\model\cad\pointcloud\pointcloud.ts:215` `selectPointsByIndices(...)` 写点级选择 bit。
- `fscadweb 模块：app\view\three\three_view_observer.ts:58`、`:86`、`:125` 是默认 observer 的框选、hover、click 路径。

## 核心风险

点云不是普通 GPU pick 的子集。普通 `pick(...)` 返回 display/entity id；点云 `pickPointCloud(...)` 返回最近点信息，点级选择状态写在 `PointCloudSlice.statusView` 的 selected bit 上。

当前 `PointCloudSliceDisplay.createPickObject()` 返回 `undefined`，所以“点云可渲染”不等于“点云点级对象能被 GPU pick”。如果方案把点云点选写成“给 slice display 补 pickColor 后普通 pick 即可”，必须先回到源码确认当前 display 是否真的生成 pick object。

## 普通 GPU Pick 与点云 Pick

普通对象：

- `ThreeCanvas.pick(pos)` 默认 `useGpuPick: true`，单选时调用 `gpuPick(...)`，多选时调用 `pickContext.pick(...)`。
- `ThreeCanvas.pickArea(box)` 走 `ColorPickContext.pickArea(...)`，返回 pick result id。
- `ThreeViewObserver._getPickList(id)` 再通过 display 找 entity，检查 `entity.canSelect()` 和 `shouldPickParent`。

点云：

- `ThreeCanvas.pickPointCloud(pos)` 先把屏幕坐标转为 camera ray。
- 只遍历 `PointCloudDisplay`，并过滤 hidden 的点云 entity。
- ray 先与点云 display 的 bounding box 相交，再由 `PointCloudDisplay.getClosestPoint(...)` 在 slice bounding box 和 draw range 内找最近点。
- `PointCloudSlice.getClosestPointByRay(...)` 会把 batch index 转为 slice local index 和全局 point index。
- 默认 `ThreeViewObserver._onMove(...)` 用 `pickPointCloud(pos)[0]` 更新点 hover 指示器，但 `_onClick(...)` 当前只是调用后丢弃结果，并没有把最近点写入点级 selection。

## 点级 Selection

点云点级 selection 有两种常见入口：

- 外部点索引：`PointCloud.selectPointsByIndices(indices, mode)`，通过全局点索引找到 slice 本地 index，再写 `statusView` 第 1 bit。
- 框选：`ThreeCanvas.pickPointCloudArea(box, mode)` -> `PointCloudDisplay.pickArea(...)` -> worker `selectPointsByFrustum(...)`，按 frustum 和 clippingPlanes 写 `statusView` 第 1 bit。

点云框选还会把“有点被选中”的 slice entity id 放入 `selectSet`，再由 observer 调 `view.select(...)`。这一步是为了让普通 selection 系统知道哪些 slice/entity 处于选中态；它不是点索引本身。

## 正例

- 点云点选需求先说明结果是“最近点信息”“slice entity selection”还是“点索引 selection”。
- 用 `pickPointCloud(...)` 获取最近点后，如果要持久化点级选择，再调用 `selectPointsByIndices([pointIndex], mode)` 并刷新 display 的 `status` attribute。
- 框选点云优先走 `pickPointCloudArea(...)` 和 worker pipeline，不在主线程逐点遍历大型 typed array。
- 普通 entity 的 hover/click 仍走 `pick(...)` + `_getPickList(...)`，保持 `canSelect()` 与 `shouldPickParent` 规则。

## 反例

- 假设 `PointCloudSliceDisplay.createPickObject()` 会参与普通 GPU pick。
- 把 `pickPointCloud(pos)[0].pointIndex` 直接传给 `view.select(...)`。
- 只更新 slice entity selected flag，却声称完成了点级 selection。
- 在 `_onClick(...)` 里调用 `pickPointCloud(...)` 后不处理返回值，却声称点击会选中点。
- 自己在主线程写 frustum 点遍历，绕开 `PointCloudUtil.selectPointsByFrustum(...)` 和 worker session。

## 审查清单

- 是否明确区分普通 pick result id、slice entity id、全局 point index、slice local index。
- 点级选择是否写 `statusView` 第 1 bit，而不是只写 entity selected flag。
- 删除/裁剪是否说明只改 visible bit，不会删除 slice entity 或压缩点数组。
- 直接修改点级状态后，是否说明 `geometry.attributes.status.needsUpdate` 的刷新路径。
- 点云 click、hover、box-select 是否各自说明使用 `pickPointCloud`、`pickPointCloudArea` 还是普通 `pick`。

## 最小验证

- 构造两个 `PointCloudSlice`，一个使用连续 `startIndex`，一个带 `pointIndexView`；调用 `selectPointsByIndices([globalIndex])` 后验证只有对应 slice 的本地 `statusView` 第 1 bit 变化。
- 调用 `getSelectedPointIndices(false)`，验证返回的是全局点索引，不是 entity id。
- 在已有 view 中执行一次 `pickPointCloud(pos)`，验证返回对象包含 `point`、`pointIndex`、`localIndex` 或在无命中时为空数组。
- 框选后检查被影响 slice 的 display `geometry.attributes.status.needsUpdate === true`，并验证 `view.select(...)` 收到的是 slice/entity id。


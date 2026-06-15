# GPU Pick 与 ID 颜色映射

## 风险

业务需求只要涉及点选、框选、hover、右键删除、通过图形反查 entity，就必须确认 pick 链是否仍然携带稳定的 entity 身份。

## 当前源码信号

- `SnapEngine.snap()` 依赖 `view.pickObjects(screenPt)` 的结果
- 点云切片 display 会给 geometry 注入 `pickColor` attribute
- Transform gizmo 也有独立 pick object
- 源码位置：`src/snap/snap_engine.ts:39`、`src/display/pointcloud/pointcloud_slice_display.ts:227`、`src/gizmo/transformgizmo/display/axis_handle_display.ts:366`

## 点云差异

当前 `fscadweb 模块` 里的点云点级 pick 不能按普通 GPU pick 推断：

- `fscadweb 模块：app\view\three\display\pointcloud\pointcloud_slice.ts:159` 的 `PointCloudSliceDisplay.createPickObject()` 返回 `undefined`。
- `fscadweb 模块：app\view\three\three_canvas.ts:783` 的 `pickPointCloud(...)` 走 ray、点云 display bounding box、slice bounding box 和 closest point。
- `fscadweb 模块：app\view\three\three_canvas.ts:824` 的 `pickPointCloudArea(...)` 走 frustum + worker selection，而不是普通 `pickArea(...)` 的颜色 id 路径。

因此点云需求要同时补读 `pointcloud-pick-selection.md`。不要把 `pickColor` attribute 或 batch pick 经验直接套到点云点级选择上。

## 对业务库的含义

- 不要把“能渲染出来”误认为“能被正确拾取”
- 只增加显示材质、不补 pick 代理对象时，交互经常是不完整的
- 如果业务对象需要反查 entity，必须保证 pick 结果仍能映射回业务对象或其代理
- 点云点级结果要区分 `pointIndex`、`localIndex`、slice entity id 和普通 pick result id

## 设计与实现要求

- 方案里涉及拾取时，要明确 pick 结果如何映射回业务 entity
- 自定义 display 如果引入独立的 pick mesh、instancing、batch 或 shader attribute，必须同步设计 pick 身份编码
- 不能默认假设透明材质、合并 mesh、批渲染之后 pick 语义仍然正确

## 审查问题

- hover 和 click 是否走的是同一条身份映射链
- 自定义对象是否只有 render object，没有对应 pick object
- 业务对象销毁后，pick 代理是否同步清理
- 点云是否错误依赖普通 GPU pick，而没有说明 ray/bbox/closest point 或 worker 框选路径

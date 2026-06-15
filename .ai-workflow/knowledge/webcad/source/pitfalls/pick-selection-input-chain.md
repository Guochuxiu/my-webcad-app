# Pick / Selection / InputStack 交互链

## 源码用法摘要

- `fscadweb 模块：app\view\three\three_canvas.ts:755` 普通 `pick(...)` 支持 GPU pick 和 ray pick。
- `fscadweb 模块：app\view\three\three_canvas.ts:884` `pickArea(...)` 进入 `ColorPickContext.pickArea(...)`。
- `fscadweb 模块：app\view\three\three_view_observer.ts:58` 框选释放时先普通 `pickArea(...)`，再异步 `pickPointCloudArea(...)`。
- `fscadweb 模块：app\view\three\three_view_observer.ts:86` move 时分别处理点云 hover indicator 与普通 entity hover。
- `fscadweb 模块：app\view\three\three_view_observer.ts:125` click 时普通 pick 结果进入 `view.select(...)`。
- `fscadweb 模块：app\view\three\three_view_observer.ts:141` `_getPickList(...)` 检查 display、`canSelect()`、`shouldPickParent`。
- `fscadweb 模块：app\selection\Selection.ts:48`、`:89`、`:129` 分别是 select、hover、resetAll。
- `fscadweb 模块：app\inputstack.ts:30`、`:56`、`:70` 是 observer 插入、键盘派发、鼠标派发。
- `cadnginx 模块：snap\snap_engine.ts:39` snap 会临时改 pick size 后调用 `view.pickObjects(screenPt)`。

## 核心风险

WebCAD 交互链不是“DOM event -> 直接改模型”。默认路径会跨过 inputStack、observer、pick、selection、display dirty、command/snap 等多个层次。只看其中一个层次，很容易出现 hover 和 click 身份不一致、点云和普通对象混选、右键/快捷键被别的 observer 截断、或者 selection 内部 set 残留。

## 运行时链路

典型普通对象点选：

1. 鼠标事件进入当前 view 的 `inputStack.processMouseEvent(...)`。
2. `ThreeViewObserver._onClick(...)` 调用 `this._view.pick(pos)[0]`。
3. `_getPickList(pickResult.id)` 用 display id 找 display/entity。
4. `_getPickList(...)` 调用 `entity.canSelect()`，并按 `shouldPickParent` 向父级回溯。
5. `this._view.select(ids)` 进入 app selection，最终由 `Selection.select(...)` 写 entity selected flag 并派发 signal。

典型框选：

1. `_onLButtonDown(...)` 记录 selection box 起点。
2. `_onMove(...)` 超过阈值后激活 selection box。
3. `_onLButtonUp(...)` 对普通对象调用 `pickArea(...)`，过滤 `ignoreBoxSelect`，再用 `_getPickList(...)` 归一化 entity id。
4. 同一释放流程还会异步调用 `pickPointCloudArea(...)`，把有选中点的点云 slice id 合并进 selection。

典型 hover：

1. `_onMove(...)` 先尝试 `pickPointCloud(pos)[0]` 更新点 hover 指示器。
2. 再走普通 `pick(pos)[0]`，并调用 `view.hover(...)`。
3. 如果没有普通 pick 命中，调用 `view.hover([])` 清空 hover。

## Selection 注意点

- `Selection.select(idList, recursion, entityFilter)` 的 id 是 entity id，不是点索引、batch id 或 pick color。
- `Selection.select(...)` 会过滤不存在的 entity，并递归加入子节点 id。
- `Selection.hover(...)` 与 `select(...)` 有各自的 set 和 signal。
- `Selection.resetAll()` 只遍历 document root 清 selected/hover flag；当前源码没有清空 `_selectSet` 和 `_hoverSet`。
- `Selection.refresh()` 会用 `_selectSet` 重新 select，因此不要把 `resetAll()` 当作彻底清空 selection set。

## 正例

- 新 observer 先说明挂在 `getViewObserver()` 还是 `inputStack.addObserver(...)`，并说明 priority。
- 普通 pick 结果进入 selection 前统一走当前仓库的 id 映射逻辑，保留 `canSelect()` 与 `shouldPickParent`。
- hover 与 click 使用同一套实体身份归一化规则。
- 点云使用 `pickPointCloud(...)` / `pickPointCloudArea(...)`，普通对象使用 `pick(...)` / `pickArea(...)`，不要混同返回值。
- snap 需求同时检查 `SnapEngine.snap()` 对 pick size 的临时修改和 `pickObjects(...)` 返回结构。

## 反例

- 在 canvas DOM 上直接 `addEventListener` 后修改模型或 selection，绕开 `inputStack`。
- 把 GPU pick color、batch index、point index 当成 entity id 传给 `view.select(...)`。
- hover 用 display id，click 用 parent entity id，导致同一图形 hover 与 click 对象不同。
- 依赖 `Selection.resetAll()` 清空内部 set。
- 在 observer 里直接改业务模型，绕开 command/handle，又没有说明取消和 cleanup。

## 审查清单

- 输入事件是否进入当前 view 的 `inputStack`，还是被 DOM listener/全局快捷键绕开。
- observer priority、反向遍历、consumed 短路是否会让目标 observer 永远收不到事件。
- pick 返回值进入 selection 前是否完成 entity 身份归一化。
- `canSelect()`、`shouldPickParent`、hidden/unselectable/removed 等状态是否被检查。
- 普通对象 pick 与点云 pick 是否分开说明。
- selection 清空逻辑是否真的清 set，而不是只清 entity flag。

## 最小验证

- 在一个普通 entity 和一个 `shouldPickParent = true` 子 entity 上分别 click，验证最终 selected id 是预期 entity。
- 将 entity 标为 unselectable 后 click，验证 `_getPickList(...)` 返回空选择。
- 执行 hover 后再空白移动，验证 `Selection.hovered` 和 hover flag 均回到预期状态。
- 调用 `Selection.resetAll()` 后再 `refresh()`，验证是否出现旧 `_selectSet` 重新选中；如果出现，修订方案不能依赖 `resetAll()` 做彻底清空。
- 对同一框选区域同时包含普通对象和点云 slice 的场景，验证普通 entity id 与点云 slice id 合并后进入 `view.select(...)`，点级状态仍在 `statusView`。


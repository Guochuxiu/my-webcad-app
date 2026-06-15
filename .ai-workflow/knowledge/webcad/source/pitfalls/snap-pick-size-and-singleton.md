# Snap pick size 与单例风险

## 源码用法摘要

- `cadnginx 模块：snap\snap_engine.ts:10`：`SNAP_PICK_SIZE = 35`，`DEFAULT_PICK_SIZE = 25`。
- `cadnginx 模块：snap\snap_engine.ts:15`：`SnapEngine` 使用静态 `_instance`。
- `cadnginx 模块：snap\snap_engine.ts:29`：`getInstance(...)` 只在实例不存在时使用传入 view 创建。
- `cadnginx 模块：snap\snap_engine.ts:39`：`snap(screenPt)` 是 pick size 被临时修改的入口。
- `cadnginx 模块：snap\snap_engine.ts:41`：调用 `view.setPickSize(SNAP_PICK_SIZE)`。
- `cadnginx 模块：snap\snap_engine.ts:42`：调用 `view.pickObjects(screenPt)`。
- `cadnginx 模块：snap\snap_engine.ts:43`：调用 `view.setPickSize(DEFAULT_PICK_SIZE)`。
- `cadnginx 模块：snap\snap_processor.ts:47`：策略优先级排序仍是 TODO。
- `cadnginx 模块：snap\snap_strategy.ts:13`：策略输入允许 `(IPickResult | number)[]`。

## 风险说明

`SnapEngine` 同时具备两个高风险点：

- **静态单例**：首次 `getInstance(viewA, ...)` 后，后续 `getInstance(viewB, ...)` 不会把内部 `view` 改成 viewB。
- **pick size 修改**：`snap(...)` 会把 view pick size 改成 `SNAP_PICK_SIZE`，pick 后固定恢复为 `DEFAULT_PICK_SIZE`。如果 pick 抛错，或业务 view 原本不是默认 pick size，就可能遗留错误拾取范围。

这两个点叠加后，多 view、重复打开页面、连续命令、异常取消时特别容易出现“捕捉命中了旧 view”或“pick 范围变大/变小后不恢复”。

## 正例

```ts
const snapEngine = Snap.SnapEngine.getInstance(canvas, strategyPriorityMap);

try {
  const result = snapEngine.snap(screenPt);
  return result;
} finally {
  // 当前源码 snap() 会恢复到 DEFAULT_PICK_SIZE；如果业务 view 有自定义 pick size，在这里恢复业务期望值。
  canvas.setPickSize(businessPickSize);
}
```

适用条件：

- 业务确实改变过默认 pick size。
- 当前命令可能在 pick、策略计算或后续流程中抛异常。
- 同一页面存在多个 view 或复用 view tag。

## 反例

```ts
// 第二次传 viewB 不会让静态 SnapEngine 重新绑定到 viewB。
const snapA = Snap.SnapEngine.getInstance(viewA, priorities);
const snapB = Snap.SnapEngine.getInstance(viewB, priorities);

// 这里仍可能使用首次创建时的 viewA。
snapB.snap(screenPt);
```

问题：

- 把静态单例当成 per-view 实例。
- 策略和 keyPoints 也可能继续污染下一次命令。
- 多 view 下 pick 结果、坐标系和 display identity 可能错位。

## 审查清单

- 是否说明 `SnapEngine.getInstance(...)` 是静态单例，不能默认 per-view。
- 当前需求是否存在多 view、同 tag view 复用、并行 canvas 或热切换。
- 是否有临时 keyPoints；结束、取消、异常时是否 `removeKeyPoints()`。
- 是否修改了 pick size；异常路径是否恢复业务期望值。
- 是否把 `SnapStrategyFactory.getSnapPoint(...)` 写成已按 priority 排序。
- 自定义策略是否处理 `pickResults` 中的纯 `number`。
- 策略注册是否通过 `registerStrategyType(...)` 或当前仓库已有封装，而不是散落在 command 分支里。

## 最小验证

- 用 viewA 首次创建 `SnapEngine`，再传 viewB 调用 `getInstance(...)`，确认方案没有依赖重绑 view。
- mock 或断点验证 `snap(...)` 调用顺序是 `setPickSize(SNAP_PICK_SIZE)`、`pickObjects(...)`、`setPickSize(DEFAULT_PICK_SIZE)`。
- 让 `pickObjects(...)` 或策略抛错，验证业务保护层能恢复 pick size。
- 注册自定义策略后，`getSnapStrategy(type)` 返回该策略。
- command finish/cancel 后再次 snap，不再命中上一轮临时 keyPoints。

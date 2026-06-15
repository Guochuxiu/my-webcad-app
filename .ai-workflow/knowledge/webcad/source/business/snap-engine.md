# 捕捉引擎

## 关键事实

- `SnapEngine.getInstance(view, strategyPriorityMap)` 是静态单例
- 首次创建后，后续调用不会重新绑定 view
- `SnapEngine.snap(screenPt)` 会先把当前 view 的 pick size 改成 `SNAP_PICK_SIZE`，调用 `view.pickObjects(screenPt)` 后再设置为 `DEFAULT_PICK_SIZE`
- 当前源码没有 `try/finally`，也不是读取原 pick size 后恢复；异常路径或业务自定义 pick size 需要额外审查
- `src/snap/snap_processor.ts` 里的策略容器类名是 `SnapStrategyFactory`
- `SnapStrategyFactory.getSnapPoint()` 当前直接返回展开结果的第一个值，源码里仍有 `TODO`，不要写成“已按优先级排序”
- `SnapStrategy.snap(...)` 的 `pickResults` 类型是 `(IPickResult | number)[]`，策略实现不能假设每一项都有 `id/pickObj`

## 源码用法摘要

- `cadnginx 模块：snap\snap_engine.ts:13`：`SnapEngine` 持有静态 `_instance`。
- `cadnginx 模块：snap\snap_engine.ts:17`：构造函数把传入 view 保存到 `this.view`。
- `cadnginx 模块：snap\snap_engine.ts:29`：`getInstance(view, strategyPriorityMap, keyPoints?)` 只在 `_instance` 不存在时创建实例。
- `cadnginx 模块：snap\snap_engine.ts:39`：`snap(screenPt)` 是捕捉入口。
- `cadnginx 模块：snap\snap_engine.ts:41`：捕捉前调用 `view.setPickSize(SNAP_PICK_SIZE)`。
- `cadnginx 模块：snap\snap_engine.ts:42`：通过 `view.pickObjects(screenPt)` 取 pick results。
- `cadnginx 模块：snap\snap_engine.ts:43`：捕捉后调用 `view.setPickSize(DEFAULT_PICK_SIZE)`。
- `cadnginx 模块：snap\snap_engine.ts:53`：`registerKeyPoints(...)` 更新 KEY_POINT 策略的关键点。
- `cadnginx 模块：snap\snap_processor.ts:18`：`SnapStrategyFactory` 保存策略 map。
- `cadnginx 模块：snap\snap_processor.ts:21`：`registerStrategy(...)` 按策略类型创建默认策略。
- `cadnginx 模块：snap\snap_processor.ts:26`：`registerStrategyType(...)` 可替换或注册自定义策略实例。
- `cadnginx 模块：snap\snap_processor.ts:38`：`getSnapPoint(...)` 遍历 active 策略。
- `cadnginx 模块：snap\snap_processor.ts:47`：源码 TODO 表明优先级排序尚未实现。
- `cadnginx 模块：snap\snap_strategy.ts:8`：自定义策略继承 `SnapStrategy`。
- `cadnginx 模块：snap\snap_strategy.ts:13`：`snap(pickResults, screenPt)` 返回 `SnapResult[]`。

## 最小用法

```ts
import { Snap, FSMath } from '@fsdev/cadnginx';

const priorities = new Map([
  [Snap.SNAP_STRATEGY_TYPE.KEY_POINT, 1],
]);

const snapEngine = Snap.SnapEngine.getInstance(canvas, priorities);
const result = snapEngine.snap(new FSMath.Vector2(x, y));
```

## 生命周期和注册链

1. **实例绑定**：`getInstance(...)` 是全局静态单例，首次传入的 view 会被保存在 `SnapEngine.view`。多 view 场景下不要假设每个 view 都有独立捕捉实例。
2. **策略注册**：默认构造只注册 `KEY_POINT` 策略；业务策略应通过 `registerStrategyType(...)` 或当前仓库已有封装接入 `SnapStrategyFactory`。
3. **关键点更新**：临时关键点使用 `registerKeyPoints(...)` / `removeKeyPoints()`，命令结束或取消时要移除，避免下一次命令复用旧关键点。
4. **pick size**：`snap(...)` 临时放大 pick size，但源码恢复为固定 `DEFAULT_PICK_SIZE`；如果 view 使用了业务自定义 pick size，调用 snap 前后要验证实际恢复行为。
5. **结果选择**：当前 `getSnapPoint(...)` 只是收集 active 策略结果并返回第一个展开结果，不要把文档或方案写成“按 priority 自动选择最优”。

## 自定义策略

```ts
import { Snap } from '@fsdev/cadnginx';

class BusinessSnapStrategy extends Snap.SnapStrategy {
  snap(pickResults, screenPt) {
    return [];
  }
}

snapEngine.registerStrategyType(
  Snap.SNAP_STRATEGY_TYPE.KEY_POINT,
  new BusinessSnapStrategy(1, 10, canvas, true)
);
```

策略实现要求：

- 输入使用 `pickResults` 和 `screenPt`，不要自行再触发一套不受控 pick。
- 先判断 `typeof item === 'number'`，再访问 `IPickResult` 字段。
- 返回世界坐标、屏幕坐标或实体引用时，以当前 `SnapResult` 类型为准，不要发明额外字段。
- `active/priority/threshold/view` 由 `SnapStrategy` 构造函数保存，业务策略要按真实构造参数传入。

## 正例

- 命令开始时创建或获取 snap engine，并明确这是静态单例；命令结束时清理临时 key points。
- 自定义策略通过 `registerStrategyType(...)` 接入，而不是在命令内部散落判断。
- 对业务临时 pick size 做保护性验证：snap 前记录预期值，snap 后检查是否需要恢复业务配置。
- 文档或方案明确说“当前源码还没有按 priority 排序”，避免误导后续实现。

## 反例

- 在每个 command 中 `new SnapEngine(...)`，绕开单例和策略注册链。
- 在多 view 中反复调用 `getInstance(viewB, ...)`，却以为内部 view 已从 viewA 切换到 viewB。
- 修改 pick size 后异常返回，没有恢复；或者以为 `snap(...)` 会恢复调用前的任意 pick size。
- 自定义策略假设 `pickResults[0].pickObj` 一定存在，遇到纯 `number` pick id 崩溃。
- 声称 `priority` 已决定最终结果顺序，但未改 `SnapStrategyFactory.getSnapPoint(...)`。

## 审查清单

- 多视图场景下是否误以为每个 view 都有独立 `SnapEngine`
- 是否错误地通过 `view.snapProcessor` 访问策略
- 是否把返回结果写成“已按优先级排序”
- 是否在自定义策略里忽略了 `pickResults` 里可能出现的纯 `number`
- 是否考虑 `snap(...)` 的 pick size 恢复是固定 `DEFAULT_PICK_SIZE`，不是原值恢复
- 临时 key points 是否在 command cancel/cleanup 后 `removeKeyPoints()`

## 最小验证

- 同一进程先后用两个 view 调用 `SnapEngine.getInstance(...)`，确认业务方案没有依赖第二次重绑 view。
- 执行一次 snap，观察 `view.pickObjects(screenPt)` 被调用前 pick size 为 `SNAP_PICK_SIZE`，结束后为 `DEFAULT_PICK_SIZE`。
- 自定义策略注册后，`getSnapStrategy(type)` 能取回对应策略实例。
- 传入包含 `number` 和 `IPickResult` 的 pickResults，策略不抛异常。
- command cancel/finish 后临时 key points 不影响下一次 snap。

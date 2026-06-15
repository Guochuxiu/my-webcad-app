# InputStack 与 Observer 顺序

## 源码用法摘要

- `fscadweb 模块：app\inputstack.ts:6` 定义 `IInputObserver`，包括 `priority`、键盘、鼠标和 tick 方法。
- `fscadweb 模块：app\inputstack.ts:30` `addObserver(...)` 按 priority 插入 observer。
- `fscadweb 模块：app\inputstack.ts:42` `removeObserver(...)` 只移除同一个 observer 实例。
- `fscadweb 模块：app\inputstack.ts:56` `processKeyboardEvent(...)` 从 stack 末尾反向遍历。
- `fscadweb 模块：app\inputstack.ts:70` `processMouseEvent(...)` 同样反向遍历，并在 consumed 后短路。
- `fscadweb 模块：app\view\three\three_canvas.ts:308` 默认 three view 构造时创建 observer 并 `inputStack.addObserver(this.observer)`。
- `fscadweb 模块：app\view\three\three_canvas.ts:501` 默认 `getViewObserver()` 返回 `new ThreeViewObserver(this)`。

## 核心事实

`InputStack.addObserver(...)` 会把 observer 按 priority 升序放入 `_observerStack`；键盘和鼠标事件派发时从数组末尾向前遍历。因此在当前源码中：

- 数值更大的 `priority` 通常更早收到键盘和鼠标事件。
- 相同 priority 下，后加入的 observer 位于更靠后的位置，通常更早收到键盘和鼠标事件。
- 任一 observer 返回 `true` 后，`consumed` 变为 true，后续更低顺序的 observer 不再收到该事件。
- `tick(deltaTime)` 是正向遍历，没有 consumed 短路。

## 挂接选择

- 主交互 observer：优先覆盖目标 canvas 的 `getViewObserver()`，让 view 构造时统一加入 inputStack。
- 临时工具、gizmo、命令态输入：可以用 `inputStack.addObserver(...)`，但必须说明 priority、生命周期和 `removeObserver(...)`。
- 只需要被动显示更新的逻辑不要注册 input observer；优先监听模型/selection/camera signal，并在 cleanup 中解除。

## 正例

- 新 observer 注明 priority，并说明它应该先于还是后于默认 `ThreeViewObserver`。
- 临时 observer 在命令结束、取消、view cleanup 时调用 `inputStack.removeObserver(observer)`。
- 捕获事件时只在确实完成处理后返回 `true`；需要让默认 selection 继续工作时返回 `false`。
- 键盘与鼠标都走 inputStack，避免一部分输入由 DOM listener 处理、一部分由 observer 处理。

## 反例

- 用默认 priority 加入临时 observer，却没有确认它和默认 observer 的先后关系。
- observer 总是返回 `true`，导致默认 click selection、hover、camera controller 或 command 输入被截断。
- 使用匿名新对象注册 observer，cleanup 时无法拿到同一实例执行 `removeObserver(...)`。
- 假设 `addObserver(...)` 后事件按数组正向执行。
- 只解除 DOM listener，不解除 inputStack observer。

## 审查清单

- 是否列出 observer 的挂接入口：`getViewObserver()` 或 `inputStack.addObserver(...)`。
- priority 是否符合“高 priority 先处理”的当前源码行为。
- consumed 返回值是否会阻断默认 observer、controller、command 或 gizmo。
- 相同 priority 多 observer 的加入顺序是否影响结果。
- 临时 observer 是否有确定的 remove/cleanup 路径。
- 多 view 复用时 observer 是否绑定当前 view 实例，而不是静态缓存旧 view。

## 最小验证

- 准备两个测试 observer：priority 1 和 priority 10；分别记录 `processMouseEvent(...)` 调用顺序，验证 priority 10 先收到事件。
- 让 priority 10 observer 返回 `true`，验证 priority 1 observer 不再收到同一次 mouse/keyboard 事件。
- 让两个 observer 使用相同 priority，验证后 add 的 observer 先处理事件。
- 调用 `removeObserver(observer)` 后再次派发事件，验证该 observer 不再被调用。
- 重复创建/销毁同 tag view，验证没有旧 observer 重复响应。


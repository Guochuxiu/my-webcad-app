# 键盘输入桥接

## 风险

业务命令里一旦依赖 `Enter`、`Esc`、数字键、快捷键、右键结束绘制，如果键盘事件没有进入当前 view 的 `inputStack`，命令就会表现为“看起来已创建，但不响应输入”。

## 当前源码事实

- `Cad3DCanvas._registerHotkey()` 会把 `numberHotkeys` 通过 `Mousetrap.bind()` 绑定到 `inputStack.processKeyboardEvent()`
- 源码位置：`src/view/cad_3d_canvas.ts:134`

## 对业务库的含义

- 不能假设任何新命令都天然拿得到完整键盘输入
- 自定义快捷键时，要先核实当前画布是否真的在激活输入状态
- 多视图复用时，要特别检查旧 view 复用后热键、observer、input 绑定是否仍然指向当前实例

## 设计与实现要求

- 方案里只要出现 `Enter`、`Esc`、快捷键、连续绘制，就把“键盘桥接是否存在”列为显式检查项
- 代码实现里如果新增键盘交互，必须说明事件从哪里进来，最终如何进入命令
- code review 时，不能只看命令类本身，还要看 view/input 注册链

## 审查问题

- 当前命令依赖的按键，是否真的会被转发到 `inputStack`
- 热键是否在 cleanup 时解除
- 多视图或重建 renderer 后，热键是否仍绑定在正确对象上

# 交互式命令 vs 立即执行命令

## 核心区别

| | 交互式命令 | 立即执行命令 |
|-|-----------|------------|
| 触发 | 用户在视图中交互（鼠标点击、移动） | UI 按钮或代码直接调用 |
| 执行时间 | 跨多个事件循环 | 同步完成 |
| 生命周期 | onExecute → onReceive(x N) → commit/cancel → onCleanup | onExecute → commit → onCleanup |
| 预览 | 通常有 Temp 层预览 | 无预览 |
| 命令栈 | 进入命令栈，可被 ESC/右键取消 | 不进入或瞬时 |

## 选择交互式命令

适用场景：

- 绘制命令：画线、画面、画圆
- 测量命令：测量距离、角度
- 编辑命令：需要逐步选择对象
- 拾取命令：需要在视图中选择特定实体

关键实现要点：

- `onReceive` 路由鼠标/键盘消息到具体处理函数
- 预览实体必须放在 `LayerType.Temp` 层
- `onCleanup` 中必须清除 Temp 层
- 复杂交互用状态机模式管理步骤（enum 状态 → 每个状态一个 handler）

消息路由模板：

```
onReceive(msg, param, fnKey):
  L_BUTTON_DOWN → 步骤处理
  MOUSE_MOVE    → 预览更新
  R_BUTTON_DOWN → cancel()
  KEY_DOWN + Escape → cancel()
```

## 选择立即执行命令

适用场景：

- 文件加载
- 视图切换、重置视角
- 删除选中实体
- 批量修改属性
- 导出操作

关键实现要点：

- `onExecute` 中直接执行操作，然后 `commit()`
- `onReceive` 通常返回 false
- 有异步操作时必须用 `freezeProcess()` / `unfreezeProcess()`
- freeze 必须在 try/finally 中，unfreeze 在 finally 里

## 异步命令的 freeze 规则

何时用：命令中有 fetch、setTimeout、Web Worker 等异步操作。

正确用法：

```typescript
this.mgr.freezeProcess();
try {
    await asyncOperation();
    this.commit();
} catch {
    this.cancel();
} finally {
    this.mgr.unfreezeProcess();  // 一定会执行
}
```

禁止：在 freeze 后不用 try/finally 保护。

## 命令生命周期

```
cmdManager.execute(cmdType)
  → onExecute()
    → 交互式：onReceive() 消息循环 → commit()/cancel()
    → 立即执行：执行操作 → commit()
  → onCleanup()  ← 无论成功/失败/取消都会执行
```

| 方法 | 何时覆盖 | 注意 |
|------|---------|------|
| `onExecute` | 必须 | 初始化状态 |
| `onReceive` | 交互命令必须 | 路由消息 |
| `onCleanup` | 必须 | 清理 Temp 层、重置状态 |

## 命令注册

1. 定义命令类型常量（`CMD_TYPES` 枚举）
2. 在 Cad3DCanvas 的 `_registerCommands()` 中注册到 CommandManager
3. 通过 `app.executeCmd()` 或 `app.executeAsyncCmd()` 调用

## 设计决策速查

| 需求 | 命令类型 | 示例 |
|------|---------|------|
| 用户需要在视图中点击/拖拽 | 交互式 | MeasureCommand |
| 多步骤引导用户 | 交互式 + 状态机 | 绘制多边形 |
| 一步操作完成 | 立即执行 | 加载模型、切换视图 |
| 需要等待异步结果 | 异步立即执行 + freeze | LoadModelCommand |
| 需要实时预览 | 交互式 + Temp 层 | 绘制命令 |

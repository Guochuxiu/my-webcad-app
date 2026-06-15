# freezeProcess/unfreezeProcess 不配对

## 问题描述

在命令中调用 `freezeProcess()` 后，如果因异常或提前 return 而未执行 `unfreezeProcess()`，会导致命令系统永久阻塞——用户无法执行任何命令，只能刷新页面恢复。

这是最严重的交互故障之一，正常流程中不会暴露，但在网络请求失败、数据校验不通过、异步取消等异常路径中才会触发。

## 典型错误代码

```typescript
class MyCommand extends BaseCommand {
    async onExecute(app: CadApp) {
        this.mgr.freezeProcess();
        const result = await fetchData();
        // 如果 fetchData 抛异常，unfreeze 永远不会执行
        this.mgr.unfreezeProcess();
    }
}
```

## 正确写法

```typescript
class MyCommand extends BaseCommand {
    async onExecute(app: CadApp) {
        this.mgr.freezeProcess();
        try {
            const result = await fetchData();
            // 使用 result...
        } finally {
            this.mgr.unfreezeProcess();  // 确保 unfreeze 一定执行
        }
    }
}
```

## 影响范围

- 所有使用 `freezeProcess()` 的命令和交互流程
- 涉及异步操作（网络请求、文件加载等）的命令尤其危险
- 提前 `return` 路径也需要确保 `unfreeze` 被执行

## 检查要点

- 每个 `freezeProcess()` 是否都有对应的 `unfreezeProcess()`
- `unfreezeProcess()` 是否在 `finally` 块中（不能只在 `try` 或 `catch` 中）
- 是否存在提前 `return` 但未 `unfreeze` 的路径
- 异步操作（`await`）是否可能抛异常导致 `unfreeze` 被跳过

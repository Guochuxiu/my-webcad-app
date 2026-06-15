# Worker / 内存 / 大数据性能

## 源码用法摘要

- `fscadweb 模块：core\worker\worker_manager.ts:20`：`WorkerManager` 是统一 WebWorker 管理器。
- `fscadweb 模块：core\worker\worker_manager.ts:38`：`WorkerManager.getInstance()` 是静态单例，首次 config 会影响后续使用。
- `fscadweb 模块：core\worker\worker_manager.ts:55`：`register()` 按 worker type 建立 `WorkerPool` 并加入 `TaskScheduler`。
- `fscadweb 模块：core\worker\worker_manager.ts:128`、`fscadweb 模块：core\worker\worker_manager.ts:298`：临时 session 执行后通过 `session.end()` 释放实例。
- `fscadweb 模块：core\worker\worker_pool.ts:248`、`fscadweb 模块：core\worker\worker_pool.ts:394`：Worker 池销毁时释放 Comlink proxy、terminate worker 并清空集合。
- `fscadweb 模块：core\memory\arraybuffer_manager.ts:96`：`ArrayBufferManager` 管理 typed array chunk。
- `fscadweb 模块：core\memory\arraybuffer_manager.ts:222`、`fscadweb 模块：core\memory\arraybuffer_manager.ts:298`：大数组应走 `allocateBuffer()` / `free()`，不要散落临时分配。
- `fscadweb 模块：core\util\workerutil\worker_util.ts:16`：`WorkerUtil` 默认拿 `WorkerManager.getInstance()`。
- `fscadweb 模块：core\util\workerutil\occ.ts:24`、`fscadweb 模块：core\util\workerutil\pointcloud.ts:11`：OCC 和点云已有 worker util 封装。

## 正例

- 大数据、OCC、点云、mesh simplify、批处理类计算先查 `core/util/workerutil/*`，复用 `WorkerUtil -> WorkerManager.register() -> WorkerPool` 链。
- 长任务通过 `workerManager.createSession(type)` 获取 worker，并在 `finally` 中 `session.end()`；一次性调用可用 proxy 方法，让 `WorkerManager.executeMethod()` 自动结束临时 session。
- 大 typed array 优先用 `ArrayBufferManager.allocateBuffer()`、`allocate()` 和 `free()` 管理生命周期；需要跨线程时说明是 transfer 还是 shared buffer，并写清所有权。
- 新增 worker type 时必须说明 `type`、`methods`、`maxCount/initialCount/releaseStrategy`、错误处理、销毁路径和最小性能验证。

## 反例

- 在主线程直接跑 OCC STEP 解析、点云框选、网格简化、海量 bbox 计算。
- 在业务代码里 `new Worker()`，但不接入 `WorkerManager`、不限制并发、不释放 Comlink proxy、不 terminate。
- 把大 `Float32Array` 在 worker 和主线程之间反复复制，却没有 transfer/shared buffer 说明。
- 创建全局 worker/cache 单例，却没有说明多 app、多 view、热切换后的污染和释放策略。
- 只看一次 demo 响应时间，不检查重复调用后的 worker 数量、内存 chunk、session 是否归还。

## 审查清单

- 任务是否真的需要 worker，还是只是轻量同步计算；重计算是否从主线程移出。
- 是否复用了已有 `WorkerUtil`、`WorkerManager`、`WorkerPool`、`TaskScheduler`，而不是 unmanaged worker。
- worker 注册的 `type`、`methods`、`releaseStrategy` 是否和已有 util 一致。
- 每个 `createSession()` 是否有 `finally session.end()`。
- 大数组是否有 transfer/shared buffer/ArrayBufferManager ownership 说明。
- `WorkerManager.getInstance()` 的单例 config 是否会跨 app 或多 view 污染。
- destroy 或页面卸载时是否能到达 `WorkerManager.destroy()` / `WorkerPool.destroy()`。

## 最小验证

- 运行一次目标 worker API，确认任务完成且 UI 主线程不阻塞。
- 连续运行 3 次，检查 session 是否释放、worker 数量不持续增长。
- 对大 typed array 场景记录输入大小、transfer/shared 策略和返回数据所有权。
- 对新增 worker type，至少验证注册失败、方法不存在、任务异常时不会留下忙碌 session。

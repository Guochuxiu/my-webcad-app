# Worker 单例与 Transfer 风险

## 源码用法摘要

- `fscadweb 模块：core\worker\worker_manager.ts:38`：`WorkerManager.getInstance(config?)` 只在首次调用时创建实例。
- `fscadweb 模块：core\worker\worker_manager.ts:283`：`createSession()` 会把 session 放入 `_sessions`。
- `fscadweb 模块：core\worker\worker_manager.ts:298`：`session.end()` 调用 `instanceProxy.release()` 并删除 session。
- `fscadweb 模块：core\worker\worker_pool.ts:248`：销毁单个 worker 时释放 Comlink proxy。
- `fscadweb 模块：core\worker\worker_pool.ts:254`：销毁单个 worker 时执行 `worker.terminate()`。
- `fscadweb 模块：core\memory\arraybuffer_chunk.ts:118`：`ArrayBufferChunk` 可创建 `SharedArrayBuffer` 或 `ArrayBuffer`。
- `fscadweb 模块：core\util\workerutil\occ.ts:34`：OCC worker 的 releaseStrategy 直接影响 wasm 内存占用。

## 正例

- 使用 `WorkerManager.getInstance()` 前先确认是否接受全局单例；不同 app/view 需要不同并发策略时，不能假装每个 view 有独立 manager。
- 手动 session 必须写成 `try/finally`，确保异常时也 `await session.end()`。
- 传入 worker 的大 buffer 必须说明 transfer 后主线程是否还会使用；shared buffer 必须说明并发写入、刷新和释放边界。
- OCC、点云、simplify 等已有 worker util 的 releaseStrategy 要按场景选择：本地长时间运行优先关注内存，云端批处理才考虑保留更多 worker。

## 反例

- 多 view 中按 view 初始化不同 worker config，但实际都复用第一次 `WorkerManager.getInstance(config)` 的配置。
- worker 方法抛错后没有 `session.end()`，导致 worker 长期处于 busy 或 session 集合残留。
- transfer `ArrayBuffer` 后继续在主线程读写原 typed array。
- 为了“快”把 `releaseStrategy` 固定成 `keep_all`，但不验证 wasm worker 内存占用。
- 销毁页面只移除 canvas，不处理 worker pool、Comlink proxy、shared buffer 生命周期。

## 审查清单

- 是否出现 `WorkerManager.getInstance(config)` 多次传不同配置。
- 是否所有 `createSession()` 都有对应 `end()`。
- 大数组跨线程是否明确 transfer/shared/copy 三选一。
- transfer 后原 owner 是否停止使用该 buffer。
- shared buffer 是否说明谁写、谁读、何时释放。
- worker destroy 是否能释放 proxy 和 terminate，而不是只丢弃 JS 引用。

## 最小验证

- 失败路径验证：让 worker 方法抛错，确认 session 被释放。
- 重复运行验证：连续提交大任务后 worker 数量、busy 状态、内存不持续增长。
- transfer 验证：传输后主线程不再依赖原 buffer 内容。
- shared buffer 验证：重复刷新或 clear 后没有旧数据污染新 view。

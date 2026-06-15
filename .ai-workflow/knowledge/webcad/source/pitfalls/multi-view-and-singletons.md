# 多视图与单例风险

## 为什么单列出这一篇

下游业务库最容易低估的风险之一，就是把“单视图 demo 场景下可用”的写法带进真实业务。
`cadnginx` 和 `fscadweb` 里有一些明确的单例或半单例行为，业务库设计时必须先知道。

## `CadApp.destroyView()` 不是彻底销毁

源码位置：

- `cadnginx 模块：app.ts`
- `fscadweb 模块：app/app.ts`

关键事实：

- `FSApp.App.destroyView(id)` 会 `view.dispose()` 并从 `_viewMap` 删除
- 但 `CadApp.destroyView(tag)` 重写后只调用 `destroyRender()` 和 `deactiveInput()`
- `CadApp.destroyView(tag)` 不会从 `_viewMap` 删除 view

这意味着：

- 业务库不能把 `CadApp.destroyView()` 当成“完整释放 view”
- 同 tag 再次 `addView()` 时，可能复用旧 view，而不是创建新实例
- 如果业务库自己缓存了 view 级状态，就要考虑“view 对象仍活着但 renderer 被重建”的场景

## `CadApp.addView()` 会复用同 tag 的 view

源码事实：

- `CadApp.addView()` 先 `getViewByTag(tag)`
- 已存在时调用 `createNewRender(container)` 和 `dirty()`
- 不存在时才 `createView(tag, canvas, ...)`

对业务库的影响：

- tag 不只是名字，而是 view 生命周期复用键
- 同一个业务库如果支持多个画布，必须设计清楚 tag 策略
- 不要把“一个 view 只能初始化一次”的假设写死到业务 observer、热键或缓存里

## `SnapEngine` 是静态单例

源码位置：

- `cadnginx 模块：snap/snap_engine.ts`

关键事实：

- `SnapEngine` 有 `private static _instance`
- `getInstance(view, strategyPriorityMap)` 只在首次创建时真正使用参数

对业务库的影响：

- 多视图场景下，后创建的 view 可能拿到绑定在旧 view 上的 snap engine
- 不同业务模式如果想要不同 snap 优先级，也不能假定每个 view 各有一份 engine
- reviewer 看到“按 view 维度创建 snap engine”的方案时，要特别核对源码是否真支持

## `AppConfig` 是全局单例

源码位置：

- `fscadweb 模块：app/config/app_config.ts`

关键事实：

- `AppConfig.getInstance()` 返回静态单例
- `FSApp.App` 构造时直接拿这个单例并更新配置

对业务库的影响：

- 多个 app 实例之间可能共享配置对象
- 一个业务库修改配置，可能影响同进程里的其他 app 实例
- 方案评审时，要审查配置修改是否需要隔离、回滚或命名空间约束

## 选择状态与清理语义不是同一个概念

源码位置：

- `fscadweb 模块：app/selection/Selection.ts`
- `fscadweb 模块：core/document.ts`

关键事实：

- `Selection.resetAll()` 只清 `selected` / `hover` flag，不清内部 `_selectSet`、`_hoverSet`
- `Document.clear()` 会移除 root 子节点并清空 `_entityMap`

对业务库的影响：

- 如果业务库把“flag 被清掉”当成“选择状态对象已经完全重置”，会产生隐藏状态残留
- 清空 document 后，如果业务代码还拿旧 id 或旧缓存集合做后续判断，容易出现空对象或脏状态

## 设计与审查时的默认动作

只要遇到以下关键词，就要主动进入高风险检查：

- 多画布
- 多窗口
- 多 app 实例
- 业务隔离
- 热切换场景
- 插件化安装
- 共享配置
- 共享 snap

优先检查：

- 单例是否跨实例污染
- view 是否被复用而不是重建
- destroy 是否只是停渲染而不是清对象
- 状态集合、缓存、observer、热键是否真的解除绑定

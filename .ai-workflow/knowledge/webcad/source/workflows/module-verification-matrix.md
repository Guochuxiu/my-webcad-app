# Module Verification Matrix

这份矩阵用于把 topic / risk route 转成最小验证动作。它是工作流入口，不替代具体业务、pitfall 或源码抽查。

| Module | Route aliases | Minimum verification |
|---|---|---|
| App / View / Document | `app`、`view`、`canvas`、`document`、`lifecycle` | 同 tag view 复用后状态正确；`destroyView()`、`clear()` 后无旧 observer、display 或 selection 残留。 |
| Entity / Display | `entity`、`cadentity`、`display`、`dirty`、`screenBox`、`viewObj`、`createPickObject` | 新 entity 可见；dirty 后 display 更新；pick / screenBox 工作；`onCleanup()` 释放资源。 |
| Batch / PointCloud | `batch`、`statusView`、`pickColor`、`pointcloud`、`point-index` | 大数据不退化为单对象渲染；点级 selection 正确写 status；worker 结果与显示状态同步。 |
| Pick / Selection / Input | `pick`、`selection`、`inputStack`、`observer`、`hover` | hover/click/box-select 身份一致；observer priority 和 consumed 短路符合预期；`Selection.resetAll()` 风险已处理。 |
| Command / Tool | `command`、`tool`、`cancel`、`hotkey`、`Mousetrap` | execute、cancel、cleanup、键盘桥接和临时对象回收都有可验证路径。 |
| Snap / Gizmo | `snap`、`pickSize`、`gizmo`、`transformGizmo`、`attach`、`detach` | snap pick size 异常路径恢复；`SnapEngine` 单例不污染多 view；gizmo signal 和 input provider 清理。 |
| Loader / SES / URDF | `loader`、`ResourceManager`、`SES`、`URDF`、`kinematics.urdf` | SES load/export round-trip 覆盖 `scene.json`、resource reference、URDF link/joint 和 root update。 |
| Worker / Memory | `worker`、`WorkerManager`、`ArrayBufferManager`、`OCC`、`mesh-simplify` | 大数组 transfer 或 ownership 明确；worker / pool / cache 有 release 或 dispose 边界。 |
| Material / Config / Instance | `material`、`postprocess`、`config`、`theme`、`asset`、`texture`、`instance`、`template` | 配置变更走 config signal；材质/texture/postprocess 可释放；重复对象优先检查 batch vs instance。 |
| Kinematics / Animation | `kinematics`、`Link`、`Joint`、`animation`、`simulation` | joint 值更新后 root link update；animation 接入 view manager；stop/dispose 后无旧 signal 回调。 |

## Drift Rule

如果某个 alias 只路由到本矩阵而没有更具体业务页，说明当前 KB 只有验证入口。方案或代码实现前必须继续抽查当前仓库源码和 `随包 WebCAD 知识库的 fscadweb 用法摘要`，不要把矩阵当成完整实现模板。

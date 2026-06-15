# 陷阱总览

这份目录只做两件事：

- 帮 AI 快速定位高风险文档
- 给 code review 提供最短检查清单

## 高优先级陷阱

| 陷阱 | 一句话描述 | 详细文档 |
|------|-----------|---------|
| 多视图与单例 | view 复用、单例污染、状态残留最容易把业务行为带偏 | [multi-view-and-singletons.md](./multi-view-and-singletons.md) |
| 键盘输入桥接 | 命令依赖按键，但事件没有进入当前 `inputStack` | [keyboard-input-bridge.md](./keyboard-input-bridge.md) |
| GPU pick 身份映射 | 看得见但选不中，或者选中了却映射不到业务 entity | [gpu-pick-id-color.md](./gpu-pick-id-color.md) |
| Pick / Selection / Input 链 | 普通 pick、hover、selection、entity flags、snap pick size 和输入链混用 | [pick-selection-input-chain.md](./pick-selection-input-chain.md) |
| inputStack observer 顺序 | priority、反向遍历、consumed 短路和 cleanup 顺序误判 | [inputstack-observer-order.md](./inputstack-observer-order.md) |
| 点云 pick / selection | 点云 ray/bbox/closest point pick 与 point-index selection 不同于普通 GPU pick | [pointcloud-pick-selection.md](./pointcloud-pick-selection.md) |
| Display 注册匹配 | 当前源码为精确 constructor map；旧版/旧认知的父子注册顺序需版本化处理 | [display-registration-order.md](./display-registration-order.md) |
| viewObj 懒创建时序 | 构造、注册、display tree 未闭合前访问 `viewObj` / `pickObj` | [viewobj-timing.md](./viewobj-timing.md) |
| dirty 不闭环 | 数据变了但没有刷新到 display | [dirty-marking.md](./dirty-marking.md) |
| Snap pick size / 单例 | `SnapEngine` 单例污染与 pick size 异常路径恢复 | [snap-pick-size-and-singleton.md](./snap-pick-size-and-singleton.md) |
| Gizmo input / signal | transform gizmo 的 input provider、observer、target signal 生命周期不闭合 | [gizmo-input-and-signal-lifecycle.md](./gizmo-input-and-signal-lifecycle.md) |
| Signal 泄漏 | `listen()` 没有配对 `unlisten()` | [signal-lifecycle.md](./signal-lifecycle.md) |
| 导入路径错误 | 直接从底层包导入导致多实例和 `instanceof` 失真 | [import-path.md](./import-path.md) |
| freeze 死锁 | `freezeProcess()` 异常退出未解冻，命令链永久阻塞 | [freeze-deadlock.md](./freeze-deadlock.md) |
| 实体销毁链 | 实体已销毁但缓存引用仍被继续操作 | [entity-destroy-chain.md](./entity-destroy-chain.md) |
| 图层类型错误 | layer 放错导致渲染、拾取、清理异常 | [layer-type.md](./layer-type.md) |
| Batch id 错配 | batchId、statusView、pickColorView 或共享 buffer 身份不一致 | [batch-id-mismatch.md](./batch-id-mismatch.md) |
| Batch shared buffer 生命周期 | 模型层 chunk/view 与显示层 batch object/pick object 生命周期错位 | [batch-shared-buffer-lifecycle.md](./batch-shared-buffer-lifecycle.md) |

## 快速审查清单

- 是否误改了底座边界
- 是否补齐 `Entity -> Display -> Canvas 注册 -> 导出/安装` 链路
- 是否错误假设 `destroyView()` 是完整销毁
- 是否忽略 `SnapEngine` 单例和多视图污染
- 是否核实键盘输入桥接
- 是否核实 pick 身份映射
- 是否区分普通 GPU pick、点云 pick、点级 selection
- 是否核实 inputStack observer 顺序和 consumed 短路
- 是否核实 `viewObj` / `pickObj` 懒创建时序
- 是否核实 batch shared buffer 的模型层 view、显示层 object、pick object、status attribute 生命周期
- 是否在数据变更后补齐 dirty
- 是否在 cleanup 时解除监听、热键、observer、render task、gizmo input provider

# 功能验收标准模板

验收时按以下检查项逐条通过。任何一项不通过即验收失败，需回退修复。

## 检查清单

### 1. 编译检查

- TypeScript 编译 0 错误（`npx tsc --noEmit`）
- 无 `any` 类型滥用
- 无未使用的导入
- 无 strict 模式阻断级警告

### 2. 功能点完整性

- 方案 spec.md 中所有功能点已实现
- 每个功能点可通过操作验证

对照 spec.md 验收标准章节逐条确认：

| 编号 | 功能点 | 预期行为 | 通过 |
|------|--------|---------|------|
| F-01 | | | Y/N |

### 3. 代码审查问题

- 无高严重度（High）问题
- 中严重度问题已有修复计划或标记为已知限制

### 4. Signal 泄漏检查

- 每个 `.listen()` 都有配对 `.unlisten()`
- 或使用了 SignalHook 自动管理
- Display / Command 的 onCleanup 中执行了 unlisten

检查方法：全局搜索 `.listen(`，逐条确认有配对 unlisten。

高风险场景：Display 中手动监听 Service 信号、Command 中监听 Selection 信号。

### 5. 内存泄漏检查

- 反复执行后内存不持续增长
- Entity 引用在销毁后不继续被持有
- WebGL 资源（geometry, material, texture）在 onCleanup 中 dispose

检查方法：Chrome DevTools Heap Snapshot 对比操作前后。关注 Detached DOM nodes 和 Entity 实例数。

### 6. 脏标记检查

- 修改几何数据的方法调用了 `dirtyGeometry()`
- 修改颜色/材质的方法调用了 `dirtyMaterial()`
- 修改位置/旋转/缩放的方法调用了 `dirtyPosition()`

检查方法：列出所有 public setter，确认每个都有对应的 dirty 调用。搜索直接修改 `_geometry.` 但未调用 dirty 的情况。

### 7. Display 注册链检查

- 子类 Entity 的 Display 注册在父类之前
- 所有新增 Entity-Display 映射已在 Cad3DCanvas 中注册
- 无遗漏的注册

检查方法：查看 `registerDisplayType` 调用顺序，确认继承链中子类先于父类。

### 8. 命名规范检查

- 文件名 snake_case
- 类名 PascalCase，Display/Command 有对应后缀
- 接口 I 前缀
- 私有属性 `_` 前缀
- 常量 UPPER_SNAKE_CASE

### 9. 性能检查

| 指标 | 目标 |
|------|------|
| 渲染帧率 | >= 30 FPS |
| Draw Calls | < 100 |
| 内存增长 | < 10%（20 次操作） |
| 响应延迟 | < 200ms |

大量图元场景必须使用 BatchEntity 而非独立 Entity。

## 验收结论

| 情况 | 结论 |
|------|------|
| 所有检查项通过 | 验收通过 |
| 编译/功能/Signal/内存/脏标记/注册顺序 任一不通过 | 验收不通过，回退修复 |
| 命名规范有少量不合规 | 有条件通过，标记为后续优化 |

验收完成后按 `workflows/artifact-contract.md` 中定义的格式编写验收报告。

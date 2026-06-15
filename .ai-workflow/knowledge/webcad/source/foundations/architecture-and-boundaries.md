# 架构与边界

## 目的

帮助下游业务库理解 `fscadweb` 与 `cadnginx` 的能力边界，知道“应该依赖哪一层、扩展哪一层、不要重复造哪一层”。

## 源码基线

- `fscadweb 模块：index.ts` 导出 `FSCore`、`FSApp`、`FSMath`
- `cadnginx 模块：index.ts` 导出 `CadApp`，并重新导出 `FSApp`、`FSCore`、`FSMath`
- `cadnginx 模块：app.ts` 中 `CadApp extends FSApp.App`

## 你在业务库里如何理解这四层

### `FSMath`

职责：

- 数学与几何基础类型
- 曲线、曲面、求交、投影、方程求解

在业务库里通常这样用：

- 直接复用向量、矩阵、几何对象和算法
- 不在业务库里重复实现一套几何基础库
- 当业务命令、业务 display、业务 snap 需要几何计算时优先依赖这一层

### `FSCore`

职责：

- `Entity` / `CADEntity` / `Group` / `Document`
- `Signal` / `SignalHook`
- Worker、Memory、ID、Flag、Protobuf 等基础设施

在业务库里通常这样用：

- 复用 `Entity`、`CADEntity`、`Group`、`Document`、`Signal`
- 基于已有实体生命周期扩展业务模型
- 不在业务库里再造一套事件系统、文档树和实体树

### `FSApp`

职责：

- `App`
- `CommandManager` / `Command`
- `Canvas` / `ThreeCanvas` / `Display`
- 选择、输入、渲染、图层、动画、控制器

在业务库里通常这样用：

- 继承 `Command`、`Canvas3D`、`ThreeDisplay`
- 沿用已有选择、输入、图层、渲染和命令调度机制
- 把你的业务对象接进这套 view / command / display 管线

### `CadNginx`

职责：

- `CadApp`
- `Cad3DCanvas`
- 业务模型、业务 Display、业务命令
- Snap、Gizmo、Loader、Scene、Kinematics 扩展

在业务库里通常这样用：

- 作为最直接的上层依赖入口
- 复用 `CadApp`、`Cad3DCanvas`、Snap、Gizmo、Loader、业务默认场景能力
- 将你的业务库继续建立在这层之上，而不是绕开它直接拼底层能力

## 下游业务库的扩展判断规则

### 优先直接复用，不在业务库重复实现

- 数学与几何基础
- 通用实体树、信号系统、文档索引
- 通用 Canvas / Display / Command 流程
- 通用选择、图层、渲染和输入处理

### 适合在你的业务库里新增

- 业务 Entity
- 业务 Display
- 业务 Command
- 业务 Scene、Loader、SnapStrategy、Gizmo 组合
- 业务默认配置和业务语义对象

### 需要暂停确认的情况

- 看起来是业务能力，但其实是通用框架缺口
- 你准备在业务库里复制一段 `fscadweb` / `cadnginx` 通用逻辑
- 你需要修改底座语义才能完成需求

## 对下游业务库的强约束

- 外部业务库推荐统一从 `@fsdev/cadnginx` 导入
- 把 `cadnginx` 当成主入口，把 `fscadweb` 当成底座来源
- 业务库应扩展已有体系，而不是复制底座体系

## 下游开发中的常见误判

- 因为赶需求，就在业务库里复制一份底层选择、信号或渲染逻辑
- 因为能直接拿到底层类，就跳过 `CadApp` / `Cad3DCanvas` 的既有扩展点
- 把“底座该补的能力”和“业务库特有能力”混在一起设计
- 误以为知识库是在教你改底座仓库本身，导致扩展动作方向错位

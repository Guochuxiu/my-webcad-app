# Agent Positive / Negative Examples

这份文档给 CLI / agent 一个短的正反例入口，用于提醒“业务库扩展链闭合”比“写出看似可用的类”更重要。

## 正例

- 先归一 `task_type`，读取 entry、role、topic、risk 最小加载集，再输出方案或改代码。
- 新增业务对象时说明 `Entity -> Display -> Canvas registerDisplayType -> Document/View -> dirty/pick/cleanup` 链。
- 新增交互能力时说明 `inputStack`、observer 顺序、selection 身份、命令取消和临时对象清理。
- 新增 loader / SES / URDF 能力时走现有 `ResourceManager`、loader config、kinematics link/joint 更新链。
- 每个结论至少能回溯到 KB 文档、当前仓库源码或用户提供的底座源码证据，并给出最小验证方式。

## 反例

- 用户要业务库方案，却直接建议修改 `cadnginx` / `fscadweb` 底座。
- 直接往 scene 塞 `THREE.Object3D`，没有说明 `clear()`、`destroyView()`、pick、dirty 后谁负责清理。
- 发明 `refreshDisplay()`、`registerCommandOnce()`、`setStrategy()` 等当前源码未确认 API。
- 用普通 entity selection 解释点云 point-index selection，或把点云 pick 当成普通 GPU pick。
- 只写静态目录结构，不说明运行时注册路径和销毁路径。

## Quick Use

当 reviewer 发现方案或实现存在反例倾向时，优先回到对应 topic/risk 文档复查，而不是继续补想象中的实现细节。

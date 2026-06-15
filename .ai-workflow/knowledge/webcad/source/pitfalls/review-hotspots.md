# 审查热点

这份文档给 reviewer 用，目的是在最短时间内抓到最容易影响业务接入正确性的风险。

## 先看边界

- 方案或代码是否把“业务库开发”误写成“改底座”
- 是否复制了 `FSApp.App`、`ThreeCanvas`、`Selection`、`Document` 等通用机制

## 再看注册链

- 新 `Entity` 是否有对应 `Display`
- 新 `Display` 是否注册到目标 canvas
- 新命令是否注册到 `cmdManager`
- 是否补了统一导出和模块安装入口

## 再看高风险运行时行为

- `CadApp.addView()` 复用同 tag view
- `CadApp.destroyView()` 不是彻底销毁
- `SnapEngine` 是静态单例
- `Selection.resetAll()` 不清内部 set
- `Document.clear()` 会清空 `_entityMap`

## 再看交互链

- 键盘输入是否真的进了当前命令
- GPU pick 结果是否还能映射回业务对象
- dirty 是否闭环
- 监听、observer、render task、热键是否在 cleanup 中解除

## 审查输出要求

- 每条问题都尽量能回溯到知识库事实或源码事实
- 优先指出会影响验收、会导致运行时偏差、会让多视图/多实例失真的问题

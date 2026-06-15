# 业务库目录结构

## 这篇文档解决什么问题

这份知识库服务的对象是“基于 `cadnginx` / `fscadweb` 开发新的业务库”。
因此这里关注的不是 `cadnginx` 自己怎么分层，而是你的业务库应该怎样组织目录，才能稳定接入底座扩展点。

## 推荐结构

业务库通常可以按下面方式组织：

```text
src/
  app/
  model/
  display/
  command/
  loader/
  scene/
  config/
  modules/
  constants/
  utils/
  index.ts
```

也可以更轻量，但建议至少保留以下职责边界：

- `app/`: 业务库对 `CadApp` 的封装入口，放业务初始化或组合型 app 包装
- `model/`: 业务 entity、装配对象、标注对象、临时预览对象
- `display/`: 对应 entity 的显示层实现
- `command/`: 交互命令、命令辅助对象
- `loader/`: 外部数据到业务 entity 的映射
- `scene/`: 默认场景创建、环境对象组合、视图启动组合
- `config/`: 业务配置项和默认值
- `modules/`: 通过 `install(app)` 形式安装的一组注册逻辑
- `index.ts`: 对外统一导出入口

## 为什么按这个边界拆

底座已经把这些通用机制封装好了：

- `FSCore` 负责 entity、document、signal 等基础机制
- `FSApp` 负责 command、selection、canvas、three 渲染链
- `CadApp` 和 `Cad3DCanvas` 已经把 CAD 场景常用能力组合起来

因此业务库不应该再复制这些底层骨架，而应该把自己的代码放在“业务对象、业务显示、业务命令、业务注册”这些层面。

## 每层放什么

### `model/`

放业务语义对象，不放通用 document 或 selection 机制。

适合放：

- 行业实体
- 装配层业务对象
- 业务预览对象
- 业务标注对象

不适合放：

- 重写 document 树
- 自建通用 entity 生命周期框架

### `display/`

放 entity 对应的显示实现。
display 要服从底座的 display 生命周期和 layer / pick / dirty 约束。

适合放：

- 业务面显示
- 业务线显示
- 业务标签显示
- gizmo 对应显示

不适合放：

- 再造一套平行渲染框架
- 绕过 canvas 的注册链直接堆场景对象

### `command/`

放业务交互命令和命令辅助逻辑。

适合放：

- 建模命令
- 测量或标注命令
- 装配调整命令
- 预览态与提交态的命令配合逻辑

不适合放：

- 把命令流程散落在 view observer、UI 组件和全局变量里

### `loader/`

放业务格式接入。
如果已有 `Loader` 抽象能覆盖，就优先通过 loader 把外部对象映射成业务 entity。

### `modules/`

如果你的业务库需要“一次安装，多处注册”，建议把注册逻辑收敛到模块里，并通过 `CadApp.use(modules)` 接入。

源码事实：

- `cadnginx 模块：app.ts` 中 `CadApp.use(modules)` 会调用每个模块的 `install(this)`

这意味着业务库可以把“命令注册、display 注册、场景注册、默认配置注入”打包成独立模块。

## 导出组织

建议像 `cadnginx 模块：index.ts` 一样，让业务库通过一个 `src/index.ts` 暴露公开 API。

推荐导出范围：

- 业务 app / canvas
- 业务 model / display / command / loader
- 常量和配置
- 安装模块

避免直接把内部临时文件、实验性帮助类、调试入口暴露成公开 API。

## 目录设计时的审查问题

- 你的目录是在表达“业务能力”，还是在复制底座目录
- 是否出现同一能力被同时拆在 `view/`、`display/`、`command/` 多处且没有清晰归属
- 是否把注册入口分散到多个随机文件，导致 reviewer 很难核对注册链
- 是否缺少统一导出入口，导致 downstream 使用方只能深路径引用

## 一个常见判断

如果你发现自己在业务库里准备重写：

- `App`
- `Document`
- `ThreeCanvas`
- `Selection`
- 通用 Layer / Pick / Dirty 机制

通常说明方向已经偏离，应该先回到 `CadApp`、`Cad3DCanvas` 和现有扩展点重新设计。

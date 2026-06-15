---
name: webcad-canvas-development
description: 在下游业务库中开发或扩展通用 WebCAD Canvas。用于新增 canvas/view 类型、接入 view key/tag、配置当前仓库 canvas 构造参数、注册 display/command/observer/sceneCreator/pickStrategy，或处理 canvas clear/dispose/view 复用问题。
---

# WebCAD Canvas 开发

使用本模板时，目标是沿当前业务库已有扩展链新增一个可运行 canvas。

代码产出或实测时，必须使用目标仓库真实存在的 canvas 基类、构造参数、view factory、注册函数和清理方法。找不到时停止并说明证据不足，不要用 `CurrentBaseCanvas`、`CurrentViewFactory`、`XxxCanvas` 等占位结构冒充可落地代码。

优先参考 `webcad-weld` 的标准业务库模式：业务 canvas 继承 `Base3DCanvas<TApi>`，构造函数只装配 `configOptions/domElement/app`、`adapter/api/manager/signal`，注册链通过 `_registerDisplay()`、`_registerCommands()`、`_registerPickHelper()` 闭合。

## 查找锚点的方法

不要假设业务库目录或文件名固定。按下面方式在当前工作区找同类模式：

- 找 view 创建入口：搜索 `addView`、`createView`、`add*View`、`createViewHandle`。
- 找 canvas 基类：搜索 `extends .*Canvas`、`Cad3DCanvas`、`Base3DCanvas`、`constructor(params`。
- 找 display 注册：搜索 `registerDisplayType`、`createDisplay`、`_registerDisplay`。
- 找 command 注册：搜索 `registerCmd(this)`、`registerCmds`、`cmdManager.register`、`registerCommands`。
- 找 observer 挂接：搜索 `getViewObserver`、`inputStack.addObserver`、`new .*Observer`、`addObserver`。
- 找 view key/tag：搜索 `IViewTag`、`ViewTag`、`viewKey`、`canvasMap`。
- 找配置：搜索 `canvas_config`、`configOptions`、`ViewCube`、`OrbitControls`、`CSSRender`。

## 常见 API 与参数

新增 canvas 前先确认当前仓库实际使用哪一套 API。常见形态：

- `super({ configOptions, domElement, app })`：对象参数风格构造。
- `super(params)`：透传参数风格构造。
- `registerDisplayType(EntityClass, entity => this.createDisplay(entity, DisplayClass))`：注册 Entity 到 Display 的映射。
- `registerCmd(this)` + `registerCmds(view, CMD_CLASS_MAP)`：业务库推荐的集中 command 注册方式。
- `this.app.cmdManager.register(cmdType, CmdClass)`：底座或历史专项 canvas 常见写法，仅在目标仓库已有同类模式时使用。
- `getViewObserver()` 或 `this.inputStack.addObserver(observer)`：挂接 observer、measure gizmo 或交互处理器，以当前仓库真实入口为准。
- `this._config.get(path)` 或当前仓库配置读取器：读取 canvas 配置。
- `this.sceneCreator` / 业务 `SceneCreator`：用于装配 scene 创建与更新逻辑。
- `dispose()` / `clear()` / `document.clear()` / 当前仓库清理方法：释放资源与清理实体。

常见配置项：

- `common.color_background`：背景色。
- `common.line.selectedColor`：选中线颜色。
- `common.use_stats`：性能面板开关。
- `common.theme`：业务主题。
- `CSSRender.render_css_2d` / `CSSRender.render_css_3d`：CSS2D/CSS3D 渲染开关。
- `OrthogonalCamera.near/far/x/y/z/up`：正交相机参数。
- `OrbitControls.autoUpdateRotateCenter` / `zoomSpeed`：控制器行为。
- `ViewCube.up/dir/position`：视图立方体方向与位置。

## 开发步骤

1. 新增或复用 view tag：在现有 tag 常量处增加明确的业务 view key。
2. 把 tag 映射到 canvas class：在 app 的 `canvasMap` 或 view factory 中注册 `tag -> CanvasClass`。
3. 准备配置对象：优先放在业务 `config/*canvas_config*` 文件，保持构造函数只负责装配。
4. 写 canvas 类：继承当前仓库正在使用的 canvas 基类。
5. 在构造函数中只做装配：传 `configOptions/domElement/app`，初始化 adapter/api/manager/signal，不写具体业务流程。
6. 拆出注册方法：`_registerDisplay()`、`_registerCommands()`、`_registerPickHelper()`，observer 通常通过重写 `getViewObserver()` 接入。
7. 注册 display：每个 Entity 必须在 canvas 中能找到对应 Display。
8. 注册 command：每个 command type 必须能从 UI/handle/observer 通过 `executeCmd` 或等价路径触达。
9. 挂 observer：优先复用或重写 `getViewObserver()`；只有 gizmo/专项工具类 observer 才追加到 `inputStack.addObserver()`，并保证 dispose 时释放。
10. 接入创建路径：Vue/业务 API 通过 app/view factory 创建 canvas。

## 最小代码骨架

```ts
export class BizCanvas extends Base3DCanvas<BizApi> {
  public adapter: BizAdapter;
  public signalUpdateScene = new FSCore.Util.Signal();
  private _bizManager: BizManager;

  constructor(params: FSApp.View.Three.IThreeCanvasConstructorParams) {
    super({
      configOptions: bizCanvasConfig as any,
      domElement: params.domElement,
      app: params.app,
    });

    this.adapter = new BizAdapter(this);
    this._api = new BizApi(baseUrl);
    this._bizManager = new BizManager(this.app.doc, this);
  }

  protected _registerDisplay() {
    super._registerDisplay();
    this.registerDisplayType(BizEntity, entity => this.createDisplay(entity, BizDisplay));
    this.registerDisplayType(BizGroupEntity, entity => this.createDisplay(entity, FSApp.View.Three.Group));
    this.registerDisplayType(FSCore.Model.DomLabel, entity => this.createDisplay(entity, FSApp.View.Three.DomLabel));
  }

  protected _registerCommands(): void {
    registerCmd(this);
  }

  protected _registerPickHelper() {
    this.pickHelper.registerStrategy(SELECTION_MODE.BODY, BizBodyDisplay, PickPriority.Body, BizPickStrategy);
    this.pickHelper.use([SELECTION_MODE.BODY]);
  }

  protected getDefaultSceneCreator() {
    return new BizSceneCreator(this);
  }

  protected getViewObserver(): View.Cad3DCanvasObserver<this> {
    return new BizObserver(this);
  }

  public dispose(): void {
    this.signalUpdateScene.dispose();
    this._bizManager.dispose();
    super.dispose();
  }
}
```

如果目标仓库直接继承 `cadnginx` 的 `Cad3DCanvas`，可在构造中追加 display/command/gizmo 注册；如果目标仓库使用 `ReverseAppCanvas` 等历史 SDK 模式，必须先确认它的清理、observer 单例和 command 注册链。

## 注册链模板

```ts
export enum ViewKey {
  BIZ = 'biz',
}

export class BizApiEntry extends WebCadApiBase<BizCmdParamTypes> {
  public async createView(viewKey: string, domElement: HTMLElement, configOptions?: any): Promise<BizViewHandle> {
    if (!this._app) this._createApp();
    if (this._views.has(viewKey)) throw new Error(`View with key "${viewKey}" already exists.`);

    const view = await this._app.createView(viewKey, BizCanvas, { domElement, app: this._app, configOptions });
    const handle = new BizViewHandle(viewKey, view);
    this._views.set(viewKey, handle);

    return handle;
  }
}
```

把 `BizApiEntry/BizCanvas/BizViewHandle` 替换为目标仓库真实命名。若仓库已有 `createViewHandle(...)` 模式，优先覆写该方法而不是复制整段 `createView`。

## 边界约束

- Vue 组件通过 app/view factory 获取 canvas。
- view 创建路径经过 `canvasMap`、view factory 或 app registry。
- canvas 构造函数只装配依赖和注册链。
- 业务对象通过 document/entity/display 链进入场景；已有生命周期闭合模式除外。
- 新增 canvas 时同步补齐 view tag、app 映射、display 注册、command 注册和 handle 暴露。

## 决策检查点

- 如果找不到 view 创建入口，先停在“缺少 canvas 接入锚点”，不要新增孤立 canvas 类。
- 如果找不到 display 或 command 注册入口，只能先写方案，不要声称运行链路已闭合。
- 如果 observer 挂接方式不明，先查底座 canvas 构造和当前业务 canvas 示例，再决定是重写 `getViewObserver` 还是注册到 input stack。
- 如果 clear/destroy 行为不明，必须把 view 复用、重复创建、资源释放列为风险。

## 失败与回退

- 找不到配置系统：先复用父类默认配置，并把新增配置项延后到有真实配置入口后处理。
- 找不到统一 command manager：canvas 只注册 display/observer，把 command 接入升级为后续任务。
- 找不到清理 API：使用当前仓库已有 document clear、entity remove 或 view dispose 模式；不要编造不存在的方法名。

## 验证清单

- 创建 view：能通过 app/factory 成功创建 canvas。
- 获取 view：能通过 tag 或 viewKey 取回目标 canvas。
- Display：新增 entity 后能创建 display。
- Command：`cmdManager` 中能找到新增 command type。
- Observer：重复进入/退出 view 不重复触发事件。
- Clear：当前仓库 clear/document clear/entity remove 后无孤儿对象。
- Dispose：`dispose()` 后 signal、listener、observer、manager 资源释放。
- 多视图：同 tag 复用或销毁策略符合当前 app 的 `addView/destroyView` 行为。

## 实测 Prompts

- “新增一个业务 canvas 类型，并说明 view tag、factory、display、command、observer 如何闭合。”
- “审查一个 canvas 实现是否在 view 复用后重复注册 observer 或遗留 signal。”
- “当前仓库没有统一清理方法时，如何设计 canvas 的清理验收路径？”

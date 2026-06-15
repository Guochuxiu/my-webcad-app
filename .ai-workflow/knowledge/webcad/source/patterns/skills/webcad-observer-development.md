---
name: webcad-observer-development
description: 在下游业务库中开发通用 WebCAD canvas observer。用于新增 Cad3DCanvasObserver/Base3DObserver，处理 _onLButtonDown/_onMove/_onClick、pick、selection、keyboard、inputStack.addObserver、dispose 清理；不嵌入具体业务功能。
---

# WebCAD Observer 开发

使用本模板时，目标是把 canvas 输入事件转成 selection、preview、handle 调用或 command 调用。

代码产出或实测时，必须使用目标仓库真实存在的 observer 基类、事件方法名、pick helper、selection API 和挂接入口。找不到时停止并说明证据不足，不要用 `CurrentCanvasObserver`、`ScreenPoint`、`XxxObserver` 等占位结构冒充可落地代码。

优先参考 `webcad-weld` 的标准业务库模式：通用 observer 继承 `Base3DObserver<TCanvas>`，点选和框选不直接解析 `pick()` 结果，而是通过 `canvas.pickHelper.pick(pos)` / `pickArea(...)` 得到业务 id；具体“点到 face 选 body”等规则放进 `PickStrategy`。

## 先找锚点

不要假设通用 observer 文件位置固定。先在当前工作区搜索：

- observer 基类：`extends .*CanvasObserver`、`Base3DObserver`、`Cad3DCanvasObserver`。
- 事件方法：`_onLButtonDown`、`_onLButtonUp`、`_onMove`、`_onClick`、`processKeyboardEvent`。
- 挂接入口：`getViewObserver`、`inputStack.addObserver`、`new .*Observer`、`addObserver`。
- pick/selection 使用点：`pickHelper.pick`、`pickHelper.pickArea`、`PickStrategy`、`.select(`、`selectionBox`、`hover(`。

## 常用 API

- `extends View.Cad3DCanvasObserver<TCanvas>`、`extends Base3DObserver<TCanvas>` 或当前仓库业务 observer 基类。
- `protected _onLButtonDown(pos, fnKey): boolean`：左键按下。
- `protected _onLButtonUp(pos): boolean`：左键抬起。
- `protected _onMove(pos): boolean`：鼠标移动。
- `protected _onClick(pos, fnKey): boolean`：点击。
- `this._view.pickHelper.pick(pos)`：点选入口，按当前 selection mode 和策略返回业务 id。
- `this._view.pickHelper.pickArea(box, isLeftToRight, selectionMode)`：框选入口。
- `this._view.select(ids)` / `this._view.app.selection`：更新选择。
- `this._view.app.executeCmd(...)`：把交互结果交给 command。
- `dispose()`：释放静态实例、listener、临时对象。

## 开发步骤

1. 判断 observer 负责哪类输入：鼠标、键盘、hover、框选、测量、gizmo 或 pick 转译。
2. 新增 observer 类并绑定具体 canvas 泛型。
3. 在 canvas 的真实 observer 生命周期入口挂接：业务主 observer 优先重写 `getViewObserver()`；gizmo 或临时工具 observer 才用 `inputStack.addObserver(...)`。
4. 在事件方法中先处理坐标、功能键、当前模式，再执行 pick/selection。
5. 只在 observer 中保存交互临时状态，不保存持久业务数据。
6. 需要改变模型时调用 command 或 handle。
7. 为 window/document listener、signal、timer、preview 对象补 dispose。
8. 验证重复进入 view、切换 view、销毁 view 后事件不会重复触发。

## 最小代码骨架

```ts
export class BizObserver extends Base3DObserver<BizCanvas> {
  constructor(view: BizCanvas) {
    super(view);
  }

  protected _onLButtonDown(pos: FSMath.Vector2, fnKey?: FSApp.Event.FnKey): boolean {
    super._onLButtonDown(pos, fnKey);
    if (!this._view.pickOptions.boxSelectEnable) {
      this._isLButtonDown = false;
    }
    return false;
  }

  protected _onMove(pos: FSMath.Vector2, fnKey?: FSApp.Event.FnKey): boolean {
    if (this._isLButtonDown) {
      this.selectionBox.screenEndPoint = pos.clone();
      this.selectionBox.updateSelectionRect();
      this.selectionBox.setActive(
        this.selectionBox.screenStartPoint.distanceTo(this.selectionBox.screenEndPoint) > this.selectionBox.activeLength
      );
    } else {
      const ids = this._view.pickHelper.pick(pos);
      this._view.hover(ids);
    }
    return false;
  }

  protected override _onLButtonUp(pos: FSMath.Vector2, fnKey?: FSApp.Event.FnKey): boolean {
    this._isLButtonDown = false;

    if (this.selectionBox.active) {
      const isLeftToRight = this.selectionBox.screenStartPoint.x < this.selectionBox.screenEndPoint.x;
      void this._view.pickHelper
        .pickArea(this.selectionBox.box.clone(), isLeftToRight, this._view.selectionMode)
        .then(ids => {
          this._view.select(this._getSelectedIds(ids));
          this.selectionBox.setActive(false);
        });
    } else {
      const ids = this._view.pickHelper.pick(pos);
      this._view.select(this._getSelectedIds({ selectIdsSet: new Set(ids), unSelectSet: new Set() }));
    }

    return false;
  }
}
```

PickStrategy 模板：

```ts
export class BizBodyPickStrategy extends PickStrategy {
  public override pick(pickResults: FSApp.View.Canvas.IPickResult[]): number[] {
    const picked = pickResults.find(item => typeof item !== 'number' && item.display) as FSApp.View.Canvas.IPickResult;
    const body = this.findBodyAncestor(picked?.display as FSApp.View.Three.ThreeDisplay);
    return body?.entity.canSelect() ? [body.entity.id] : [];
  }

  public pickArea(pickResults: FSApp.View.Canvas.IPickResult[], isLeftToRight: boolean, box: THREE.Box2): number[] {
    const ids = pickResults
      .map(result => this.findBodyAncestor(result.display as FSApp.View.Three.ThreeDisplay))
      .filter(display => display && (!isLeftToRight || box.containsBox(display.screenBox)))
      .flatMap(display => collectBodyAndDescendants(display.entity));

    return Array.from(new Set(ids));
  }
}
```

## Pick 处理规则

- `pickHelper` 内部会处理底层 pick 结果；业务 observer 默认只处理 id 集合。
- 框选时要检查 box/frustum 与 entity/display 的关系。
- 检查 pick 对象的 unselectable、hidden、disabled 状态。
- 多选逻辑要显式处理 ctrl/shift/alt/escape。
- 点云相关交互先补读 `../../pitfalls/pointcloud-pick-selection.md`：点级 pick 走 `pickPointCloud()` 的 ray/bbox/closest point，点级 selection 写 slice `statusView`，不能把 point index 直接传给 `view.select(...)`。
- 普通 pick/selection/inputStack 链路先补读 `../../pitfalls/pick-selection-input-chain.md`，observer priority 和 consumed 规则先补读 `../../pitfalls/inputstack-observer-order.md`。

正例：

- hover、click、box-select 共用同一套 entity id 归一化规则，并保留 `canSelect()` / `shouldPickParent` 判断。
- 临时 observer 明确 priority，处理完成才返回 `true`，并在命令取消或 view cleanup 时 `removeObserver(...)`。

反例：

- 直接在 DOM 上监听鼠标事件并调用 `view.select(...)`。
- 点云 hover 用 `pickPointCloud()`，click 却把最近点 `pointIndex` 当 entity id 选择。
- observer 一律返回 `true`，截断默认 selection、controller 或 command 输入。

## 决策检查点

- 如果找不到 observer 挂接入口，先停下，不要只新增 observer 类。
- 如果 pick 返回结构不明，先写类型守卫或按当前 pick helper 示例处理，不要假设一定有 `display.entity`。
- 如果 observer 需要改模型，优先转 command 或 handle；只有纯交互临时状态留在 observer 内。

## 失败与回退

- 找不到 keyboard/hotkey 管线：只实现鼠标事件，把快捷键列为后续接入点。
- 找不到 dispose 钩子：避免注册 window/document listener；确实需要时必须同时补释放路径。
- 多视图下状态可能串台：不要用静态字段缓存当前 view，状态放在 observer 实例上。

## 验证清单

- 单击、移动、拖拽不会互相污染状态。
- 空白点击是否清 selection 符合当前 view 配置。
- view 销毁后 observer 不再响应事件。
- 多 view 下 observer 状态不串台。
- pick 到不可选对象时不会误选。

## 实测 Prompts

- “新增一个 hover + click selection observer，要求支持多选键并避免多视图串台。”
- “审查一个 observer 是否错误地直接修改模型而没有走 command/handle。”
- “当前仓库 pick 返回值结构不稳定时，如何写 observer 的防御性处理？”

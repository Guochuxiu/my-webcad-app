---
name: webcad-entity-display-development
description: 在下游业务库中开发通用 WebCAD Entity 与 Display 扩展。用于新增 FSCore.Model.CADEntity、Group/BatchMesh/BatchLine/ThreeDisplay 显示类、registerDisplayType 映射、dirty/update、pick、screenBox、onCleanup/dispose。
---

# WebCAD Entity-Display 开发

使用本模板时，目标是让“模型数据”通过 document/entity 链路进入 WebCAD，并通过 display 注册链稳定显示。

代码产出或实测时，必须使用目标仓库真实存在的 Entity/Display 基类、display 创建方法、dirty/update 钩子和清理钩子。找不到时停止并说明证据不足，不要用 `CurrentCadEntity`、`CurrentThreeDisplay`、`XxxEntity` 等占位结构冒充可落地代码。

优先参考 `cadnginx` 与 `webcad-weld` 的真实模式：业务分组实体常继承 `FSCore.Model.Group`，批量面/线显示常继承 `Display.BatchMeshDisplay` / `Display.BatchLineDisplay`，聚合 display 常继承 `FSApp.View.Three.Group` 并合并 `screenBox`，复杂三维对象可参考 `ObjectNodeDisplay` 的 `_createViewObj()`、`_onMaterialDirty()`、`_onGeometryDirty()`、`createPickObject()`、`onCleanup()`。

## 先找锚点

不要假设业务库目录固定。先在当前工作区搜索同类实现，再决定落点：

- Entity 示例：搜索 `extends .*Entity`、`FSCore.Model.Group`、`CADEntity`、`ObjectNode`、`dirtyGeometry`、`dirtyMaterial`、`destroy()`。
- Display 示例：搜索 `ObjectNodeDisplay`、`BatchMeshDisplay`、`BatchLineDisplay`、`FSApp.View.Three.Group`、`screenBox`、`onCleanup`。
- 映射注册：搜索 `registerDisplayType`、`createDisplay`、`_registerDisplay`、`displayMap`。
- 清理示例：搜索 `onCleanup`、`dispose()`、`removeFromParent()`、`destroy()`。
- 创建入口：搜索当前业务对象是由 command、loader、handle 还是 document API 创建。
- 当前源码锚点：`fscadweb 模块：app/view/canvas.ts:388` 的 `createDisplayRegistered()` 按 `entity.constructor` 精确查表；`fscadweb 模块：app/view/display.ts:57` 绑定 entity signals；`fscadweb 模块：app/view/three/display/three_display.ts:274` 懒创建 `viewObj`；`fscadweb 模块：app/view/three/display/three_display.ts:546` 清理 `viewObj` / `pickObj`。

## 常用基类

- `FSCore.Model.CADEntity<TMeta>`：普通业务实体。
- `FSCore.Model.Group`：实体分组。
- `FSApp.View.Three.Group`：分组 display。
- `FSApp.View.Three.ThreeDisplay<TEntity, TObject3D>`：底座通用 Three display；业务库里更常见的是继承已封装好的 `ObjectNodeDisplay`、`BatchMeshDisplay`、`BatchLineDisplay` 或 `Group`。
- `Display.BatchMeshDisplay<TEntity>`：批量 mesh display。
- `Display.BatchLineDisplay<TEntity>`：批量 line display。
- `FSApp.View.Three.DomLabel`：DOM label display。

## 开发步骤

1. 判断数据是否需要进入 document：需要被 pick、selection、dirty、clear 管理时，应建 Entity。
2. 新增 entity 类，继承当前仓库最接近的实体基类。
3. entity 只保存数据、状态和必要元信息，不持有渲染资源。
4. 新增 display 类，负责创建/更新/清理 Three 或 DOM 资源。
5. 在 display 中实现必要的 `screenBox`、`onCleanup()` 或 dispose 逻辑。
6. 在 canvas 注册 `registerDisplayType(EntityClass, e => this.createDisplay(e, DisplayClass))`。
7. 通过 command、loader 或 document API 创建 entity，不从 display 反向创建模型。
8. 验证 entity 数据变化能触发 display 更新或 dirty 刷新。

## 决策检查点

- 如果找不到 entity/display 基类，先停下并说明“缺少模型或显示扩展锚点”，不要自造继承链。
- 如果找不到 display 注册入口，先补查 canvas/view 初始化链，不要直接把 Three 对象塞进 scene。
- 如果新增的是已有 Entity 的子类，当前 `fscadweb` 精确按 constructor 查表，必须注册子类自身；不要期待父类 display 自动兜底。
- 如果业务对象不需要 pick、selection、clear 或 dirty 管理，可以作为临时视图对象处理，但必须说明生命周期由谁清理。

## Entity 骨架

```ts
export class BizGroupEntity extends FSCore.Model.Group {
  shouldPickParent = false;
}

export class BizSceneEntity extends SesSceneEntity {
  public async loadSes(files: File[] | ArrayBuffer | Blob, entityClass = SesNodeEntity) {
    const result = await super.loadSes(files, entityClass);
    result.nodes?.forEach(node => this.applyNodeBusinessState(node as SesNodeEntity));
    return result;
  }

  private applyNodeBusinessState(node: SesNodeEntity) {
    node.canPick = false;
    // 只设置业务状态、材质引用或 dirty 标记；不在 entity 中创建渲染对象。
  }
}
```

## Display 骨架

```ts
export class BizGroupDisplay extends FSApp.View.Three.Group {
  get screenBox(): THREE.Box2 {
    const box = new THREE.Box2();
    this.childItems.forEach((child: FSApp.View.Three.ThreeDisplay) => {
      child.screenBox && box.expandByBox(child.screenBox);
    });
    return box;
  }
}

export class BizFaceDisplay extends Display.BatchMeshDisplay<BizFaceEntity> {
  protected get materialCacheKey(): string {
    return 'BizFaceDisplay';
  }

  protected get color(): any {
    return materialConfig.bizFace.color;
  }

  protected _createMaterial(): THREE.Material {
    const material = super._createMaterial();
    if (material instanceof THREE.MeshPhysicalMaterial) {
      material.polygonOffset = true;
      material.polygonOffsetFactor = 2;
      material.polygonOffsetUnits = 2;
      material.transparent = true;
    }
    return material;
  }
}

export class BizObjectDisplay extends Display.ObjectNodeDisplay<BizObjectEntity> {
  protected _createViewObj(): THREE.Object3D {
    return this.entity.geometry;
  }

  protected _onMaterialDirty(): void {
    super._onMaterialDirty();
    // 根据 entity flag 或业务状态更新材质。
  }

  protected _onGeometryDirty(): void {
    super._onGeometryDirty();
    // 同步线可见性、morphTarget、批量几何等。
  }

  public onCleanup(): void {
    // 释放 clone 材质、缓存、DOM、listener、外部资源引用。
    super.onCleanup();
  }
}
```

## 注册模板

```ts
protected _registerDisplay() {
  super._registerDisplay();
  this.registerDisplayType(BizGroupEntity, entity => this.createDisplay(entity, FSApp.View.Three.Group));
  this.registerDisplayType(BizFaceEntity, entity => this.createDisplay(entity, BizFaceDisplay));
  this.registerDisplayType(BizObjectEntity, entity => this.createDisplay(entity, BizObjectDisplay));
  this.registerDisplayType(FSCore.Model.DomLabel, entity => this.createDisplay(entity, FSApp.View.Three.DomLabel));
}
```

## Pick 与状态规则

- 需要参与选择的 entity/display 必须确认 pick 策略和 selectable flag。
- 不参与选择的辅助对象要明确设为不可 pick 或不可选。
- display 的 `screenBox` 会影响框选、hover 或 UI 定位时，需要按子 display 合并。
- 状态材质优先走当前仓库 material provider/state provider。
- 当前 `Canvas.createDisplayRegistered()` 使用 `entity.constructor` 精确匹配。若 `BizSpecialFaceEntity extends BizFaceEntity` 需要不同 display，必须额外注册 `BizSpecialFaceEntity`；只注册 `BizFaceEntity` 不会匹配子类。

## 失败与回退

- 找不到 `screenBox` 同类实现：先只保留显示能力，把框选/hover 验收标记为待补证据。
- 找不到 dirty API：复用当前仓库已有 update/refresh/rebuild 机制，并在方案里写明触发点。
- 找不到 dispose/onCleanup 钩子：沿父类销毁链补查到底座源码；证据不足时不要新增长期持有的 geometry/material/listener。
- 找不到子类 display 注册证据：不要靠注册顺序猜测继承匹配，先核实目标版本 `createDisplayRegistered()` 的实现。

## 实测 Prompts

- “新增一个可被选择的业务实体和对应 display，要求支持 clear 后释放资源。”
- “把一个只用于预览的 Three 对象改造成符合当前仓库生命周期的 entity/display 或临时层方案。”
- “审查一个 display 实现是否遗漏 pick、screenBox、dirty 或 dispose。”

## 验证清单

- 创建 entity 后 canvas 能找到 display 映射。
- clear/destroy 后 entity 与 display 都被清理。
- pick/hover/select 行为符合预期。
- display 释放 geometry/material/DOM/listener。
- 修改 entity 数据后 display 能更新或被 dirty 机制刷新。

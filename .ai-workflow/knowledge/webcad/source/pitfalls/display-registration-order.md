# Display 注册匹配版本差异

## 问题描述

旧口径曾把父子类注册顺序当作 display 命中的硬性条件。这个说法不适用于当前知识库记录的 fscadweb display 注册实现。

当前 `fscadweb 模块：app\view\canvas.ts:365` 的 `registerDisplayType(...)` 只把 `entityCls` 写入 `_entityDisplayMap`；`canvas.ts:388` 的 `createDisplayRegistered(entity)` 使用：

```ts
this._entityDisplayMap.get(entity.constructor as any)
```

也就是说，当前实现是按 `entity.constructor` 精确查表，不是按 `instanceof` 遍历注册表。

## 当前源码下的真实风险

- 子类 Entity 不会自动命中父类 Entity 的 Display 注册。
- 注册顺序通常不决定父类/子类匹配结果；真正决定结果的是有没有注册 entity 的实际 constructor。
- 如果不同版本或业务库覆写了 `createDisplayRegistered()`，才需要重新核实是否存在“首次匹配”顺序风险。

## 典型错误代码

```typescript
class MySpecialFace extends Face {}

// 当前 fscadweb 精确按 constructor 查表：这里只注册 Face。
this.registerDisplayType(Face, e => this.createDisplay(e, FaceDisplay));

// 创建 MySpecialFace 时，createDisplayRegistered() 查 MySpecialFace constructor，
// 不会自动退回 FaceDisplay。
app.createDisplay(new MySpecialFace(), view);
```

## 正确写法

```typescript
class MySpecialFace extends Face {}

this.registerDisplayType(Face, e => this.createDisplay(e, FaceDisplay));
this.registerDisplayType(MySpecialFace, e => this.createDisplay(e, MySpecialFaceDisplay));
```

如果业务库确实需要父类 display 兜底，必须先在目标源码中找到覆写的 `createDisplayRegistered()` 或其它 fallback 机制；找不到时不要假设存在。

## 版本 / 实现差异口径

- 当前 `fscadweb 模块：app/view/canvas.ts:388`：精确 constructor map lookup。
- 当前 `cadnginx 模块：view/cad_3d_canvas.ts:66`：只调用 `registerDisplayType(...)`，没有覆写匹配算法。
- 旧版本、打包产物或业务库自定义 Canvas 如采用 `instanceof` 继承链 fallback，才可能出现父类注册捕获子类的顺序问题。

## 影响范围

- 新增继承自已有 Entity 的业务子类，并希望使用不同 Display。
- 新增业务 Canvas 时复制旧模板，误以为注册顺序能解决子类 display 命中。
- 审查 display 不生效问题时，需要先查 `createDisplayRegistered()` 实现，而不是直接调整注册顺序。

## 检查要点

- 当前目标版本的 `createDisplayRegistered()` 是精确 constructor 查表，还是存在 `instanceof` 继承链 fallback。
- 新增 Entity 子类是否注册了自身 constructor。
- `registerDisplayType(...)` 是否在实际使用的 Canvas 构造/初始化路径中执行。
- 创建失败时控制台是否出现 `${entity.constructor.name} is not registered!`。

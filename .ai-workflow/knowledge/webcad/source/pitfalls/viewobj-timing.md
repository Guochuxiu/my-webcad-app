# viewObj 懒创建时机

## 问题描述

`ThreeDisplay.viewObj` 是懒创建的——首次访问 getter 时才调用 `_createViewObj()`。当前 `fscadweb 模块：app/view/three/display/three_display.ts:274` 的 getter 会在首次访问时创建并缓存对象；`pickObj` 也在 `three_display.ts:125` 懒创建。

风险不在于“必须等某个 `_init()` 钩子”，而在于业务代码不要假设构造阶段、注册阶段或 display tree 还没有接好时 `viewObj` 已经稳定存在。且 `_createViewObj()` 只会被调用一次，后续不能通过重新赋值 `this.viewObj` 来替换对象。

## 典型错误代码

```typescript
class MyDisplay extends ThreeDisplay {
    constructor(context, entity) {
        super(context, entity);
        // 构造阶段不要把 viewObj 当作已完成的渲染对象来绑定外部生命周期。
        externalRegistry.add(this.viewObj);
    }
}
```

```typescript
class MyDisplay extends ThreeDisplay {
    protected _onGeometryDirty(): void {
        // 无效！viewObj 不能被替换，只能修改属性
        this.viewObj = new THREE.Mesh(newGeometry, material);
    }
}
```

## 正确写法

```typescript
class MyDisplay extends ThreeDisplay {
    protected _createViewObj(): THREE.Object3D {
        // 在这里创建和初始化
        const obj = new THREE.Mesh(geometry, material);
        obj.position.set(0, 0, 0);
        return obj;
    }

    protected _onGeometryDirty(): void {
        // 修改已有 viewObj 的属性，而非替换
        (this.viewObj as THREE.Mesh).geometry.dispose();
        (this.viewObj as THREE.Mesh).geometry = this._buildGeometry();
    }
}
```

### viewObj 生命周期时序

```
ThreeDisplay 构造
  → 首次访问 this.viewObj getter
    → _createViewObj() 被调用    ← 在这里创建 Object3D
    → 结果被缓存
  → 后续访问 this.viewObj       ← 返回缓存值
  → dirty 回调触发时            ← this.viewObj 已存在，可以安全操作
```

## 影响范围

- 所有继承 `ThreeDisplay` 的业务 Display
- 同理适用于 `pickObj` 和 `physicsBody`（也是懒创建）
- 初始化逻辑如果放在错误的生命周期阶段，容易把未加入 display tree / pickContext 的对象泄漏到外部缓存或 scene

## 检查要点

- 是否在构造函数、注册函数或 display tree 尚未接好时访问了 `this.viewObj`
- 是否尝试重新赋值 `this.viewObj`（应该修改已有对象的属性）
- 对 viewObj 的操作是否都在 `_createViewObj()` 或 dirty 回调中
- `_createViewObj()` 中是否正确初始化了所有需要的属性

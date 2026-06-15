# removeFromParent 级联销毁

## 问题描述

调用 `removeFromParent()` 会递归让所有子节点先 `removeFromParent()`，然后对自身调用 `destroy()`。`destroy()` 会 dispose 所有 Signal、清理内部状态、标记 `isDestroyed = true`。

这不是"临时从场景摘下"，而是真正的销毁。如果其他代码仍持有已销毁实体的引用并尝试使用，会导致运行时异常。

## 典型错误代码

```typescript
const child = new MyEntity(geometry);
parent.addChild(child);

// 某个时刻
parent.removeFromParent();
// child 已经被 destroy 了！

// 但其他地方还持有 child 引用
child.dirty();  // 异常！实体已销毁
```

## 正确写法

### 方式一：监听销毁信号，及时清理引用

```typescript
child.signalRemoved.listen(() => {
    this._childRef = null;
});

// 使用前检查
if (this._childRef && !this._childRef.isDestroyed) {
    this._childRef.dirty();
}
```

### 方式二：不缓存引用，每次从层级中获取

```typescript
const child = parent.findChildByName('myChild');
if (child && !child.isDestroyed) {
    child.dirty();
}
```

## 影响范围

- 所有缓存 Entity 引用的地方
- 跨组件持有子 Entity 引用而未处理销毁的场景
- `Document.clear()` 也会触发整棵实体树的级联销毁

## 检查要点

- 缓存 Entity 引用时是否监听了 `signalRemoved`
- 使用缓存的 Entity 前是否检查 `isDestroyed`
- `removeFromParent()` 的调用点是否理解了级联销毁行为
- "从场景移除"在当前实现里带有销毁含义，不能当临时摘下用

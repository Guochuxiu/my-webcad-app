# 修改 Entity 数据后未调用 dirty*()

## 问题描述

修改了 Entity 的几何数据、材质、位置等属性后，没有调用对应的 `dirty` 方法通知 Display 层。结果是渲染不更新，但不会报错——静默失败，容易误判为其他问题。

## 典型错误代码

```typescript
class MyEntity extends CADEntity<IMyGeometry> {
    public setVertices(v: number[]) {
        this._geometry.vertices = v;
        // 忘记调用 dirtyGeometry()！Display 不知道数据变了
    }
}
```

## 正确写法

```typescript
class MyEntity extends CADEntity<IMyGeometry> {
    public setVertices(v: number[]) {
        this._geometry.vertices = v;
        this.dirtyGeometry();  // 通知 Display 几何数据已变化
    }

    public setColor(c: number) {
        this._geometry.color = c;
        this.dirtyMaterial();  // 材质变化
    }

    public moveTo(x: number, y: number, z: number) {
        this.setPosition({ x, y, z });
        this.dirtyPosition();  // 位置变化
    }

    public resetAll() {
        this._geometry.vertices = [];
        this._geometry.color = 0xffffff;
        this.setPosition({ x: 0, y: 0, z: 0 });
        this.dirty();  // 不确定哪些变了时，全量标记
    }
}
```

### dirty 方法速查

| 方法 | 触发范围 | 使用场景 |
|------|---------|---------|
| `dirtyGeometry()` | 几何数据 | 顶点、面片、索引变化 |
| `dirtyMaterial()` | 材质 | 颜色、纹理、透明度变化 |
| `dirtyPosition()` | 位置 | 平移、移动实体 |
| `dirty()` | 全部 | 不确定或批量修改 |

## 影响范围

- 所有修改 `_geometry` 属性的 setter 和方法
- 业务 Entity 的自定义属性变更方法
- 批量修改多个属性时如果漏掉 dirty，画面停留在旧状态

## 检查要点

- 所有修改 `_geometry` 属性的方法是否跟着调用了 `dirty*()`
- 批量修改后是否调用了 `dirty()` 全量刷新
- 不确定时优先用 `dirty()`，宁可冗余刷新也不能漏

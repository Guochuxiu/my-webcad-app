# 业务 Entity 扩展模板

## 适用场景

- 业务库需要新增自己的模型对象
- 该对象需要进入 `Document` 和实体树
- 该对象后续需要被 Display、选择、命令或 Loader 消费

## 模板

```ts
import { FSCore } from '@fsdev/cadnginx';

type TGeometry = unknown;

export class BusinessEntity extends FSCore.Model.CADEntity<TGeometry> {
    constructor(geometry: TGeometry) {
        super(geometry);
    }

    public updateGeometry(next: TGeometry) {
        this.geometry = next;
        this.dirtyGeometry();
    }

    public updateBusinessState() {
        this.dirtyMaterial();
    }

    public updateTransformLikeState() {
        this.dirtyPosition();
    }
}
```

## 必查点

- 几何变化是否调用 `dirtyGeometry()`
- 外观变化是否调用 `dirtyMaterial()`
- 位置变化是否调用 `dirtyPosition()`
- 是否真的需要新 Entity，而不是复用现有 Entity 组合

## 常见错误

- 改数据但不发 dirty
- 把 UI 状态硬塞进底层几何对象
- 删除对象时误判 `removeFromParent()` 语义

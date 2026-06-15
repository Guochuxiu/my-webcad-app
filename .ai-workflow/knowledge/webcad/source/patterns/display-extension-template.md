# 业务 Display 扩展模板

## 适用场景

- 业务库需要为自己的 Entity 定义显示方式
- 需要接入 Three.js 对象、pick、outline、bounding box 或 layer

## 模板

```ts
import * as THREE from 'three';
import { FSApp } from '@fsdev/cadnginx';
import { BusinessEntity } from '../model/business_entity';

export class BusinessDisplay extends FSApp.View.Three.ThreeDisplay<BusinessEntity> {
    protected _createViewObj() {
        return new THREE.Object3D();
    }

    protected _onGeometryDirty() {
        super._onGeometryDirty();
        // update geometry here
    }

    protected _onMaterialDirty() {
        super._onMaterialDirty();
        // update material/visibility here
    }

    protected _onPositionDirty() {
        super._onPositionDirty();
    }

    public onCleanup() {
        super.onCleanup();
        // cleanup extra resources here
    }
}
```

## 必查点

- 是否真的继承对了 `Display` / `ThreeDisplay`
- 是否错误过早访问 `viewObj`
- 是否需要 `pickObj`
- 是否在 `onCleanup()` 中释放了额外资源
- 是否在对应 Canvas 里做了 `registerDisplayType()`

## 常见错误

- 只写 Display 类，不补注册链
- geometry 更新后不调用父类逻辑，导致边界框不同步
- 忘记清理 outline、pick 或 observer

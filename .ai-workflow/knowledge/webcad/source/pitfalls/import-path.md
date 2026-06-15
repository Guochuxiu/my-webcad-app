# 导入路径

## 规则

- 业务库默认从 `@fsdev/cadnginx` 导入
- 优先使用命名空间入口，不要假设所有类都有平铺导出
- 拿不到的能力先查 `src/index.ts`，再决定是否应改为 `FSApp.*`、`FSCore.*`、`Model.*`、`Kinematic.*`
- 不要直接从 `@fsdev/fscadweb` 或其内部路径导入

## 正确示例

```ts
import { CadApp, View, Model, FSApp, FSCore, Kinematic, Constants } from '@fsdev/cadnginx';

class BusinessDisplay extends FSApp.View.Three.ThreeDisplay<Model.ObjectNode> {}

const bit = FSCore.Util.NumberBitOps.getBit(status, 1);
const joint = new Kinematic.Link('arm');
const type = Constants.JointType.REVOLUTE;
```

## 错误示例

```ts
import { ThreeDisplay, CADEntity } from '@fsdev/fscadweb';
import { Signal } from '@fsdev/fscadweb/dist/core/signal';
import { Helper } from '../../fscadweb 模块：utils/helper';
```

## 审查重点

- 是否直接依赖 `@fsdev/fscadweb`
- 是否生成了不存在的平铺导出名
- 是否出现内部路径穿透

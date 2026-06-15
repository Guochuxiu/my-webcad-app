# 运动学

## 源码用法摘要

- `fscadweb 模块：core\kinematics\link.ts:9`：全局 `linkMap`
- `fscadweb 模块：core\kinematics\link.ts:19`：`export class Link`
- `fscadweb 模块：core\kinematics\link.ts:218`：`Link` 构造函数
- `fscadweb 模块：core\kinematics\link.ts:257`：`link.setEntity(entity, visual?)`
- `fscadweb 模块：core\kinematics\link.ts:320`：`link.createJoint(...)`
- `fscadweb 模块：core\kinematics\link.ts:341`：`link.update(recursive = true, parentWorldMatrix?)`
- `fscadweb 模块：core\kinematics\link.ts:352`：`entity.dirtyPosition({ linkWorldMatrix })`
- `fscadweb 模块：core\kinematics\link.ts:400`：`link.unbindEntity(...)`
- `fscadweb 模块：core\kinematics\link.ts:448`：`link.remove()`
- `fscadweb 模块：core\kinematics\joint.ts:8`：全局 `jointMap`
- `fscadweb 模块：core\kinematics\joint.ts:44`：`export class Joint`
- `fscadweb 模块：core\kinematics\joint.ts:214`：真实拼写 `joint.setStartegy(...)`
- `fscadweb 模块：core\kinematics\joint.ts:248`：`joint.setJointValue(value)`
- `fscadweb 模块：core\kinematics\joint.ts:255`：`joint.getJointValue()`
- `fscadweb 模块：core\kinematics\joint.ts:262`：`joint.bindLink(link, focus?)`
- `fscadweb 模块：core\kinematics\joint.ts:278`：`joint.remove()`
- `fscadweb 模块：core\kinematics\joint.ts:305`：`joint.changeParentLink(link)`
- `fscadweb 模块：core\kinematics\joint.ts:332`：真实拼写 `joint.setStartegyParam(...)`
- `fscadweb 模块：core\constants\kinematic_types.ts:1`：`JointType`
- `cadnginx 模块：utils\kinematic_util.ts:10`：`loadURDF(urdf)`
- `cadnginx 模块：utils\kinematic_util.ts:32`：`generateKinematic(linkObjects, joinObjects)`
- `cadnginx 模块：utils\kinematic_util.ts:87`：`createJoint(...)`
- `cadnginx 模块：utils\kinematic_util.ts:323`：`exportURDF(rootLink?)`
- `cadnginx 模块：utils\kinematic_util.ts:335`：`buildURDFXML(...)`

## 当前入口

当前仓库 `src/index.ts` 通过 `Kinematic` 命名空间导出：

- `Kinematic.Link`
- `Kinematic.Joint`
- `Kinematic.RevoluteStrategy`
- `Kinematic.PrismaticStrategy`
- `Kinematic.FixedStrategy`

关节类型枚举使用 `Constants.JointType`。

## 最小示例

```ts
import { Kinematic, Constants, FSMath } from '@fsdev/cadnginx';
import * as THREE from 'three';

const base = new Kinematic.Link('base', baseEntity);

const shoulder = base.createJoint(
  Constants.JointType.REVOLUTE,
  'shoulder',
  new THREE.Vector3(0, 0, 0),
  new THREE.Quaternion()
);

shoulder.setStartegy(
  new Kinematic.RevoluteStrategy(
    shoulder,
    new THREE.Vector3(0, 0, 1),
    new FSMath.Interval(-Math.PI / 2, Math.PI / 2),
    0
  )
);

shoulder.setJointValue([Math.PI / 4]);
base.update(true);
```

## 常用对象

- `link.createJoint(...)`
- `link.setEntity(entity, visual?)`
- `link.unbindEntity(removeEntityList?)`
- `joint.bindLink(link)`
- `joint.changeParentLink(link)`
- `joint.setJointValue(value)`
- `joint.getJointValue()`
- `link.update(true)`
- `link.getJoints()`
- `link.getAllDescendantsLinks()`
- `link.remove()`

注意真实 API 拼写是 `setStartegy()` 和 `setStartegyParam()`，不是 `setStrategy()` / `setStrategyParam()`。

## Link / Joint 生命周期事实

- `Link` 构造时会写入全局 `linkMap`，`Joint` 构造时会写入全局 `jointMap`。
- `Link.remove()` 会递归删除子关节、从 `linkMap` 删除自己，并调用 `unbindEntity()` 清除 entity 反向绑定。
- `Joint.remove()` 会递归删除 child link、从 `jointMap` 删除自己、`signalOverLimit.dispose()`，并清空 parent/strategy。
- `link.setEntity(entity, visual?)` 会先解绑 entity 上已有的其他 link，再把 entity 放入当前 link 的 `_entityList` 和 visual map。
- `link.update(true)` 会对当前 link 绑定的每个 entity 调 `dirtyPosition({ linkWorldMatrix })`，再递归更新子 link。
- 修改 joint 值只会改运动学策略/矩阵；要让实体显示更新，必须从 root link 或正确父链执行 `rootLink.update(true)` / `rootLink.update()`。
- `linkMap` / `jointMap` 是模块级全局 Map。多模型、多 view 或重复导入时，不能只丢掉 JS 引用，必须走 `remove()` 或明确清理策略。

## URDF 工具关系

- `loadURDF(file)` 从 XML 解析出 `linkObjects` 和 `joinObjects`。
- `generateKinematic(linkObjects, joinObjects)` 先创建 `Link`，再通过 `createJoints(...)` / `createJoint(...)` 绑定父子 Link 和 Joint。
- `createJoint(...)` 内部调用 `parentLink.createJoint(...)`，再通过 `createJointStartegy(...)` 设置具体策略，并保持源码中的 `Startegy` 拼写。
- `exportURDF(rootLink?)` 从指定 root link 的 descendants 或全局 `linkMap` / `jointMap` 导出 link/joint 对象。
- `buildURDFXML(links, joints)` 把导出的结构写回 XML 字符串。
- SES 导入会在发现 URDF 后调用 `loadURDF()` / `generateKinematic()`，再按 visual/entity 名称绑定，并在末尾调用 root link `update()`；详见 `business/resource-and-ses-persistence.md`。

## 正例

```ts
const rootLink = links.find((link) => link.isRoot);
const joint = rootLink?.getJoints().find((item) => item.name === 'shoulder');

joint?.setJointValue([Math.PI / 4]);
rootLink?.update(true);
```

- 关节驱动后从 root link 更新，保证所有子 link 的 `dirtyPosition()` 都被触发。
- 删除整棵运动学树时调用 root `link.remove()`，让 `linkMap`、`jointMap`、entity link 和 joint signal 一起清理。
- 手写 URDF 导入导出时优先复用 `loadURDF()`、`generateKinematic()`、`exportURDF()`、`buildURDFXML()`。

## 反例

```ts
joint.setStrategy(strategy);
joint.setJointValue([value]);
entity.object3D.matrix.copy(matrix);
```

- 当前真实 API 没有 `setStrategy()`；文档和代码都必须保留 `setStartegy()` 拼写。
- 直接改 `Object3D` 或 display matrix 绕开 `Link/Joint`，不会维护 `linkMap`、`jointMap`、entity link、URDF 导出和 `dirtyPosition()`。
- 只删除 entity，不删除对应 link/joint，可能在全局 map 中留下旧运动学对象。

## 审查清单

- 是否继续使用错误的平铺导入：`import { RevoluteStrategy } from '@fsdev/cadnginx'`
- 是否把 `JointType` 写成未命名空间化的全局枚举
- 驱动关节后是否忘了从根 `Link` 执行 `update(true)`
- 是否把 `setStartegy` / `setStartegyParam` 误改成不存在的正确拼写
- 是否处理 `linkMap` / `jointMap` 全局状态清理，尤其是重复导入、模型卸载和多 view 场景
- 是否说明 URDF 与 SES 的绑定关系，而不是只谈手写 `Link/Joint`

## 最小验证

- 创建 root link、joint、child link，调用 `joint.setJointValue(...)` 后执行 `rootLink.update(true)`，确认绑定 entity 收到位置 dirty。
- 调 `rootLink.remove()` 后检查相关 link/joint 不再存在于 `FSCore.Kinematic.linkMap` / `jointMap`。
- 对含 URDF 的 SES 调 `ResourceManager.loadFromFiles()`，确认返回的 `links` 可找到 root link，且 `rootLink.getJoints()` 有对应 joint。

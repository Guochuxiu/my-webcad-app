# Entity / CADEntity / Dirty / Destroy

## 适用场景

当需求涉及新增模型对象、修改几何/材质/位置、pick 身份、selection 状态、实体删除、Document.clear、运动学绑定、或 display 不刷新问题时，先读本页。

这页约束业务库不要把模型状态塞进 display 或裸 Three 对象；需要进入 WebCAD 生命周期的业务数据应落到 `Entity` / `CADEntity` 及其 dirty / destroy 链。

## 源码用法摘要

- `fscadweb 模块：core\model\entity.ts:46`：`Entity` 基类定义
- `fscadweb 模块：core\model\entity.ts:57`：`shouldPickParent` 控制 pick 身份是否上溯父级
- `fscadweb 模块：core\model\entity.ts:66`：dirty、removed、child、flag、parent signals
- `fscadweb 模块：core\model\entity.ts:159`：`destroy()` dispose signals、释放 id、派发全局 destroy signal
- `fscadweb 模块：core\model\entity.ts:188`：`pick()` 按 `shouldPickParent` 返回 pick 身份
- `fscadweb 模块：core\model\entity.ts:263`：`removeChild()` 会派发 removed 并 `child.destroy()`
- `fscadweb 模块：core\model\entity.ts:287`：`removeFromParent()` 递归移除子节点
- `fscadweb 模块：core\model\entity.ts:368`：`dirty(...)` 派发 `signalDirty` 并通知父节点
- `fscadweb 模块：core\model\entity.ts:381`：`dirtyGeometry()` / `dirtyMaterial()` / `dirtyPosition()` / `dirtyPreview()`
- `fscadweb 模块：core\model\entity.ts:397`：`canSelect()` 检查 removed / unselectable
- `fscadweb 模块：core\model\cad\cadentity.ts:37`：`CADEntity` 增加 geometry、localMatrix、transform、link 等 CAD 语义
- `fscadweb 模块：core\model\cad\cadentity.ts:592`：`setMorphTargetValue(..., dirtyGeometry)`
- `fscadweb 模块：core\model\cad\cadentity.ts:622`：`CADEntity.dirtyPosition(...)` 刷新 world matrix cache、position signal，再调用父类 dirty
- `fscadweb 模块：core\model\cad\cadentity.ts:650`：`CADEntity.removeFromParent(...)` 后会 `link.unbindEntity([this])`
- `fscadweb 模块：core\document.ts:24`：`Document.addEntity(...)` 维护 entity map
- `fscadweb 模块：core\document.ts:53`：`Document.clear()` 触发 root 子节点移除并清空 map

## 生命周期事实

- `Entity` 是数据身份、树结构、dirty、flag、pick 身份和 destroy 的根。
- `dirtyGeometry()`、`dirtyMaterial()`、`dirtyPosition()`、`dirtyPreview()` 会映射成不同 `EntityEventType`；display 依赖这些类型设置 geometry/material/position/preview dirty。
- `removeChild()` 当前会 `child.signalRemoved.dispatch(...)` 后直接 `child.destroy()`；它不是普通数组删除。
- `removeFromParent()` 会先递归让子节点移除，再把自己从父节点移除。业务删除逻辑要考虑整棵子树。
- `Entity.destroy()` 会释放 signals 和 id，并派发全局 destroy signal；当前 `_children` 是 `Set`，不要把单独调用 `destroy()` 当成可靠的树摘除入口，业务删除优先走 `removeFromParent()` / `removeChild()` / `Document.clear()` 链。
- `CADEntity.dirtyPosition()` 会让自身和子孙 world matrix cache 失效；存在 kinematics link 时还会根据 link visual matrix 更新 local matrix。
- `canSelect()` 会拒绝 removed / unselectable entity；pick 到对象后还要考虑 `shouldPickParent`。

## 正例

- 修改几何数据后调用 `dirtyGeometry()`；修改材质、状态材质或可见样式后调用 `dirtyMaterial()`；修改位置、矩阵、运动学姿态后调用 `dirtyPosition()`。
- 新增可选中业务对象时，明确 `shouldPickParent`、`canSelect()`、removed / unselectable flags、父子 pick 身份。
- 业务 Entity 只保存模型数据、状态、引用 id、元信息，不在 Entity 中创建长期 Three geometry/material/listener。
- 删除 entity 时走 `removeFromParent()`、Document API 或既有命令链，避免只改内部集合。
- 重写 destroy / removeFromParent 时，先释放自身资源或解绑业务引用，再保持父类 signal dispose、id release、remove 语义。
- 运动学或 link 相关位置变化，优先走 `CADEntity.dirtyPosition()`，不要只改 `Object3D.matrix`。

## 反例

- 直接改 `entity.geometry.xxx`、`localMatrix`、样式字段后不发 dirty，导致 display 不刷新。
- 发明 `refreshDisplay()`、`updateViewObject()`、`markNeedsRender()` 等当前仓库不存在的 API。
- 把 child entity 从内部数组或 set 删除，不走 `removeFromParent()` / `removeChild()` / document 链。
- 在 Entity 里长期持有 Three Mesh、DOM、observer、keyboard listener，却没有 destroy / cleanup 证据。
- pick 后直接信任 display 或 Object3D 身份，不回到 `entity.pick()` / `canSelect()` 检查。
- 以为 `Document.clear()` 只是清 map，不会触发 root 子节点移除和 destroy 链。

## 审查清单

- 新业务对象是否真的需要进入 `Document`；如果需要，是否有真实创建入口和注册路径。
- 数据变化是否映射到正确 dirty 类型，而不是统一调用不明刷新方法。
- 删除路径是否说明了 `removeFromParent()`、`removeChild()`、`destroy()`、`Document.clear()` 的影响。
- 子树删除是否会误伤业务分组下的其他对象。
- pick/selection 是否检查 `shouldPickParent`、`canSelect()`、removed / unselectable。
- CADEntity 的 transform / link / world matrix cache 是否由 `dirtyPosition()` 闭合。
- 自定义 signal、缓存、外部资源是否在 destroy 或 display cleanup 中释放。

## 最小验证

- 创建业务 entity 后加入 document，确认 `doc.getEntity(id)` 可查。
- 修改几何、材质、位置各一次，确认对应 display 的 geometry/material/position dirty 被触发并刷新。
- 给 entity 设置 `unselectable` 或 removed flag，确认 selection 不再选中它。
- 对 `shouldPickParent = true` 的子 entity，确认 pick 返回父级身份。
- 调用 `removeFromParent()` 或 `Document.clear()`，确认 entity 从 doc map 消失、display remove、signals 不再响应旧对象。
- 对 CADEntity 位姿变化，确认 world matrix / display matrix / pick object matrix 同步更新。

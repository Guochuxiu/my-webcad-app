# Entity 与 Display 生命周期

## 这篇文档给谁用

给正在开发“新的业务库”的人使用。  
重点不是解释底座内部如何实现，而是告诉你在业务库里新增 Entity、Display 时必须遵守哪些生命周期事实。

## 业务库为什么必须关心这件事

在 WebCAD 里，业务对象不是孤立数据结构。  
你的业务 Entity 会进入 `Document`，你的业务 Display 会绑定 Entity 的 signal，你的交互、选择、渲染刷新都会依赖这条链。

如果生命周期理解错了，常见后果是：

- 对象删错，整棵子树被级联销毁
- 数据改了，但 Display 不刷新
- Display 被移走了，事件监听还在
- 预览对象、pick 对象、outline 或 gizmo 残留

## Entity 事实

源码：`fscadweb 模块：core/model/entity.ts`

关键事实：

- `Entity` 持有 `parent`、`children`、`signalDirty`、`signalRemoved`、`signalChildAdded`、`signalChildRemoved`、`signalFlagChanged`、`signalParentChanged`
- dirty 事件通过 `dirty()`、`dirtyGeometry()`、`dirtyMaterial()`、`dirtyPosition()`、`dirtyPreview()` 触发
- `removeChild()` 会触发 `signalChildRemoved`、`child.signalRemoved`，随后直接 `child.destroy()`
- `removeFromParent()` 会先递归让所有子节点 `removeFromParent()`，然后再让自己从父节点移除
- `destroy()` 会 dispose signals、释放 id、派发全局 destroy signal；当前源码中 `_children` 是 `Set`，业务删除不要依赖单独 `destroy()` 完成树摘除，优先走 `removeFromParent()` / `removeChild()` / `Document.clear()` 链

对业务库的意义：

- 你的业务 Entity 一旦进入实体树，就必须接受这套删除语义
- “从场景移除”在当前实现里往往带有销毁含义，不能想当然当成临时摘下
- 你的业务属性变化必须映射到正确的 dirty 类型，否则下游 Display 不会按预期更新
- 如果发现旧文档写“destroy 递归销毁子树”，以当前 `entity.ts` 为准：方案中应明确删除入口，而不是直接调用裸 `destroy()`

## Document 事实

源码：`fscadweb 模块：core/document.ts`

关键事实：

- `Document` 自带一个 `Group` 作为 `_root`
- `addEntity()` 会把实体挂到 `root` 下
- 加入文档时会递归加入 `_entityMap`
- 同时监听后续的 `signalChildAdded` 和 `signalRemoved` 来维护索引
- `clear()` 会先让 `root` 的所有子节点 `removeFromParent()`，随后直接清空 `_entityMap`

对业务库的意义：

- 只要你的业务 Entity 进入 `Document`，后续子节点变化就会继续同步进索引
- 文档中的“存在性”依赖实体树和 signal，不是你额外维护的一份平行列表
- 调用 `clear()` 后不能假设 root 仍在索引里

## Display 事实

源码：`fscadweb 模块：app/view/display.ts`

关键事实：

- `Display` 构造时立刻绑定 entity 的 dirty、childAdded、flagChanged、removed、parentChanged
- dirty 通过 `dirtyGraph()` 向父 Display 和 Canvas 传播
- `onRemoved()` 默认调用 `canvas.removeDisplayObject(this)`
- `clear()` 会递归清子 display，执行 `onCleanup()`，并释放 `signalHook`

对业务库的意义：

- 你的业务 Display 天生是被 Entity 驱动的，不应自己另造一条平行刷新链
- 只要业务 Entity 触发 remove / dirty / parent change，业务 Display 就必须同步响应
- 如果你额外挂了 observer、render task、热键或第三方资源，必须在 `onCleanup()` 或等价清理点收口

## ThreeDisplay 事实

源码：`fscadweb 模块：app/view/three/display/three_display.ts`

关键事实：

- `viewObj` 是懒创建的，首次访问时才调用 `_createViewObj()`
- `pickObj` 和 `physicsBody` 也是懒创建
- `_onPositionDirty()` 会同步更新 `viewObj` 和 `pickObj`
- `_onGeometryDirty()`、`_onPositionDirty()` 都会让 bounding box 缓存失效
- `onCleanup()` 会清理 `viewObj`、`pickObj` 以及 outline 对象
- 详细 Display 生命周期入口见 `../business/rendering-display-lifecycle.md`

对业务库的意义：

- 不要在业务 Display 初始化阶段过早访问 `viewObj`
- 几何、位置、拾取、边界框不同步时，先检查 dirty 流是否闭合
- 需要 pick、outline、LOD 的业务 Display，要显式考虑这些对象的创建和释放

## 业务库新增 Entity / Display 时的最小自检

- 新业务 Entity 改变数据后，是否触发了正确的 dirty 事件
- 新业务 Display 是否监听了依赖的 signal
- 删除路径是否会意外 destroy 整棵子树
- `onCleanup()` 是否清掉了手工监听、pick 对象、outline 或额外资源
- 是否错误地在业务库里复制了一套 Display 生命周期逻辑

# Batch Shared Buffer 生命周期

## 源码用法摘要

- `fscadweb 模块：core\model\cad\batch\batch_entity.ts:41` `BatchEntity` 持有静态 `ArrayBufferManager`。
- `fscadweb 模块：core\model\cad\batch\batch_entity.ts:46` `batchGroupMap` 维护模型层 `batchInfoMap` 与 `batchRefCountMap`。
- `fscadweb 模块：core\model\cad\batch\batch_entity.ts:79` 到 `:85` 暴露 `positionView`、`indexView`、`colorView`、`pickColorView`、`statusView`。
- `fscadweb 模块：core\model\cad\batch\batch_entity.ts:178` 到 `:190` `destroy()` 释放各 chunk view 并递减模型层引用计数。
- `fscadweb 模块：core\model\cad\batch\batch_entity.ts:214` 到 `:229` `prepareColorData(...)` 按 entity id 写入每顶点 `pickColorData`。
- `fscadweb 模块：core\model\cad\batch\batch_line.ts:567` 到 `:576` 线批次创建 SharedArrayBuffer chunk，包含 `pickColorChunk` 与 `statusChunk`。
- `fscadweb 模块：core\model\cad\batch\batch_line.ts:590` 到 `:603` chunk `signalCleared` 会清模型层 batch map、ref count 与 batch id list。
- `fscadweb 模块：core\model\cad\batch\batch_line.ts:647` 到 `:705` 线实体从已有 batch chunk 分配 view，并递增模型层引用计数。
- `fscadweb 模块：core\model\cad\batch\batch_line.ts:741` 到 `:750` 线实体销毁时先释放附加 view，并把 `statusView` 填 0 后进入基类 destroy。
- `fscadweb 模块：core\model\cad\batch\batch_mesh.ts:175` 到 `:199` 面实体从已有 batch chunk 分配 view；`:225` 到 `:285` 新建 batch chunk 并分配 `pickColorView` / `statusView`。
- `fscadweb 模块：core\model\cad\batch\batch_point.ts:178` 到 `:214` 点级 ray pick 会跳过 `statusView` bit 0 为 0 的点。
- `fscadweb 模块：app\view\three\display\batch\batch_base.ts:26` 到 `:29` 显示层另有静态 `batchObjectMap`、`batchPickObjMap`、`batchRefCountMap`。
- `fscadweb 模块：app\view\three\display\batch\batch_base.ts:88` 到 `:94` `_createViewObj()` 递增显示层引用计数并复用同 batchId 的 Three object。
- `fscadweb 模块：app\view\three\display\batch\batch_base.ts:118` 到 `:133` 普通隐藏通过缓存并改写 `indexView`，再标记 `geometry.index.needsUpdate`。
- `fscadweb 模块：app\view\three\display\batch\batch_base.ts:216` 到 `:249` `onCleanup()` 递减显示层引用计数，归零后移除 batch render/pick object 并 dispose。
- `fscadweb 模块：app\view\three\display\batch\batch_line.ts:204` 到 `:229` 细线 geometry 直接用共享 buffer 创建 `pickColor` 与 `status` attribute。
- `fscadweb 模块：app\view\three\display\batch\batch_line.ts:233` 到 `:254` 粗线隐藏通过 `statusView` bit 0 控制，并同步 render/pick geometry 的 `status.needsUpdate`。
- `fscadweb 模块：app\view\three\display\batch\batch_line.ts:257` 到 `:275` 线批次 `createPickObject()` 为细线复用 render geometry，为粗线单独创建带 `pickColor` / `status` attribute 的 pick geometry。
- `fscadweb 模块：app\view\three\display\batch\batch_line.ts:313` 到 `:316` cleanup 后仍标记 render/pick `status.needsUpdate`。
- `fscadweb 模块：app\view\three\display\batch\batch_mesh.ts:74` 到 `:111` 面批次用 shared chunk buffer 生成 render geometry，并用同 geometry 创建 pick mesh。
- `fscadweb 模块：app\view\three\display\batch\batch_point.ts:83` 到 `:128` 点批次用 shared chunk buffer 生成 render geometry，并用同 geometry 创建 pick points。
- `fscadweb 模块：core\memory\arraybuffer_manager.ts:254` 到 `:275` `ArrayBufferManager` 优先复用相同类型、大小和 shared 配置的 chunk。
- `fscadweb 模块：core\memory\arraybuffer_chunk.ts:181` 到 `:227` `ArrayBufferChunk.allocate(...)` 从同一底层 buffer 返回 typed array view。
- `fscadweb 模块：core\memory\arraybuffer_chunk.ts:231` 到 `:297` `free(...)` 只把 typed array 区间归还到空闲树，不会主动让已有 Three attribute 失效。
- `cadnginx 模块：app.ts:100` 到 `:107` 同 tag view 会 `createNewRender(container)` 后复用。
- `cadnginx 模块：app.ts:126` 到 `:132` `destroyView(tag)` 只销毁 renderer 并停用输入，不从 `_viewMap` 删除 view。
- `fscadweb 模块：core\document.ts:53` 到 `:56` `Document.clear()` 移除 root children 并清 `_entityMap`。

## 风险机制

Batch 相关风险有两套状态，不能混为一个“共享 buffer”：

- **model-layer `BatchEntity` 引用/映射**：`BatchEntity.batchGroupMap` 按 `batchGroupId` 保存 `batchInfoMap` 和模型层 `batchRefCountMap`；每个 `BatchLine` / `BatchMesh` / `BatchPoint` 持有分配到 chunk 内的一组 typed array view，例如 `positionView`、`indexView`、`pickColorView`、`statusView`。
- **display-layer `BatchBaseDisplay` buffer/view/cache**：`BatchBaseDisplay.batchObjectMap` 和 `batchPickObjMap` 按 `batchId` 复用 Three render object 与 pick object；`batchRefCountMap` 是显示层引用计数，和模型层引用计数不是同一个 Map；`_cacheIndices`、`_isHidden`、`_pickObj`、`_viewObj` 是 display 生命周期缓存。

因此，一个 batch 实体销毁时只看模型层 `free(...)` 不够；display 仍可能持有基于同一底层 buffer 创建的 `THREE.BufferAttribute`。反过来，display cleanup 只归零 Three object 也不等价于模型层 chunk 释放。方案或代码审查必须同时回答：typed array view 是否释放、render/pick geometry attribute 是否被标 dirty、显示层 batch map 是否在最后一个 display cleanup 后删除。

## pickColorView / pickColor / createPickObject

`pickColorView` 是模型层 view，内容来自 entity id 编码；display 层把它包装成 geometry 的 `pickColor` attribute，供 GPU pick material 输出颜色 id。

- `BatchEntity.prepareColorData(...)` 将 `this.id` 拆成 RGB 三通道，写入每个顶点的 `pickColorData`。
- 细线 `BatchLineDisplay` 的 render geometry 带 `pickColor`，`createPickObject()` 用同一个 geometry 创建 `THREE.Line` pick object。
- 粗线 `BatchLineDisplay` 的 render path 是 `LineSegmentsGeometry`，pick path 会单独创建 `THREE.LineSegments`，并重新绑定 `position`、`pickColor`、`status` attribute。
- `BatchMeshDisplay` / `BatchPointDisplay` 从 shared chunk buffer 设置 `pickColor` attribute，并用同一个 geometry 创建 pick object。

风险点是：只更新渲染颜色或只新建 render object，不代表 pick object 的 `pickColor`、`status` 和 batch map 已同步。批渲染对象被复用时，新 display 可能复用旧 batch geometry；如果 pick object 已经存在，必须确认新实体对应的共享 buffer 数据已写入，并且 pick geometry attribute 会读到同一个底层 buffer 或被重新设置。

## statusView / hidden / selection / status Buffer 更新风险

`statusView` 主要承载每个 batch 元素的状态位，其中 bit 0 用于显示/隐藏判断：

- `BatchEntity.setRenderStatus(...)` 遍历 `statusView` 并写 bit 0，随后触发 `dirtyMaterial()`。
- `BatchBaseDisplay.updateHidden()` 对普通路径会缓存 `indexView`，隐藏时填 `INVALID_INDEX`，恢复时写回缓存，并标记 `geometry.index.needsUpdate`。
- `BatchLineDisplay.updateHidden()` 对粗线不走 index 失效，而是写 `statusView` bit 0，并同时标记 render object 和 pick object 的 `geometry.attributes.status.needsUpdate`。
- `BatchPoint.getClosestPointByRay(...)` 会跳过 `statusView` bit 0 为 0 的点，所以状态位不仅影响渲染，也影响点级 ray pick。
- selection / hover 对 line、mesh、point display 多数通过改 `colorView` 并标记 `geometry.attributes.color.needsUpdate` 表现，不等于 `statusView` 改动。

审查时要特别防止三类错位：

- 改了 `statusView` 但没有让 render/pick geometry 的 `status` attribute `needsUpdate`。
- 用细线的 `indexView` 隐藏逻辑套到粗线，导致粗线 render/pick 仍显示或仍可拾取。
- 把 selection / hover 颜色更新误认为 status 更新，忽略隐藏、清理、点级 pick 仍依赖 status bit。

## shared buffer / ArrayBufferManager / destroy / clear / view reuse

batch chunk 使用 `ArrayBufferChunk` 分配 typed array view；许多 batch chunk 以 `isShared = true` 创建，因此多个 entity view、Three geometry attribute、worker 侧数据都可能指向同一底层 buffer。

关键生命周期风险：

- `ArrayBufferChunk.free(...)` 只是把 typed array 对应区间合并回空闲树，不会通知已经创建的 `THREE.BufferAttribute` 停止读那段 buffer。
- 如果 entity destroy 后没有把索引或状态置为不可见，旧 geometry attribute 可能在下一帧继续读到已释放或复用的 buffer 区间。
- `BatchLine.destroy()` 明确把 `statusView` 填 0 后才进入 `BatchEntity.destroy()`；其他类型要按真实源码检查是否有等价不可见处理或依赖 index/free 清理。
- `BatchBaseDisplay.onCleanup()` 的显示层引用计数归零才移除 batch render/pick object；如果 display 未 cleanup，静态 batch map 会跨 view 生命周期保留。
- cadnginx `CadApp.addView(...)` 会复用同 tag view；`destroyView(...)` 不从 `_viewMap` 删除 view。不要把销毁 renderer 当作销毁全部 display/static batch cache。
- `Document.clear()` 清 root children 和 `_entityMap`，但仍要确认 display tree、batch map、pick object、worker chunk、selection 等运行时状态是否由对应 view/app cleanup 链处理。

## 正例

- 方案明确区分模型层 `BatchEntity.batchGroupMap` 与显示层 `BatchBaseDisplay.batchObjectMap` / `batchPickObjMap`，并分别说明引用计数归零时做什么。
- 新增 batch entity 时复用现有 `BatchLine` / `BatchMesh` / `BatchPoint` 分配链，让 `pickColorView` 和 `statusView` 从 batch chunk 生成，不手工拼裸 `BufferGeometry` 塞进 scene。
- 更新隐藏或 renderStatus 后，说明是哪条 display 路径负责标记 `geometry.index.needsUpdate` 或 `geometry.attributes.status.needsUpdate`，并覆盖 pick object。
- 自定义粗线或 instanced batch pick 时，为 pick geometry 同步 `pickColor` 与 `status` attribute，而不是只复用 render material。
- 销毁批量实体时走 entity/display cleanup 链，确保模型层 view free、显示层 batch map ref count、render/pick object remove/dispose 都能触发。
- 多 view 或同 tag view 复用场景下，验证旧 batch object、pick object、hidden cache 不会污染新 render container。

## 反例

- 把 `entity.batchId` 当成 GPU pick id，忽略 `pickColorView` 实际编码的是 entity id。
- 直接创建 `THREE.BufferGeometry` 并读取 `positionView.buffer` 渲染，但不注册 display、不接入 `createPickObject()`、不处理 batch ref count。
- 隐藏 batch 对象时只改业务 flag，不触发 `dirtyMaterial()` 或不标记 `status` / `index` attribute 更新。
- 只释放模型层 `positionView` / `indexView`，却让 `BatchBaseDisplay.batchObjectMap` 中的 shared geometry 继续挂在 scene 或 pick context。
- 在 `Document.clear()` 后假设所有 batch static map 和 pick object 都已清空，没有抽查 view display cleanup。
- 复用同 tag view 后只检查画面正常，不检查 GPU pick 是否还返回旧 entity id 或隐藏对象。

## 审查清单

- 是否明确当前需求落在 `BatchLine` / `BatchMesh` / `BatchPoint` 哪一类，还是只是普通 display。
- 是否区分模型层 batch map/ref count 与显示层 batch map/ref count。
- `batchId`、`batchGroupId`、entity id、pick color id 是否各自语义清楚，没有互相替代。
- 新对象是否通过 batch chunk 分配 `pickColorView` 和 `statusView`，并能被 display geometry attribute 读取。
- `createPickObject()` 是否存在，且 pick object 的 `pickColor` / `status` 与 render object 同步。
- hidden / renderStatus / destroy 是否同时覆盖 render object 和 pick object。
- `geometry.index.needsUpdate`、`geometry.attributes.status.needsUpdate`、`geometry.attributes.color.needsUpdate` 是否按实际改动的 buffer 设置。
- entity destroy 是否释放全部额外 view，并把旧区域置为不可显示或不可索引。
- display cleanup 是否能在最后一个 display 释放时删除 `batchObjectMap` / `batchPickObjMap` / `batchRefCountMap`。
- view 复用、`destroyView()`、`Document.clear()` 后是否仍可能有静态 batch map、worker chunk、selection、pick context 残留。

## 最小验证

- 创建两个同类型 batch entity，让它们复用同一个 `batchId`；确认 render draw object 复用，但 pick 返回各自 entity id。
- 隐藏其中一个 batch entity 后，验证画面不可见、普通 GPU pick 不再命中它；粗线还要验证 pick geometry 的 `status.needsUpdate` 被触发。
- 选中 / hover batch entity 后，验证颜色 attribute 更新不改变 pickColor identity，click/hover 仍映射到同一 entity。
- 销毁一个共享 batch 中的 entity 后，验证另一个 entity 仍可 render/pick，已销毁 entity 的区域不可见或索引无效。
- 销毁同 batch 的最后一个 display 后，验证 `batchObjectMap`、`batchPickObjMap`、显示层 ref count 都清掉，render/pick object 从场景移除。
- 执行 `Document.clear()` 或同 tag view destroy/addView 复用流程后，再创建 batch entity，验证没有旧 hidden/index/status/pickColor 状态残留。

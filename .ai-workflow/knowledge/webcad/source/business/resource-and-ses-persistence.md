# Resource / SES 持久化

## 源码用法摘要

- `cadnginx 模块：loader\resource_manager.ts:16`：`SCENE_FILE_NAME = 'scene.json'`
- `cadnginx 模块：loader\resource_manager.ts:17`：`KINEMATICS_FILE_NAME = 'kinematics.urdf'`
- `cadnginx 模块：loader\resource_manager.ts:49`：`uuidToFile`
- `cadnginx 模块：loader\resource_manager.ts:50`：`fileIdRefCount`
- `cadnginx 模块：loader\resource_manager.ts:52`：`assetsCache`
- `cadnginx 模块：loader\resource_manager.ts:231`：`addResourceReference(uuid, file)`
- `cadnginx 模块：loader\resource_manager.ts:263`：`releaseResource(uuid)`
- `cadnginx 模块：loader\resource_manager.ts:305`：`exportSes(entity, fileName, isSes, download, rootLink)`
- `cadnginx 模块：loader\resource_manager.ts:343`：导出 `scene.json`
- `cadnginx 模块：loader\resource_manager.ts:346`：`exportURDF(rootLink)`
- `cadnginx 模块：loader\resource_manager.ts:347`：导出 `kinematics.urdf`
- `cadnginx 模块：loader\ses_loader.ts:24`：`SESFileLoader.load()`
- `cadnginx 模块：loader\ses_loader.ts:31`：查找 `scene.json`
- `cadnginx 模块：loader\ses_loader.ts:43`：按 `Resources[].URL` 过滤内部资源文件
- `cadnginx 模块：loader\ses_loader.ts:73`：对未引用 object 调 `releaseResource()`
- `cadnginx 模块：loader\ses_loader.ts:86`：查找 URDF 文件
- `cadnginx 模块：loader\ses_loader.ts:91`：`loadURDF(urdf)`
- `cadnginx 模块：loader\ses_loader.ts:92`：`generateKinematic(...)`
- `cadnginx 模块：loader\ses_loader.ts:95`：`bindLinkToEntity(...)`
- `cadnginx 模块：loader\ses_loader.ts:146`：`generateAssemblyStructure(...)`
- `cadnginx 模块：loader\ses_loader.ts:229`：SES 生成实体前 clone `Object3D`
- `cadnginx 模块：loader\ses_loader.ts:232`：clone 后重写 `uuidToFile` 映射

## 入口与边界

SES 是模型资源、装配树和运动学的组合包，不是普通 zip 解压后逐个 `scene.add()`。

- 导入入口：`ResourceManager.loadFromFiles(files)` -> `SESFileLoader.load()`。
- 导出入口：`ResourceManager.exportSes(entity, fileName, isSes, download, rootLink)`。
- 场景描述：`scene.json` 存 `Resources`、`Nodes`、`Assembly`。
- 运动学描述：`kinematics.urdf` 由 `exportURDF(rootLink)` 和 `buildURDFXML(...)` 写入。
- 资源身份：几何或 object 的 uuid 通过 `uuidToFile` 指向临时 `fileId`，`fileIdRefCount` 统计引用数。
- 附属资源：GLTF 纹理、URDF 等进入 `assetsCache`，导出时与几何资源一起写入 zip/ses。

## SES 导入链

1. `SESFileLoader.load()` 解压包并把内部文件放入 `GLTFFileLoader.assetMap`。
2. 查找 `scene.json`；存在时解析 `Resources`、`Nodes`、`Assembly`，并只加载 `Resources[].URL` 命中的文件。
3. 通过 `ResourceManager.getObjectsFromFile(...)` / `getBrepNodesFromFile(...)` 读取资源，未被 `Nodes[].URI` 引用的 object 会 `releaseResource(obj.uuid)` 并 `dispose()`。
4. `generateEntityTree(...)` 根据 `Nodes` 还原实体树；普通 object 会先 `object.clone()`，再用 `objectNodeClass` 创建业务实体。
5. clone 后必须把原 object uuid 对应的 `fileId` 迁移到 `cloneObj.uuid`，并删除原 uuid 映射，否则导出时找不到或重复引用资源。
6. 如果压缩包包含 URDF，`loadURDF()` -> `generateKinematic()` 创建 `Link/Joint`，随后 `bindLinkToEntity(...)` 按 `link.visual.name === entity.name` 绑定实体。
7. 如果存在 `Assembly`，`generateAssemblyStructure(...)` 创建组件装配点和装配关系，并可把匹配装配点的 link 绑定到对应 entity。
8. 最后寻找 root link 并执行 `rootLink.update()`，让运动学结果通过 `dirtyPosition()` 作用到绑定实体。

## SES 导出链

1. `exportSes(...)` 从传入 entity 递归生成 `Nodes` / `Assembly`。
2. 遍历 entity tree：`ObjectNode` 用 `child.geometry.uuid` 查 `uuidToFile`，`BrepNode` 用 `child.geometryId` 查 `uuidToFile`。
3. 通过 `getFileFromDB(fileId)` 找回资源文件，与 `assetsCache` 里的附属资源一起写入 zip。
4. 写入 `scene.json`，内容是 assembly JSON。
5. 调 `exportURDF(rootLink)` 收集 links/joints，再写入 `kinematics.urdf`。
6. 返回 blob，并按 `isSes` 决定下载扩展名 `.ses` 或 `.zip`。

## Resource 引用计数

- `addResourceReference(uuid, file)` 会构造 `fileId = name_size_type`，写 `uuidToFile`，增加 `fileIdRefCount`，首次出现时通过 `CadApp.getInstance().dbManager.save(...)` 存临时资源。
- `releaseResource(uuid)` 会删除 `uuidToFile[uuid]`，递减 `fileIdRefCount[fileId]`；引用数归零时删除 `fileIdCache`、`fileIdRefCount`，并尝试从 DBManager 删除临时文件。
- SES 导入中 clone uuid mapping 是资源闭环的关键：实体持有的是 clone 后的 geometry/object uuid，导出查的也是 clone uuid。
- 多 view 或重复导入时，`uuidToFile`、`fileIdRefCount`、`assetsCache` 都是静态状态；方案必须说明何时清理、何时保留。

## 正例

```ts
const { nodes, links } = await ResourceManager.loadFromFiles(files);

nodes.forEach((node) => app.addToView(node, canvas, FSApp.View.Three.LayerType.Model));

const rootLink = links.find((link) => link.isRoot);
rootLink?.update();
```

- SES 导入只消费 `{ nodes, links }`，不手写 zip 解析、不自行拼 entity tree。
- 导出时传入真实业务 root entity 和可选 `rootLink`，让 `exportSes()` 同时写 `scene.json` 和 `kinematics.urdf`。
- 自定义 SES entity 类型时只通过 `registerLoaderConfig(FileType.SES, { objectNodeClass, componentGroupClass, assemblyPointClass })` 改默认类，不改 `SESFileLoader` 主流程。

## 反例

```ts
const files = await unzip(sesFile);
for (const file of files) {
  const object = await loadObject3D(file);
  canvas.scene.add(object);
}
```

- 这会丢掉 `scene.json` 的 `Nodes/Assembly`、`kinematics.urdf`、`uuidToFile`、`fileIdRefCount` 和 entity/display 注册链。
- clone `Object3D` 后不迁移 `uuidToFile`，会导致 `exportSes()` 通过 clone uuid 找不到原始资源。
- 删除实体时只 `entity.remove()`，不考虑资源引用释放，会让 `fileIdRefCount` 或 DBManager 临时资源残留。

## 审查清单

- 是否明确区分 `scene.json` 的结构恢复和普通资源文件加载。
- 是否覆盖 `kinematics.urdf` 的导入、导出和 root link 更新路径。
- 是否说明 `uuidToFile`、`fileIdRefCount`、`assetsCache` 的静态状态和清理边界。
- 是否在 clone object 后维护 uuid -> fileId 映射。
- 是否在释放未引用或删除资源时调用 `releaseResource()`，而不是只 dispose Three 对象。
- 是否避免用裸 `Object3D` 绕过 document/entity/display/pick/dirty 链。

## 最小验证

- 用包含 `scene.json` 的 SES 调 `ResourceManager.loadFromFiles()`，确认返回 `nodes` 与 `links`，且节点名称能和 `Nodes[].Name` 对应。
- 加载含 URDF 的 SES 后，找出 `links.find(link => link.isRoot)` 并执行 `update()`，确认绑定 entity 被 `dirtyPosition()` 驱动。
- 对一个从 SES clone 出来的 `ObjectNode` 调 `exportSes()`，确认导出的 zip/ses 中同时包含原资源、`scene.json` 和 `kinematics.urdf`。
- 构造未引用资源场景，确认未引用 object 走 `releaseResource()`，`fileIdRefCount` 不持续增长。

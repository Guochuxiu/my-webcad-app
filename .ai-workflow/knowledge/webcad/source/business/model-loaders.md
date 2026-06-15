# 模型加载

## 源码用法摘要

- `cadnginx 模块：loader\resource_manager.ts:16`：`SCENE_FILE_NAME = 'scene.json'`
- `cadnginx 模块：loader\resource_manager.ts:17`：`KINEMATICS_FILE_NAME = 'kinematics.urdf'`
- `cadnginx 模块：loader\resource_manager.ts:27`：`MODEL_LOAD_STATUS`
- `cadnginx 模块：loader\resource_manager.ts:54`：`ResourceManager.resourceLoaderSignal`
- `cadnginx 模块：loader\resource_manager.ts:73`：`registerCustomLoader(fileType, loaderClass)`
- `cadnginx 模块：loader\resource_manager.ts:91`：`registerLoaderConfig(fileType, loaderConfig)`
- `cadnginx 模块：loader\resource_manager.ts:100`：`loadFromFiles(files): Promise<ILoadResult>`
- `cadnginx 模块：loader\resource_manager.ts:111`：`getEntityFromFile(files)`
- `cadnginx 模块：loader\resource_manager.ts:136`：`getObjectsFromFile(files)`
- `cadnginx 模块：resource\resource_manager.ts:56`：`app.resourceManager.loadFromFiles(files)` 返回 `THREE.Object3D[]`
- `cadnginx 模块：loader\options.ts:4`：`ILoaderConfig.objectNodeClass`
- `cadnginx 模块：loader\options.ts:27`：`ISESLoaderConfig.componentGroupClass / assemblyPointClass`
- `cadnginx 模块：loader\loader.ts:29`：`Loader.generateEntity(object3D)` 递归转实体树

## 当前可用入口

- `CadApp.resourceManager`：定义在 `src/resource/resource_manager.ts`，返回 `THREE.Object3D[]`
- `ResourceManager`：定义在 `src/loader/resource_manager.ts`，返回 `{ nodes, links }`
- `canvas.loadFSCadModel(...)`：定义在 `fscadweb 模块：app\view\three\three_canvas.ts`，把 protobuf/json 转成实体

对下游业务库，默认优先用 `ResourceManager.loadFromFiles()` 或 `canvas.loadFSCadModel()`。
不要把 `app.resourceManager.loadFromFiles()` 的返回值当成 entity。

## 推荐用法

### 文件转实体树

```ts
import { CadApp, View, ResourceManager, FSApp } from '@fsdev/cadnginx';

const app = new CadApp();
const canvas = await app.addView(container, View.Cad3DCanvas, 'main');

const { nodes } = await ResourceManager.loadFromFiles(files);
nodes.forEach((node) => {
  app.addToView(node, canvas, FSApp.View.Three.LayerType.Model);
});

await canvas.fitView();
```

### protobuf 转实体树

```ts
import { CadApp, View, FSApp } from '@fsdev/cadnginx';

const app = new CadApp();
const canvas = await app.addView(container, View.Cad3DCanvas, 'main');

const entities = canvas.loadFSCadModel(buffer);
entities.forEach((entity) => {
  app.addToView(entity, canvas, FSApp.View.Three.LayerType.Model);
});
```

## `app.resourceManager` 适用边界

```ts
const objects = await app.resourceManager.loadFromFiles(files);
```

- 这里拿到的是 `THREE.Object3D[]`
- 适合仓库内资源处理链、Object3D 级预处理或自定义转换
- 如果最终目标是业务 entity tree，不要直接把这批对象当成 `nodes`

## 支持格式

当前 `src/loader/resource_manager.ts` 可见的文件类型：

- `gltf` / `glb`
- `stl`
- `obj`
- `brep` / `step`
- `ses` / `compress`
- `urdf` 作为资源文件参与装配流程

## 自定义 Loader

- 业务库优先用 `ResourceManager.registerCustomLoader()` 和 `registerLoaderConfig()`
- `Loader` 抽象类在 `src/loader/loader.ts`
- 直接继承 `Loader` 属于仓库内扩展点，不是下游业务库默认公共入口

### 注册链边界

- `registerCustomLoader(fileType, loaderClass)` 只替换指定 `FileType` 对应的 loader 构造函数；loader 仍由 `ResourceManager.loadFromFiles()` / `getEntityFromFile()` 调度。
- `registerLoaderConfig(fileType, loaderConfig)` 用于改默认实体类型或回调，例如 `objectNodeClass`、Brep 的 `onLoadFromMesh`、SES 的 `componentGroupClass` / `assemblyPointClass`。
- 普通 `gltf/stl/obj` loader 最终通过 `Loader.generateEntity()` 把 `THREE.Object3D` 树递归变为 `ObjectNode` 实体树；不要跳过这一步直接把 `Object3D` 塞进 scene。
- `loadFromFiles(files)` 返回 `ILoadResult`，形状是 `{ nodes, links }`；其中 `links` 用于 URDF/SES 运动学结果，不是 display 或 raw object 列表。

### Resource Signal

- loader 进度事件来自 `ResourceManager.resourceLoaderSignal`，事件类型是 `MODEL_LOAD_STATUS.START / FINISH / ERROR`，payload 至少包含 `filename`，SES 入口还可能带 `fileCount`。
- `GLTFFileLoader` / `STLFileLoader` 在 `loadObject()` 前后分发 `START` / `FINISH`，SES 在压缩包级别分发 `START` / `FINISH`。
- 业务库如果监听 `resourceLoaderSignal`，必须有明确解绑位置；多 view 或热切换场景下不要把监听器永久挂在静态 signal 上。

## 正例

```ts
import { Constants, ResourceManager } from '@fsdev/cadnginx';

ResourceManager.registerLoaderConfig(Constants.FileType.GLTF, {
  objectNodeClass: BusinessObjectNode,
});

const { nodes, links } = await ResourceManager.loadFromFiles(files);
nodes.forEach((node) => app.addToView(node, canvas, FSApp.View.Three.LayerType.Model));
```

- 用 `registerLoaderConfig()` 注入业务实体类型，再让 `loadFromFiles()` 维持默认解析、资源缓存、实体树和 URDF 返回链路。
- 如果确实新增文件类型，先注册 `registerCustomLoader()`，再确认 loader 的 `load()` 返回 `{ nodes, links }`，`loadObject()` / `loadGeometry()` 语义和现有抽象一致。
- UI 进度条监听 `resourceLoaderSignal` 时，把 listen/unlisten 写进同一个生命周期，避免 view 复用后重复响应。

## 反例

```ts
const objects = await app.resourceManager.loadFromFiles(files);
objects.forEach((object) => canvas.scene.add(object));
```

- `app.resourceManager.loadFromFiles()` 返回 `THREE.Object3D[]`，不是 entity tree；直接 `scene.add()` 绕开 document、display、pick、dirty、clear。
- 业务库只写 `new MyLoader(file).load()`，没有注册到 `ResourceManager`，运行时拖拽/批量导入不会命中新 loader。
- 注册了自定义 loader 但没有分发或透传资源加载 signal，导致现有加载进度与错误反馈失效。

## 与 SES / URDF 的关系

- SES 压缩包导入导出、`scene.json`、`kinematics.urdf`、`uuidToFile`、`fileIdRefCount`、`assetsCache`、`releaseResource()` 的细节见 `business/resource-and-ses-persistence.md`。
- 如果需求同时涉及模型文件和运动学，必须同时补读 `business/kinematics.md`；SES loader 会在发现 URDF 文件后调用 `loadURDF()` / `generateKinematic()` 并返回 `links`。

## 审查清单

- 业务代码拿到的是 `Object3D[]` 还是 `nodes`
- 是否误用了 `CadApp.getInstance()`
- 是否把 `getViewById(0)` 这类单视图写法写死
- 是否把 loader 逻辑和命令、场景接线混在一起
- 是否用 `registerCustomLoader()` / `registerLoaderConfig()` 接入了真实 loader 链，而不是手写一条并行链
- 是否监听了 `resourceLoaderSignal`，如果监听了，是否说明解绑和多 view 复用风险
- 是否说明 `loadFromFiles()` 返回的 `links` 如何被使用或忽略

## 最小验证

- 用一个 `gltf/stl/obj` 文件调用 `ResourceManager.loadFromFiles()`，确认返回 `nodes.length > 0` 且节点能通过 `app.addToView()` 进入显示链。
- 注册一次 `registerLoaderConfig()` 后加载文件，确认返回节点类型是配置指定的 `objectNodeClass` 子类。
- 监听 `resourceLoaderSignal`，加载单文件和 SES 文件各一次，确认收到 `START` / `FINISH` 且销毁业务监听后不再触发旧回调。

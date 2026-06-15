# Loader 扩展模板

这个模板只用于维护 `cadnginx` 仓库本身或私有 fork。
当前下游业务库默认不直接继承 `Loader` 抽象类。

## 源码用法摘要

- `cadnginx 模块：loader\resource_manager.ts:73`：`ResourceManager.registerCustomLoader(...)`
- `cadnginx 模块：loader\resource_manager.ts:91`：`ResourceManager.registerLoaderConfig(...)`
- `cadnginx 模块：loader\resource_manager.ts:100`：统一入口 `ResourceManager.loadFromFiles(...)`
- `cadnginx 模块：loader\loader.ts:7`：`abstract class Loader`
- `cadnginx 模块：loader\loader.ts:17`：`load(): Promise<ILoadResult> | undefined`
- `cadnginx 模块：loader\loader.ts:22`：`loadObject(): Promise<THREE.Object3D> | undefined`
- `cadnginx 模块：loader\loader.ts:27`：`loadGeometry(): Promise<CADEntity> | undefined`
- `cadnginx 模块：loader\loader.ts:29`：`generateEntity(object3D)` 使用 `objectNodeClass`
- `cadnginx 模块：loader\options.ts:4`：`ILoaderConfig.objectNodeClass`

## 仓库内扩展模板

```ts
import { Loader } from '../../src/loader/loader';

export class BusinessLoader extends Loader {
  public async load() {
    // return { nodes, links }
  }

  public async loadObject() {
    // return THREE.Object3D
  }

  public async loadGeometry() {
    // return CADEntity
  }
}
```

## 正例

```ts
ResourceManager.registerCustomLoader(Constants.FileType.GLTF, BusinessGLTFLoader);
ResourceManager.registerLoaderConfig(Constants.FileType.GLTF, {
  objectNodeClass: BusinessObjectNode,
});

const { nodes, links } = await ResourceManager.loadFromFiles(files);
```

- 自定义 loader 仍通过 `ResourceManager.loadFromFiles()` 接入，保留批量文件分发、signal、资源引用、实体树返回。
- 只想替换实体类型时优先用 `registerLoaderConfig()`，不新增 loader 子类。
- loader 的 `load()` 返回 `{ nodes, links }`，`loadObject()` 返回 raw `THREE.Object3D`，`loadGeometry()` 只用于 BREP/STEP 类几何入口。

## 反例

```ts
const loader = new BusinessLoader(file);
const object = await loader.loadObject();
canvas.scene.add(object);
```

- 这绕开 `ResourceManager` 注册链、resource signal、`generateEntity()`、document/display/pick/dirty。
- 下游业务库不应把本模板里的 `BusinessLoader` 当作公共 import 示例；除非任务明确是维护 `cadnginx` 或私有 fork。

## 审查重点

- 是否误把这个模板当成下游公共 import 示例
- 是否把 Loader 写成命令/场景总入口
- 是否需要同步补 `ResourceManager.registerCustomLoader()` 和 `registerLoaderConfig()`
- 是否说明 `loadFromFiles()` 是运行时入口，而不是手动 `new Loader()`
- 是否说明资源引用、progress signal、entity tree 返回是否闭合

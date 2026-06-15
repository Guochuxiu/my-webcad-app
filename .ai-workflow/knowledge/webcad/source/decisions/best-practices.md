# WebCAD 业务开发最佳实践

## 导入规范

### 外部业务项目（推荐）

业务库优先从 `@fsdev/cadnginx` 的入口取能力，不要直接穿透到 `@fsdev/fscadweb`。
推荐按命名空间使用，避免依赖不存在的平铺导出：

```typescript
import { CadApp, View, Model, Snap, Kinematic, FSApp, FSCore, FSMath, Constants } from '@fsdev/cadnginx';
```

常见对应关系：

- `View.Cad3DCanvas`
- `Model.BatchLine` / `Model.BatchMesh`
- `FSCore.Model.PointCloud` / `FSCore.Model.PointCloudSlice`
- `FSApp.View.Three.ThreeDisplay`
- `FSCore.Util.NumberBitOps`
- `Snap.SnapEngine` / `Snap.SNAP_STRATEGY_TYPE`
- `Kinematic.Link` / `Kinematic.Joint`
- `Constants.JointType`

### 禁止

- 在业务项目中直接 `import from '@fsdev/fscadweb'`
- 依赖未确认的平铺导出名
- 用内部底座源码路径穿透发布包边界

## 命名规范

### 文件命名：snake_case

| 类型 | 后缀 | 示例 |
|------|------|------|
| Entity | 无固定后缀 | `my_entity.ts` |
| Display | `_display` | `my_entity_display.ts` |
| Command | `_command` | `measure_command.ts` |
| Canvas | `_canvas` | `cad_3d_canvas.ts` |
| 接口 | 无固定后缀 | `i_app_config.ts` |
| 常量 | 无固定后缀 | `cmd_types.ts` |

### 类命名

| 类型 | 规范 | 示例 |
|------|------|------|
| Entity | PascalCase | `Face`, `WeldSeam` |
| Display | PascalCase + Display | `FaceDisplay` |
| Command | PascalCase + Command | `MeasureCommand` |
| 接口 | I 前缀 + PascalCase | `IFaceGeometry` |
| 枚举 | PascalCase | `CMD_TYPES`, `LayerType` |

### 变量和方法

- 私有属性：`_step`, `_startPoint`
- 公共属性/方法：camelCase，如 `setVertices`
- 常量：`UPPER_SNAKE_CASE`，如 `INVALID_INDEX`
- 布尔：`is/has/should` 前缀，如 `isDestroyed`

## 资源管理

### 创建和销毁必须配对

- Entity：`new` → `addModel` → `removeFromParent`（级联 destroy）
- Signal：`listen` → `unlisten`，或用 SignalHook 自动管理
- WebGL：`new BufferGeometry/Material` → `dispose()`

### Entity 销毁链

`removeFromParent()` 级联调用自身和所有子实体的 `destroy()`。

持有 Entity 引用时，通过 `signalRemoved` 监听清理，或使用前检查 `isDestroyed`。

### Signal 清理

推荐用 SignalHook（ThreeDisplay 内置，销毁时自动 unlisten）。

手动管理时，必须在 `onCleanup` 中 unlisten 所有手动 listen 的信号。

### 视图销毁顺序

`CadApp.destroyView(tag)` 只会停渲染并解绑输入，不会从 `_viewMap` 删除 view。
退出整个应用时使用 `app.dispose()`；如果业务侧给 view 挂了 observer、缓存或定时器，必须自行清理。

### Temp 层清理

命令中的预览实体放 Temp 层，`onCleanup` 中 `clearEntitiesByLayer(LayerType.Temp)`。

## 性能优化

- 大量同类图元用 BatchEntity，不要独立 Entity
- 大量相同几何体用 Instance
- 批量修改时 `freezeRender()` → 修改 → `unfreezeRender()`
- 只在数据真正变化时调用 dirty：先检查值是否相同再 dirty

## 调试技巧

| 工具 | 用法 |
|------|------|
| 性能面板 | `canvas.config.set('debug.states.enable', true)` |
| GPU 拾取调试 | `canvas.debugColorPick(true, 256)` |
| 相机辅助线 | `canvas.debugCameraShow(true, true, true, 200)` |
| 渲染统计 | `canvas.renderInfo`（calls, triangles, lines） |
| 场景信息 | `canvas.getSceneInfo()`（vertexCount, triangleCount） |
| Signal 泄漏 | 全局搜索 `.listen(` 确认每个都有配对 `.unlisten(` |
| 内存泄漏 | Chrome DevTools Heap Snapshot 对比操作前后 |

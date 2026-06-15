# Instance / External / Preview / Assembly

## 源码用法摘要

- `fscadweb 模块：core\model\cad\instance\template_entity.ts:10`：`TemplateEntity` 是实例模板根类型。
- `fscadweb 模块：core\model\cad\instance\template_entity.ts:22`：模板共享静态 `ArrayBufferManager`。
- `fscadweb 模块：core\model\cad\instance\template_entity.ts:59`：模板维护关联 `InstanceEntity` 集合。
- `fscadweb 模块：core\model\cad\instance\template_entity.ts:103`：模板 destroy 时移除实例并释放 position/index/color view。
- `fscadweb 模块：core\model\cad\instance\instance_entity.ts:7`：`InstanceEntity` 引用模板并承载 instance matrix/color。
- `fscadweb 模块：app\view\three\display\instance\instance_display.ts:17`：`InstanceDisplay` 负责实例显示。
- `fscadweb 模块：app\view\three\display\instance\instance_display.ts:119`：实例 pick object 由 display 创建。
- `fscadweb 模块：app\view\three\display\instance\instanceObject\instance_mesh_object.ts:35`：`InstanceMesh` 复用模板 geometry 属性构造 instanced geometry。
- `fscadweb 模块：core\model\cad\external_object.ts:4`：`ExternalObject` 是直接承载 `THREE.Object3D` 的 CAD entity。
- `fscadweb 模块：core\model\cad\external_model.ts:3`：`ExternalModel` 以 URL/string 作为几何数据。
- `fscadweb 模块：app\view\three\display\external_model.ts:7`：`ExternalModel` display 异步加载外部模型。
- `fscadweb 模块：app\view\three\display\external_model.ts:35`：加载替换时释放 child geometry/material。
- `cadnginx 模块：view\cad_3d_canvas.ts:87`、`cadnginx 模块：view\cad_3d_canvas.ts:88`、`cadnginx 模块：view\cad_3d_canvas.ts:91`、`cadnginx 模块：view\cad_3d_canvas.ts:94`：ExternalObject、ComponentGroup、Preview、Feature 已有 display 注册路径。

## 正例

- 大量重复对象优先查 `TemplateMesh/InstanceMesh` 或 `TemplateLine/InstanceLine`，通过模板共享几何，实例只更新 transform/color。
- instance 能被 pick/hover/selection 时，必须说明 template display、instance display、pick object、instance index 映射。
- 外部模型需求优先走 `ExternalModel` / `ExternalObject` 和已有 display 注册，异步加载完成后用 signal 或 dirty 更新。
- Preview、Feature、Assembly 需求先查 `PreviewModelEntity`、`FeatureFace`、`ComponentGroup` 等已有模型，不要新建相似裸模型。
- 模板或外部模型 destroy/替换时，必须释放 typed array、geometry、material、texture。

## 反例

- 为每个重复零件复制完整 `BufferGeometry` 和材质，只为了设置不同位姿。
- instance display 找不到 template display 时仍继续写 instance buffer。
- 只把外部 `Object3D` 塞进 scene，不进入 entity/display 注册链。
- 外部模型 reload 时只替换对象，不 dispose 旧 child geometry/material。
- Preview/Feature/Assembly 直接自造目录和 API，没有对照 cadnginx 已有类型。

## 审查清单

- 重复对象是否应落到 Template/Instance，而不是普通 Mesh 复制。
- 模板、实例、display 注册路径是否闭合。
- instance transform/color 更新是否触发 dirty 或 buffer `needsUpdate`。
- pick object 是否能反查到正确 instance/entity。
- 外部模型异步加载失败、替换、销毁是否释放资源。
- Preview/Feature/Assembly 是否复用已有 cadnginx 模型和 display。

## 最小验证

- 创建一个 template 和多个 instance，确认只有模板几何共享，实例 transform/color 分别正确。
- 对一个 instance 做 pick/hover，确认返回的业务身份不是模板身份。
- 删除 template 后，确认关联 instance 被移除且 typed array 被 `ArrayBufferManager.free()`。
- 外部模型连续加载两次，确认旧 geometry/material dispose 后新模型可见。

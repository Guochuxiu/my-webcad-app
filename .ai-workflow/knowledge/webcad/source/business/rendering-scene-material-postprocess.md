# Renderer / Scene / Material / Postprocess

## 源码用法摘要

- `fscadweb 模块：app\view\three\three_renderer.ts:25`：`ThreeRenderer` 统一持有 WebGLRenderer、CSS renderer 和后处理 renderer。
- `fscadweb 模块：app\view\three\three_renderer.ts:90`：WebGLRenderer 在 renderer 构造阶段创建并绑定容器尺寸。
- `fscadweb 模块：app\view\three\three_renderer.ts:120`、`fscadweb 模块：app\view\three\three_renderer.ts:124`：CSS2D/CSS3D renderer 由 render config 控制创建。
- `fscadweb 模块：app\view\three\three_renderer.ts:247`：Outline、PointCloud EDL、Ambient Occlusion 在 renderer 内集中创建。
- `fscadweb 模块：app\view\three\three_renderer.ts:315`：渲染顺序包含 scene render、EDL、AO、CSS renderer。
- `fscadweb 模块：app\view\three\three_renderer.ts:367`：`dispose()` 释放 composer、renderer、outline、EDL、AO。
- `fscadweb 模块：app\view\three\material\materialmanager.ts:36`：材质创建集中在 `MaterialManager`。
- `fscadweb 模块：app\view\three\material\materialmanager.ts:139`：`materialManager.release()` 会 dispose material 和贴图。
- `fscadweb 模块：app\view\three\postprocessing\outline_renderer.ts:13`：outline 后处理有独立 renderer 封装和 dispose。
- `fscadweb 模块：app\view\three\postprocessing\ambient_occlusion_renderer.ts:81`：AO 从 canvas config 读取配置并管理 render resources。
- `fscadweb 模块：app\view\three\postprocessing\pointcloud_edl_renderer.ts:344`：EDL 管理 render target、uniform、场景可见性恢复。
- `fscadweb 模块：app\view\three\display\domlabel.ts:6`：CSS label 通过 `DomLabel` display 链创建。

## 正例

- 修改 renderer、CSS2D/CSS3D、后处理开关时优先走 `ThreeCanvasConfig` / `canvas.config.update()`，由 `ThreeRenderer` 响应配置。
- 新增材质逻辑优先补到 display 的 `_createMaterial()` 或 `materialManager` 可复用路径，并说明 `materialManager.release()` 或 display cleanup 如何释放。
- 新增后处理必须接入 `ThreeRenderer` 生命周期，说明 render 顺序、resize、config、render target dispose。
- CSS label 使用 `FSCore.Model.DomLabel` / `Css2DLabel` 等已有 entity/display 链，不直接把 DOM 挂到业务页面。

## 反例

- 在 command 或业务 UI 中直接 `new THREE.WebGLRenderer()` / `new EffectComposer()`，绕开 `ThreeRenderer`。
- 每个 Display 都重复创建长期材质、纹理或 render target，却不走 manager/cache/release。
- 直接 `scene.add(mesh)` 实现临时效果，不说明谁在 `clear/destroy` 移除和 dispose。
- CSS label 直接 `document.body.appendChild()`，不进入 display cleanup。
- 后处理临时隐藏 scene object 后没有恢复原可见性或 renderer state。

## 审查清单

- 是否使用 `canvas.config` 而非硬编码 renderer/postprocess 参数。
- 材质和贴图是否由 display/manager 创建，并有 release/dispose。
- Render target、pass、quad、composer 是否在 renderer dispose 中释放。
- resize 是否同步 WebGL、composer、EDL/AO、CSS renderer。
- CSS label 是否是 entity/display 链的一部分。
- scene 直接对象是否有明确 owner、dirty、pick、cleanup 说明。

## 最小验证

- 切换目标 config 后，确认 renderer 或 postprocess 行为变化并触发重绘。
- 创建和销毁目标 display/view 后，确认 material/texture/render target dispose 路径存在。
- resize 画布后检查 WebGL、CSS label、后处理输出尺寸一致。
- 对后处理验证开关、连续 render、dispose 后重建不报错。

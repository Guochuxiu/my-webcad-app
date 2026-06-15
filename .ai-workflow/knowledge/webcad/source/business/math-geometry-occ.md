# Math / Geometry / OCC

## 源码用法摘要

- `fscadweb 模块：math\index.ts:33`：`FSMath` 导出 `Tolerance`。
- `fscadweb 模块：math\index.ts:64`、`fscadweb 模块：math\index.ts:65`：`GeomUtil`、`CurveUtil` 是公开 util。
- `fscadweb 模块：math\algorithm\calculate_distance.ts:28`：距离计算已有算法入口。
- `fscadweb 模块：math\algorithm\calculate_project.ts:2`：投影计算已有算法入口。
- `fscadweb 模块：math\util\geom_util.ts:14`：`GeomUtil` 使用 `Tolerance` 做几何判断。
- `fscadweb 模块：math\util\curve_util.ts:7`：`CurveUtil` 使用 `Tolerance` 处理曲线退化。
- `fscadweb 模块：core\util\workerutil\occ.ts:24`：`OCCUtil` 通过 worker 封装 OpenCascade。
- `fscadweb 模块：core\util\workerutil\occ.ts:47`：OCC worker 注册了 load/process/cleanup/readStep 等方法。
- `fscadweb 模块：core\worker\userworkers\occ\utils.ts:133`：OCC worker 提供 `safeDelete()` 释放有 `delete()` 的 wasm 对象。
- `fscadweb 模块：core\worker\userworkers\occ\geometry-processor.ts:172`、`fscadweb 模块：core\worker\userworkers\occ\geometry-processor.ts:175`：处理 shape 后清理 OCC shape。
- `fscadweb 模块：core\worker\userworkers\occ\shape-processor.ts:106`：源码注释明确部分 C++ 堆对象必须手动 `delete()`。

## 正例

- 几何判断先查 `FSMath.Tolerance`、`GeomUtil`、`CurveUtil` 和 `math/algorithm/*`，不要手写相似浮点逻辑。
- 几何需求必须写清坐标系、单位、容差、退化输入：零长度线、重合点、零面积面、非法索引。
- OCC/STEP/BREP/mesh 处理优先走 `OCCUtil` 和 OCC worker；重计算不放在 command/UI 主线程。
- OCC wasm 对象使用后必须明确由 worker 的 `safeDelete()`、cleanup 或缓存生命周期管理。
- 返回几何后进入 `Entity/Display` 链，并说明 dirty、pick、clear、destroy。

## 反例

- 用 `Math.abs(a - b) < 1e-6` 到处散写，绕开 `Tolerance`。
- 在 UI handler 或 command 中直接跑 OCC heavy operation。
- 忽略单位和坐标系，把屏幕坐标、世界坐标、局部坐标混用。
- OCC explorer/current/shape 等对象不释放，或随意删除源码注释要求保留的 cached shape。
- 只返回一份 Three geometry，不说明 entity identity、display 注册、资源释放。

## 审查清单

- 是否查过现有 `FSMath` primitive、algorithm、util。
- 容差是否使用 `Tolerance` 或明确理由。
- 是否覆盖退化几何和非法输入。
- OCC 是否走 worker util，session 是否释放。
- OCC wasm object/cached shape 的 delete/cleanup 是否符合源码注释。
- 几何结果是否进入 document/entity/display，而不是裸 scene object。

## 最小验证

- 对正常、边界、退化输入各跑一个几何计算用例。
- OCC 文件处理验证 wasm 未加载和已加载两条路径。
- 连续处理多个 shape 后确认 cleanup 不破坏后续处理，也不持续涨内存。
- 几何结果进入 view 后验证 dirty 更新、pick 或 destroy 中至少一个相关行为。

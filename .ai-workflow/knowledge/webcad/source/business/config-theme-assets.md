# Config / Theme / Assets

## 源码用法摘要

- `fscadweb 模块：app\config\base_config.ts:31`：`BaseConfig` 是配置基类，持有 `signalConfigChange` 和 `signalConfigReset`。
- `fscadweb 模块：app\config\base_config.ts:67`：`set(path, value)` 会按 path 更新并派发变更信号。
- `fscadweb 模块：app\config\base_config.ts:85`：`update(updates)` 会批量 merge 并逐项派发变更。
- `fscadweb 模块：app\config\base_config.ts:280`：`dispose()` 会 dispose 配置信号。
- `fscadweb 模块：app\config\canvas_config.ts:10`：`CanvasConfig` / `ThreeCanvasConfig` 承载 view 级配置。
- `fscadweb 模块：app\config\types.ts:212`：配置类型中已有 `theme` 和 `themeConfig`。
- `cadnginx 模块：config\cad_3d_config.ts:15`：`Cad3DConfig` 继承 `ThreeCanvasConfig`。
- `cadnginx 模块：theme\themeManager.ts:20`：`ThemeManager` 是主题资源管理器。
- `cadnginx 模块：theme\themeManager.ts:41`：`ThemeManager.getInstance()` 是单例。
- `cadnginx 模块：theme\themeManager.ts:180`：`loadTexture()` 通过 theme key 加载纹理并缓存。
- `cadnginx 模块：theme\themeManager.ts:226`、`cadnginx 模块：theme\themeManager.ts:257`：主题/纹理缓存清理会 dispose texture。

## 正例

- 新增 view 配置项时同步更新 config 类型、默认值、读取方，并通过 `config.set()` / `config.update()` 触发 `signalConfigChange`。
- 业务运行时配置优先走 `canvas.config` 或 `Cad3DConfig`，不要把开关散落在 display/command 私有字段。
- 主题图片、纹理、颜色优先走 `ThemeManager.loadThemeData()`、`loadTexture()`、`getTextureUrl()`；需要动态资源时说明 cache key 和清理策略。
- 多 view 或多 app 场景下说明配置和主题缓存是否全局共享，以及切换后是否需要恢复或清理。

## 反例

- 在 Display 里硬编码颜色、贴图路径、postprocess 参数，却没有 config/default/type。
- 修改 `config._config` 内部对象，绕过 `set()` / `update()`，导致监听者收不到变更。
- 直接 `new THREE.TextureLoader().load('/theme/...')`，绕开 `ThemeManager` 缓存和 dispose。
- 把 `ThemeManager` 单例当成 view 私有状态，切换主题后不清理旧 texture。
- 新增配置项没有最小验证，不知道是否真的被 renderer/display 读取。

## 审查清单

- 配置入口属于 app 级还是 canvas/view 级，是否选对 config class。
- 类型、默认值、运行时读取、变更监听是否闭合。
- 是否通过 `set/update/updateSection` 触发 `signalConfigChange`。
- 监听 config signal 的对象是否有 unlisten/dispose。
- 主题资源是否走 `ThemeManager`，并说明 cache key、clear/dispose。
- 单例配置或主题缓存是否会跨 app/view 污染。

## 最小验证

- 调用 `canvas.config.set()` 或 `update()` 后，监听者收到正确 path、oldValue、newValue。
- 新配置在创建 view 时生效，运行时变更也能生效或明确不支持运行时变更。
- 主题纹理加载两次命中缓存，清理后 texture dispose 且可重新加载。
- 多 view 切换主题时，确认不会把旧 view 的资源路径硬编码到新 view。

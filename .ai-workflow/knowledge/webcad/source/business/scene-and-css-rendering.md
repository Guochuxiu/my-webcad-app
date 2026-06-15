# 场景配置与 CSS 渲染

## 业务库常用入口

应用级配置走 `new CadApp(options)`，视图级配置走 `app.addView(container, View.Cad3DCanvas, tag, configOptions)`。

```ts
import { CadApp, View } from '@fsdev/cadnginx';

const app = new CadApp({
  debug: { enable: false, level: 'warn', showPerformance: false },
  interaction: { clickTolerance: 4, doubleClickInterval: 300, multiTouch: true, gestureSensitivity: 0.5 },
});

const canvas = await app.addView(container, View.Cad3DCanvas, 'main', {
  render: {
    antialias: true,
    alpha: true,
    cssRender: {
      useCss2dRender: true,
      useCss3dRender: false,
    },
  },
  transformGizmo: {
    enable: true,
    pixelSize: 80,
  },
});
```

## 运行时配置

```ts
canvas.config.set('render.cssRender.useCss3dRender', true);
canvas.config.update({
  common: { backgroundColor: 0x101010 },
});

canvas.config.signalConfigChange.listen(handler);
```

## CSS 叠加层的有效范围

- `render.cssRender.useCss2dRender`
- `render.cssRender.useCss3dRender`
- `FSCore.Model.DomLabel` 仍然是 entity，要按正常显示链进入 view

## 审查重点

- 是否误用了 `CadApp.getInstance()`
- 是否把 `app.createView(...)` 写成业务库默认入口，而不是 `app.addView(...)`
- 是否把和当前入口无关的 view cube / gizmo 说明混进 CSS 渲染文档
- 是否在运行时频繁改 WebGL 重建类配置

## 相关专题

- 材质、后处理、renderer 生命周期见 [`rendering-scene-material-postprocess.md`](./rendering-scene-material-postprocess.md)
- 配置、主题、贴图资源见 [`config-theme-assets.md`](./config-theme-assets.md)

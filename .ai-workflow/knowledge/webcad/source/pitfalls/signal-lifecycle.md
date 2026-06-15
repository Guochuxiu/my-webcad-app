# Signal listen/unlisten 不配对导致内存泄漏

## 问题描述

在 Display 或其他对象中手动调用 `signal.listen()`，但未在清理阶段执行对应的 `unlisten()`。Signal 内部的回调列表会一直持有 Display 引用，导致：
- Display 销毁后回调仍被触发（幽灵回调）
- 闭包持有引用，阻止 GC 回收
- 长时间运行后内存持续增长

开发阶段不易察觉，频繁创建/销毁 Display 后才会暴露。

## 典型错误代码

```typescript
class MyDisplay extends ThreeDisplay {
    protected _init() {
        // 每次调用 .bind() 都创建新的函数引用，后续无法 unlisten
        someService.signalUpdate.listen(this._onUpdate.bind(this));
        // 没有 onCleanup，也没有 unlisten
    }
}
```

## 正确写法

### 方式一：SignalHook 自动管理（推荐）

```typescript
class MyDisplay extends ThreeDisplay {
    protected _init() {
        // SignalHook 在 onCleanup 时自动取消所有通过它注册的监听
        this.listenSignal(someService.signalUpdate, this._onUpdate);
    }
}
```

### 方式二：手动管理

```typescript
class MyDisplay extends ThreeDisplay {
    private _boundUpdate: () => void;

    protected _init() {
        this._boundUpdate = this._onUpdate.bind(this);
        someService.signalUpdate.listen(this._boundUpdate);
    }

    onCleanup(): void {
        someService.signalUpdate.unlisten(this._boundUpdate);
        super.onCleanup();  // 不要漏掉
    }
}
```

## 影响范围

- 所有手动调用 `.listen()` 的地方
- 业务 Display 里监听外部 Service / Document / App 级别 Signal 的场景
- 异步流程中注册监听但异常退出未配对 unlisten 的情况

## 检查要点

- 每个 `.listen(` 是否都有对应的 `.unlisten(`
- 手动管理时，绑定回调是否保存了引用（而非在 `listen` 时直接 `.bind()`）
- `onCleanup` 中是否调用了 `super.onCleanup()`
- 能否用 `this.listenSignal()` 替代手动管理

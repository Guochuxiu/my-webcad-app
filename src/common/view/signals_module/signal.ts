import { ISignal } from './types';

export const isAsyncFunction = (
    f: (...args: any[]) => unknown
): f is (...args: any[]) => Promise<unknown> => {
    return f.constructor.name === 'AsyncFunction';
};

export class HandleSignal<T> implements ISignal<T> {
    protected _listeners: Set<(event: T) => void> = new Set();

    /**
     * 订阅事件
     * @param callback 事件回调
     * @returns 取消订阅函数
     */
    public listen(callback: (event: T) => void): () => void {
        this._listeners.add(callback);

        return () => this._listeners.delete(callback);
    }

    /**
     * 取消订阅事件
     * @param callback 事件回调
     * @returns 是否取消成功
     */
    public unlisten(callback: (event: T) => void) {
        return this._listeners.delete(callback);
    }

    /**
     * 单次订阅事件，
     * @param callback 在返回`true`时取消订阅
     */
    public listenOnce(callback: (event: T) => boolean | Promise<boolean>): void {
        const wrapper = async (event: T) => {
            if (isAsyncFunction(callback)) {
                const res = await callback(event);
                res && this._listeners.delete(wrapper);
            } else {
                const res = callback(event);
                res && this._listeners.delete(wrapper);
            }
        };
        this._listeners.add(wrapper);
    }

    public dispatch(event: T): void {
        for (const listener of this._listeners) {
            try {
                listener(event);
            } catch (error) {
                console.error('Error in signal listener:', error);
            }
        }
    }
}

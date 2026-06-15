import { FSCore } from '@fs/cadnginx';

/** i18n 实例必须满足的最小接口 */
export interface II18nInstance {
    /** 翻译方法：key -> 翻译后文字 */
    t(key: string, ...args: any[]): string;
    /** 当前语言标识（支持 string 或具有 value 属性的对象，兼容 Vue Ref） */
    locale: string | { value: string };
}

class I18nProvider {
    private static _instance: I18nProvider;
    private _i18n: II18nInstance | null = null;

    /** 语言切换信号，前端调用 notifyLocaleChanged() 后派发 */
    public signalLocaleChanged = new FSCore.Util.Signal();

    public static getInstance(): I18nProvider {
        if (!this._instance) {
            this._instance = new I18nProvider();
        }

        return this._instance;
    }

    /** 是否已注册过 i18n 实例 */
    private _setup = false;

    /**
     * 注册 i18n 实例（由前端在初始化时调用）
     * 语义：只允许 setup 一次，重复调用会 console.warn 并忽略
     * 如需替换实例，先调用 reset() 再 setup()
     */
    public setup(i18n: II18nInstance): void {
        if (this._setup) {
            console.warn('[I18nProvider] setup() already called. Call reset() first if you need to replace the i18n instance.');

            return;
        }
        this._i18n = i18n;
        this._setup = true;
    }

    /**
     * 翻译文字
     * @param key 翻译键
     * @param defaultText 未注册 i18n 实例时的回退文字
     */
    public t(key: string, defaultText?: string): string {
        if (this._i18n) {
            const result = this._i18n.t(key);

            // t() 返回 key 本身说明找不到翻译，使用 defaultText
            return (result !== key && result) ? result : (defaultText ?? key);
        }

        return defaultText ?? key;
    }

    /** 获取当前语言 */
    public get locale(): string {
        if (!this._i18n) return 'zh-CN';
        const loc = this._i18n.locale;

        // 兼容 Vue ref 或具有 value 属性的对象
        return typeof loc === 'object' && 'value' in loc ? loc.value : loc as string;
    }

    /**
     * 通知语言已切换
     * 前端切换语言后调用此方法，I18nProvider 派发 signalLocaleChanged
     * 业务层监听此信号，批量触发 dirtyMaterial 刷新所有文字
     */
    public notifyLocaleChanged(): void {
        this.signalLocaleChanged.dispatch();
    }

    /** 重置（测试用，或语言切换时先 reset 再 setup） */
    public reset(): void {
        this._i18n = null;
        this._setup = false;
    }
}

export const i18nProvider = I18nProvider.getInstance();

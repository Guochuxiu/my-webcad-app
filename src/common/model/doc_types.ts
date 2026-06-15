/** 文档接口 - 用于 Manager 层访问实体列表 */
export interface IDoc {
    entityList: {
        forEach(callback: (entity: unknown) => void): void;
    };
}

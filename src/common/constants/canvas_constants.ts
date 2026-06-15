/** 模型选择模式 */
export enum SELECTION_MODE {
    POINT = 1,
    LINE = 2,
    FACE = 3,
    BODY = 4,
    WORKPIECE = 5 // 选工件
}

/** 单选/多选/减选模式 */
export enum SELECTION_TYPE {
    /** 单选 */
    SINGLE = 0,
    /** 多选 */
    MULTIPLE = 1,
    /** 减选 */
    SUBTRACT = 2
}

/**
 * 实体状态类型
 * 用于控制实体的显示样式
 */
export type EntityState = 'active' | 'inactive' | 'offline';

/** 实体状态常量 */
export const ENTITY_STATE = {
    /** 活跃状态 - 使用默认材质 */
    ACTIVE: 'active',
    /** 非活跃状态 - 灰色暗淡 */
    INACTIVE: 'inactive',
    /** 离线状态 - 红色半透明 */
    OFFLINE: 'offline'
} as const;

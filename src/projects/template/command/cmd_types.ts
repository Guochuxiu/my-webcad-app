// 命令名常量。UI/Handle 只认这里的命令名，具体实现由 cmd_register 统一映射。
export enum CMD_TYPES {
    /** 加载场景 */
    LOAD_SCENE = 'loadScene',
    /** 导入模型 */
    IMPORT_MODEL = 'importModel',
    /** 导入点云 */
    IMPORT_POINT_CLOUD = 'importPointCloud',
    /** 创建简单工件 */
    CREATE_SIMPLE_WORKPIECE = 'create_simple_workpiece',
    /** 移动简单工件 */
    MOVE_WORKPIECE = 'move_workpiece',
    /** 创建传送带 */
    CREATE_CONVEYOR = 'create_conveyor',
    /** 设置传送带状态 */
    SET_CONVEYOR_STATUS = 'set_conveyor_status',
    /** 手动上料 */
    LOAD_WORKPIECE = 'load_workpiece',
    /** 手动下料 */
    UNLOAD_WORKPIECE = 'unload_workpiece',
    /** 按 tick 推进传送带上的工件 */
    TICK_CONVEYOR_WORKPIECES = 'tick_conveyor_workpieces',
    /** 创建最小流水线演示 */
    CREATE_PIPELINE_DEMO = 'create_pipeline_demo',
    /** 设置最小流水线状态 */
    SET_PIPELINE_STATUS = 'set_pipeline_status',
    /** 推进最小流水线 tick */
    TICK_PIPELINE = 'tick_pipeline',
}


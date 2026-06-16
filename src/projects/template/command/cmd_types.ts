//命令名常量
export enum CMD_TYPES {
    /**加载场景 */
    LOAD_SCENE = 'loadScene',
    /**导入模型 */
    IMPORT_MODEL = 'importModel',
    /**导入点云 */
    IMPORT_POINT_CLOUD = 'importPointCloud',
    /**创建简单工件 */
    CREATE_SIMPLE_WORKPIECE = 'create_simple_workpiece',
    /**移动简单工件 */
    MOVE_WORKPIECE = 'move_workpiece',
    /**创建传送带 */
    CREATE_CONVEYOR = 'create_conveyor',
    /**设置传送带状态 */
    SET_CONVEYOR_STATUS = 'set_conveyor_status'
}

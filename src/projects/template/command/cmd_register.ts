import { CommandClass, CmdParamTypesOf, registerCmds } from '@/common/command/cmd_types';
import { TempCanvas } from '../view/temp_canvas';
import { CmdLoadScene } from './cmd_load_scene';
import { CmdImportModel } from './cmd_import_model';
import { CmdImportPointCloud } from './cmd_import_pointcloud';
import { CreateSimpleWorkpieceCommand } from './cmd_create_simple_workpiece';
import { MoveWorkpieceCommand } from './cmd_move_workpiece';
import { CreateConveyorCommand } from './cmd_create_conveyor';
import { SetConveyorStatusCommand } from './cmd_set_conveyor_status';
import { CMD_TYPES } from './cmd_types';

//命令注册表，这个 map 的作用是把“命令名”映射到“命令类”
export const TEMPLATE_CMD_CLASS_MAP = {
    [CMD_TYPES.LOAD_SCENE]: CmdLoadScene,
    [CMD_TYPES.IMPORT_MODEL]: CmdImportModel,
    [CMD_TYPES.IMPORT_POINT_CLOUD]: CmdImportPointCloud,
    // 新命令必须进入统一映射，TempCanvas._registerCommands 才能注册到 CommandManager。
    [CMD_TYPES.CREATE_SIMPLE_WORKPIECE]: CreateSimpleWorkpieceCommand,
    [CMD_TYPES.MOVE_WORKPIECE]: MoveWorkpieceCommand,
    [CMD_TYPES.CREATE_CONVEYOR]: CreateConveyorCommand,
    [CMD_TYPES.SET_CONVEYOR_STATUS]: SetConveyorStatusCommand
} satisfies Record<CMD_TYPES, CommandClass<any>>;

// 自动映射
export type TemplateCmdParamTypes = CmdParamTypesOf<typeof TEMPLATE_CMD_CLASS_MAP>;

// 注册到当前 view 的 CommandManager，外部 handle 执行命令时会从这里找到命令类。
export function registerCmd(view: TempCanvas) {
    registerCmds(view, TEMPLATE_CMD_CLASS_MAP);
}

import { CommandClass, CmdParamTypesOf, registerCmds } from '@/common/command/cmd_types';
import { TempCanvas } from '../view/temp_canvas';
import { CreateConveyorCommand } from './cmd_create_conveyor';
import { CreateLoadingDevicesCommand } from './cmd_create_loading_devices';
import { CreatePipelineDemoCommand } from './cmd_create_pipeline_demo';
import { CreateSimpleWorkpieceCommand } from './cmd_create_simple_workpiece';
import { CmdImportModel } from './cmd_import_model';
import { CmdImportPointCloud } from './cmd_import_pointcloud';
import { CmdLoadScene } from './cmd_load_scene';
import { LoadWorkpieceCommand } from './cmd_load_workpiece';
import { MoveWorkpieceCommand } from './cmd_move_workpiece';
import { SetConveyorStatusCommand } from './cmd_set_conveyor_status';
import { SetPipelineStatusCommand } from './cmd_set_pipeline_status';
import { StartAutomationPipelineCommand } from './cmd_start_automation_pipeline';
import { StopAutomationPipelineCommand } from './cmd_stop_automation_pipeline';
import { TickAutomationPipelineCommand } from './cmd_tick_automation_pipeline';
import { TickConveyorWorkpiecesCommand } from './cmd_tick_conveyor_workpieces';
import { TickPipelineCommand } from './cmd_tick_pipeline';
import { UnloadWorkpieceCommand } from './cmd_unload_workpiece';
import { CMD_TYPES } from './cmd_types';

// 命令注册表：把命令名映射到命令类，TempCanvas 初始化时统一注册到 CommandManager。
export const TEMPLATE_CMD_CLASS_MAP = {
    [CMD_TYPES.LOAD_SCENE]: CmdLoadScene,
    [CMD_TYPES.IMPORT_MODEL]: CmdImportModel,
    [CMD_TYPES.IMPORT_POINT_CLOUD]: CmdImportPointCloud,
    [CMD_TYPES.CREATE_SIMPLE_WORKPIECE]: CreateSimpleWorkpieceCommand,
    [CMD_TYPES.MOVE_WORKPIECE]: MoveWorkpieceCommand,
    [CMD_TYPES.CREATE_CONVEYOR]: CreateConveyorCommand,
    [CMD_TYPES.CREATE_LOADING_DEVICES]: CreateLoadingDevicesCommand,
    [CMD_TYPES.SET_CONVEYOR_STATUS]: SetConveyorStatusCommand,
    [CMD_TYPES.LOAD_WORKPIECE]: LoadWorkpieceCommand,
    [CMD_TYPES.UNLOAD_WORKPIECE]: UnloadWorkpieceCommand,
    [CMD_TYPES.TICK_CONVEYOR_WORKPIECES]: TickConveyorWorkpiecesCommand,
    [CMD_TYPES.CREATE_PIPELINE_DEMO]: CreatePipelineDemoCommand,
    [CMD_TYPES.SET_PIPELINE_STATUS]: SetPipelineStatusCommand,
    [CMD_TYPES.TICK_PIPELINE]: TickPipelineCommand,
    [CMD_TYPES.START_AUTOMATION_PIPELINE]: StartAutomationPipelineCommand,
    [CMD_TYPES.STOP_AUTOMATION_PIPELINE]: StopAutomationPipelineCommand,
    [CMD_TYPES.TICK_AUTOMATION_PIPELINE]: TickAutomationPipelineCommand,
} satisfies Record<CMD_TYPES, CommandClass<any>>;

export type TemplateCmdParamTypes = CmdParamTypesOf<typeof TEMPLATE_CMD_CLASS_MAP>;

export function registerCmd(view: TempCanvas) {
    registerCmds(view, TEMPLATE_CMD_CLASS_MAP);
}

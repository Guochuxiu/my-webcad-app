import { CommandClass, CmdParamTypesOf, registerCmds } from '@/common/command/cmd_types';
import { TempCanvas } from '../view/temp_canvas';
import { CmdLoadScene } from './cmd_load_scene';
import { CmdImportModel } from './cmd_import_model';
import { CmdImportPointCloud } from './cmd_import_pointcloud';
import { CMD_TYPES } from './cmd_types';

export const TEMPLATE_CMD_CLASS_MAP = {
    [CMD_TYPES.LOAD_SCENE]: CmdLoadScene,
    [CMD_TYPES.IMPORT_MODEL]: CmdImportModel,
    [CMD_TYPES.IMPORT_POINT_CLOUD]: CmdImportPointCloud
} satisfies Record<CMD_TYPES, CommandClass<any>>;

// 自动映射
export type TemplateCmdParamTypes = CmdParamTypesOf<typeof TEMPLATE_CMD_CLASS_MAP>;

// 注册
export function registerCmd(view: TempCanvas) {
    registerCmds(view, TEMPLATE_CMD_CLASS_MAP);
}

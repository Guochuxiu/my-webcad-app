import { BaseViewHandle } from '@/common';
import { TempCanvas } from './temp_canvas';
import type { ImportModelParams } from '../command/cmd_import_model';
import type { CreateSimpleWorkpieceParams } from '../command/cmd_create_simple_workpiece';
import type { MoveWorkpieceParams } from '../command/cmd_move_workpiece';
import type { CreateConveyorParams } from '../command/cmd_create_conveyor';
import type { SetConveyorStatusParams } from '../command/cmd_set_conveyor_status';
import { CMD_TYPES } from '../command/cmd_types';
import { SimpleWorkpiece } from '../model/workpiece';
import { ConveyorEntity } from '../model/conveyor';

//Handle 层负责把底层 Canvas 能力包装成 UI 容易调用的业务方法
//创建工件
//UI 真正想展示的是父级工件信息，所以这里沿 parent 向上找最近的 SimpleWorkpiece
export class TempViewHandle extends BaseViewHandle<TempCanvas> {
    public importModels(params: ImportModelParams): Promise<void> {
        return this.executeCommand(CMD_TYPES.IMPORT_MODEL, params);
    }

    public createSimpleWorkpiece(params: CreateSimpleWorkpieceParams): Promise<void> {
        return this.executeCommand(CMD_TYPES.CREATE_SIMPLE_WORKPIECE, params);
    }

    public moveWorkpiece(params: MoveWorkpieceParams): Promise<void> {
        return this.executeCommand(CMD_TYPES.MOVE_WORKPIECE, params);
    }

    public createConveyor(params?: CreateConveyorParams): Promise<void> {
        return this.executeCommand(CMD_TYPES.CREATE_CONVEYOR, params);
    }

    public setConveyorStatus(params: SetConveyorStatusParams): Promise<void> {
        return this.executeCommand(CMD_TYPES.SET_CONVEYOR_STATUS, params);
    }

    /**
     * 选择命中的可能是主体 BatchMesh、特征线 BatchLine 或特征点 BatchPoint。
     * 这里沿 parent 向上查找 SimpleWorkpiece，让 UI 始终展示父级工件的业务信息。
     */
    public findSimpleWorkpieceByEntityIds(ids: number[]): SimpleWorkpiece | null {
        for (const id of ids) {
            let entity = this._canvas.app.doc.getEntity(id);

            while (entity) {
                if (entity instanceof SimpleWorkpiece) {
                    return entity;
                }
                entity = entity.parent;
            }
        }

        return null;
    }

    public findConveyorByEntityIds(ids: number[]): ConveyorEntity | null {
        for (const id of ids) {
            let entity = this._canvas.app.doc.getEntity(id);

            while (entity) {
                if (entity instanceof ConveyorEntity) {
                    return entity;
                }
                entity = entity.parent;
            }
        }

        return null;
    }

    public findFirstConveyor(): ConveyorEntity | null {
        const entity = this._canvas.app.doc.entityList.find(item => item instanceof ConveyorEntity);

        return entity instanceof ConveyorEntity ? entity : null;
    }
}

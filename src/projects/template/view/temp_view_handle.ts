import { BaseViewHandle } from '@/common';
import type { CreateConveyorParams } from '../command/cmd_create_conveyor';
import type { CreatePipelineDemoParams } from '../command/cmd_create_pipeline_demo';
import type { CreateSimpleWorkpieceParams } from '../command/cmd_create_simple_workpiece';
import type { ImportModelParams } from '../command/cmd_import_model';
import type { LoadWorkpieceParams } from '../command/cmd_load_workpiece';
import type { MoveWorkpieceParams } from '../command/cmd_move_workpiece';
import type { SetConveyorStatusParams } from '../command/cmd_set_conveyor_status';
import type { SetPipelineStatusParams } from '../command/cmd_set_pipeline_status';
import type { TickConveyorWorkpiecesParams } from '../command/cmd_tick_conveyor_workpieces';
import type { TickPipelineParams } from '../command/cmd_tick_pipeline';
import type { UnloadWorkpieceParams } from '../command/cmd_unload_workpiece';
import { CMD_TYPES } from '../command/cmd_types';
import { ConveyorEntity } from '../model/conveyor';
import { createLogisticsSnapshot, findConveyorByEntityId, findFirstConveyor, LogisticsSnapshot } from '../model/logistics';
import { PipelineEntity } from '../model/pipeline';
import { SimpleWorkpiece } from '../model/workpiece';
import { TempCanvas } from './temp_canvas';

/**
 * Handle 层负责把 Canvas/Command 能力包装成 UI 可调用的业务方法。
 *
 * 页面只通过这里触发命令，避免直接修改 scene 或直接改实体状态。
 */
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

    public loadWorkpiece(params?: LoadWorkpieceParams): Promise<void> {
        return this.executeCommand(CMD_TYPES.LOAD_WORKPIECE, params);
    }

    public unloadWorkpiece(params?: UnloadWorkpieceParams): Promise<void> {
        return this.executeCommand(CMD_TYPES.UNLOAD_WORKPIECE, params);
    }

    public tickConveyorWorkpieces(params: TickConveyorWorkpiecesParams): Promise<void> {
        return this.executeCommand(CMD_TYPES.TICK_CONVEYOR_WORKPIECES, params);
    }

    public createPipelineDemo(params?: CreatePipelineDemoParams): Promise<void> {
        return this.executeCommand(CMD_TYPES.CREATE_PIPELINE_DEMO, params);
    }

    public setPipelineStatus(params: SetPipelineStatusParams): Promise<void> {
        return this.executeCommand(CMD_TYPES.SET_PIPELINE_STATUS, params);
    }

    public tickPipeline(params: TickPipelineParams): Promise<void> {
        return this.executeCommand(CMD_TYPES.TICK_PIPELINE, params);
    }

    /**
     * 选中的可能是工件主体、特征线或特征点，这里沿 parent 向上找父级 SimpleWorkpiece。
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

    public findPipelineByEntityIds(ids: number[]): PipelineEntity | null {
        for (const id of ids) {
            let entity = this._canvas.app.doc.getEntity(id);

            while (entity) {
                if (entity instanceof PipelineEntity) {
                    return entity;
                }
                entity = entity.parent;
            }
        }

        return null;
    }

    public findFirstConveyor(): ConveyorEntity | null {
        return findFirstConveyor(this._canvas.app.doc.entityList);
    }

    public findFirstPipeline(): PipelineEntity | null {
        const entity = this._canvas.app.doc.entityList.find(item => item instanceof PipelineEntity);

        return entity instanceof PipelineEntity ? entity : null;
    }

    public getLogisticsSnapshot(conveyorId?: number): LogisticsSnapshot {
        const conveyor = findConveyorByEntityId(this._canvas.app.doc.entityList, conveyorId);

        return createLogisticsSnapshot(this._canvas.app.doc.entityList, conveyor);
    }
}


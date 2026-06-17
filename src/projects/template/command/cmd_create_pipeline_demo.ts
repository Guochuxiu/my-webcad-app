import { CmdBase } from '@/common';
import { ConveyorEntity, DEFAULT_CONVEYOR_META } from '../model/conveyor';
import { PipelineEntity, PipelineMeta, getWarehousePosition } from '../model/pipeline';
import { SimpleWorkpieceFactory, WorkpieceType } from '../model/workpiece';
import { TempCanvas } from '../view/temp_canvas';
import { getOrCreateWarehouse, getOrCreateWorktable, syncWarehouseStatus, syncWorktableStatus } from './pipeline_command_utils';

export interface CreatePipelineDemoParams {
    id?: string;
    workpieceCount?: number;
}

export interface PipelineCreatedEvent {
    type: 'pipelineCreated';
    pipelineId: number;
    conveyorId: number;
    workpieceIds: number[];
}

const DEFAULT_PIPELINE_ID = 'pipeline_01';

export class CreatePipelineDemoCommand extends CmdBase<CreatePipelineDemoParams, TempCanvas> {
    public async commit(): Promise<void> {
        const pipelineBusinessId = this._params?.id ?? DEFAULT_PIPELINE_ID;

        getOrCreateWarehouse(this._view);
        getOrCreateWorktable(this._view);
        this._removeExistingPipeline(pipelineBusinessId);

        const conveyor = this._getOrCreateConveyor();
        const workpieceIds = this._createWarehouseWorkpieces(Math.max(3, this._params?.workpieceCount ?? 3));
        const pipelineMeta: PipelineMeta = {
            id: pipelineBusinessId,
            conveyorId: conveyor.id,
            workpieceIds,
            status: 'idle',
            loaderDuration: 1,
            unloaderDuration: 1,
            worktableDuration: 8
        };
        const pipeline = new PipelineEntity(pipelineMeta);

        this._view.addModel(pipeline);
        pipeline.dirtyGeometry();
        syncWarehouseStatus(this._view);
        syncWorktableStatus(this._view);
        conveyor.setStatus('idle');
        this._view.dirty();
        this._view.runInNewFrame(() => {
            this._view.fitView();
            this._view.select([pipeline.id]);
        });

        this._view.app.signalEventBus.dispatch({
            type: 'pipelineCreated',
            pipelineId: pipeline.id,
            conveyorId: conveyor.id,
            workpieceIds
        } satisfies PipelineCreatedEvent);

        super.commit({
            pipelineId: pipeline.id,
            conveyorId: conveyor.id,
            workpieceIds
        });
    }

    private _removeExistingPipeline(pipelineBusinessId: string): void {
        const existed = this._view.app.doc.entityList.find(entity => {
            return entity instanceof PipelineEntity && entity.businessId === pipelineBusinessId;
        });

        if (!(existed instanceof PipelineEntity)) return;

        // 只清理该流水线记录的演示工件和流水线实体，避免误删用户手动创建的其它对象。
        this._view.eraseModel(existed.workpieceIds);
        this._view.eraseModel([existed.id]);
    }

    private _getOrCreateConveyor(): ConveyorEntity {
        const existed = this._view.app.doc.entityList.find(entity => {
            return entity instanceof ConveyorEntity && entity.conveyorId === DEFAULT_CONVEYOR_META.id;
        });

        if (existed instanceof ConveyorEntity) {
            existed.setEndpoints(DEFAULT_CONVEYOR_META.startPoint, DEFAULT_CONVEYOR_META.endPoint);
            existed.setRuntimeData(DEFAULT_CONVEYOR_META.speed, DEFAULT_CONVEYOR_META.capacity);
            existed.setStatus('idle');

            return existed;
        }

        const conveyor = new ConveyorEntity(DEFAULT_CONVEYOR_META);

        this._view.addModel(conveyor);
        conveyor.dirtyGeometry();

        return conveyor;
    }

    private _createWarehouseWorkpieces(count: number): number[] {
        const workpieceIds: number[] = [];

        for (let index = 0; index < count; index++) {
            const type: WorkpieceType = index % 2 === 0 ? 'box' : 'cylinder';
            const workpiece = SimpleWorkpieceFactory.create({
                type,
                center: getWarehousePosition(index)
            });

            workpiece.setState('waiting');
            workpiece.setLocation('warehouse_01');
            this._view.addModel(workpiece);
            workpiece.dirtyGeometry();
            workpieceIds.push(workpiece.id);
        }

        return workpieceIds;
    }
}

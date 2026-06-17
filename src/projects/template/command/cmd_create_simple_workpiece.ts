import { CmdBase } from '@/common';
import { getWarehousePosition } from '../model/pipeline';
import { createLogisticsSnapshot, getWarehouseWorkpieces, LogisticsSnapshotEvent } from '../model/logistics';
import { SimpleWorkpieceFactory, WorkpieceType } from '../model/workpiece';
import { TempCanvas } from '../view/temp_canvas';
import { getOrCreateWarehouse } from './pipeline_command_utils';

export interface CreateSimpleWorkpieceParams {
    type: WorkpieceType;
    center?: [number, number, number];
}

/**
 * 创建简单工件实体。
 *
 * 工件默认进入 warehouse_01，并通过 Entity -> Display 注册链显示。
 */
export class CreateSimpleWorkpieceCommand extends CmdBase<CreateSimpleWorkpieceParams, TempCanvas> {
    async commit() {
        if (!this._params?.type) {
            this.cancel();

            return;
        }

        //获取或创建一个仓库实体
        const warehouse = getOrCreateWarehouse(this._view);
        //获取仓库中的工件
        const waitingIndex = getWarehouseWorkpieces(this._view.app.doc.entityList).length;
        //创建工件
        const workpiece = SimpleWorkpieceFactory.create({
            type: this._params.type,
            center: this._params.center ?? getWarehousePosition(waitingIndex),
        });

        this._view.addModel(workpiece);
        workpiece.dirtyGeometry();
        warehouse.setStatus('has_workpieces');
        this._view.dirty();
        this._dispatchLogisticsSnapshot();

        // 等 display 在下一帧创建完成后再 fit/select，避免新实体尚未进入包围盒计算。
        this._view.runInNewFrame(() => {
            this._view.fitView();
            this._view.select([workpiece.id]);
        });

        super.commit({ workpieceId: workpiece.id });
    }

    //创建工件后，重新计算当前物流状态，并通过事件总线通知 UI 更新
    private _dispatchLogisticsSnapshot(): void {
        const snapshot = createLogisticsSnapshot(this._view.app.doc.entityList);
        const event: LogisticsSnapshotEvent = {
            type: 'logisticsSnapshot',
            ...snapshot,
        };

        this._view.app.signalEventBus.dispatch(event);
    }
}

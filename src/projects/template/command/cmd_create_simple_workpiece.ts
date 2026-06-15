import { CmdBase } from '@/common';
import { SimpleWorkpieceFactory, WorkpieceType } from '../model/workpiece';
import { TempCanvas } from '../view/temp_canvas';

export interface CreateSimpleWorkpieceParams {
    type: WorkpieceType;
    center?: [number, number, number];
}

/**
 * 创建简单工件命令。
 *
 * UI 只负责发起命令；真正的实体创建、接入模型层和刷新视图都在 Command 中完成，
 * 这样符合 WebCAD 的 Command -> Entity -> Display 运行链路。
 */
export class CreateSimpleWorkpieceCommand extends CmdBase<CreateSimpleWorkpieceParams, TempCanvas> {
    async commit() {
        if (!this._params?.type) {
            this.cancel();

            return;
        }

        const workpiece = SimpleWorkpieceFactory.create({
            type: this._params.type,
            center: this._params.center
        });

        // addModel 会把业务实体加入 WebCAD 模型层，由 Canvas 的 Display 注册表接管显示。
        this._view.addModel(workpiece);
        workpiece.dirtyGeometry();
        this._view.dirty();
        // 等当前帧完成 display 创建后再 fitView，避免新实体尚未参与包围盒计算。
        this._view.runInNewFrame(() => {
            this._view.fitView();
        });

        super.commit();
    }
}

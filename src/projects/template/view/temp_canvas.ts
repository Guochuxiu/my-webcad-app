import { Display, FSApp, FSCore } from '@fs/cadnginx';
import { Base3DCanvas } from '@/common/core/base_3d_canvas';
import { SELECTION_MODE } from '@/common/constants/canvas_constants';
import { PickPriority } from '@/common/core/pick_strategy/pick_strategy';
import { registerCmd } from '../command/cmd_register';
import { SimpleWorkpiece } from '../model/workpiece';
import { ConveyorEntity } from '../model/conveyor';
import { ConveyorDisplay } from '../display/conveyor';

//业务canvas，
// 包含dispaly注册实现 Entity -> Display 映射机制
// Command 注册：把 template 项目的命令注册到当前 app 的 cmdManage
//PickHelper 注册：这段配置当前视图的拾取策略


export class TempCanvas extends Base3DCanvas {

    constructor(params: FSApp.View.Three.IThreeCanvasConstructorParams) {
        super({
            domElement: params.domElement,
            app: params.app
        });
        const theme = this._config.get('common.theme') || 'light';
    }

    protected _registerCommands(): void {
        registerCmd(this);
    }

    protected _registerDisplay(): void {
        super._registerDisplay();
        // SimpleWorkpiece 自身是业务容器，用 Group Display 聚合子实体显示。
        this.registerDisplayType(SimpleWorkpiece, e => this.createDisplay(e, FSApp.View.Three.Group));
        // 工件主体和特征使用底座批量显示实体，必须在当前 Canvas 显式注册。
        this.registerDisplayType(FSCore.Model.BatchMesh, e => this.createDisplay(e, Display.BatchMeshDisplay));
        this.registerDisplayType(FSCore.Model.BatchLine, e => this.createDisplay(e, Display.BatchLineDisplay));
        this.registerDisplayType(FSCore.Model.BatchPoint, e => this.createDisplay(e, Display.BatchPointDisplay));
        this.registerDisplayType(ConveyorEntity, e => this.createDisplay(e, ConveyorDisplay));
    }

    protected _registerPickHelper(): void {
        this.pickHelper.registerStrategy(
            SELECTION_MODE.WORKPIECE,
            FSApp.View.Three.ThreeDisplay as unknown as new (...args: any[]) => FSApp.View.Three.ThreeDisplay,
            PickPriority.Default
        );
        this.pickHelper.use([this.selectionMode]);
    }
}

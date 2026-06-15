import { FSApp } from '@fs/cadnginx';
import { Base3DCanvas } from '@/common/core/base_3d_canvas';
import { SELECTION_MODE } from '@/common/constants/canvas_constants';
import { PickPriority } from '@/common/core/pick_strategy/pick_strategy';
import { registerCmd } from '../command/cmd_register';

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

    protected _registerPickHelper(): void {
        this.pickHelper.registerStrategy(
            SELECTION_MODE.WORKPIECE,
            FSApp.View.Three.ThreeDisplay as unknown as new (...args: any[]) => FSApp.View.Three.ThreeDisplay,
            PickPriority.Default
        );
        this.pickHelper.use([this.selectionMode]);
    }
}

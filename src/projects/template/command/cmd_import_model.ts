import { Constants, ResourceManager } from '@fs/cadnginx';
import { CmdBase, SesNodeEntity, SesSceneEntity } from '@/common';
import { dedupeImportFiles, isSesFile } from '../utils/model_import';
import { TempCanvas } from '../view/temp_canvas';

export interface ImportModelParams {
    files: File[];
    fitView?: boolean;
}

//定义了一个“导入模型”命令：接收用户选择的文件，解析成 WebCAD Entity，然后加入当前 TempCanvas 的模型层并刷新视图。
export class CmdImportModel extends CmdBase<ImportModelParams, TempCanvas> {
    async commit() {
        const files = dedupeImportFiles(this._params?.files ?? []);

        if (!files.length) {
            throw new Error('未选择可导入的模型文件');
        }

        const entities = await this._loadEntities(files);

        if (!entities.length) {
            throw new Error('未解析到可导入的模型数据');
        }

        entities.forEach(entity => {
            this._view.addModel(entity);
        });

        this._view.dirty();

        if (this._params?.fitView ?? true) {
            this._view.runInNewFrame(() => {
                this._view.fitView();
            });
        }

        super.commit();
    }

    private async _loadEntities(files: File[]) {
        if (files.length === 1 && isSesFile(files[0])) {
            const scene = new SesSceneEntity();
            await scene.loadSes(files[0], SesNodeEntity);

            return [scene];
        }

        ResourceManager.registerLoaderConfig(Constants.FileType.SES, {
            objectNodeClass: SesNodeEntity
        });

        const result = await ResourceManager.loadFromFiles(files);

        return result.nodes ?? [];
    }
}

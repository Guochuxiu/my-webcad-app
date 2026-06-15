import { FSCore } from '@fs/cadnginx';
import { CmdBase } from '@/common';
import { parsePCD, isPCDFile } from '../utils/pcd_parser';
import { TempCanvas } from '../view/temp_canvas';

const PointCloud = FSCore.Model.PointCloud;
const PointCloudSlice = FSCore.Model.PointCloudSlice;

export interface ImportPointCloudParams {
    files: File[];
    fitView?: boolean;
}

export class CmdImportPointCloud extends CmdBase<ImportPointCloudParams, TempCanvas> {
    async commit() {
        const files = (this._params?.files ?? []).filter(isPCDFile);

        if (!files.length) {
            throw new Error('未选择可导入的 PCD 文件');
        }

        for (const file of files) {
            const pointcloud = await this._loadPointCloud(file);
            this._view.addModel(pointcloud);
        }

        this._view.dirty();

        this._view.runInNewFrame(() => {
            this._view.fitView();
        });

        super.commit();
    }

    private async _loadPointCloud(file: File): Promise<any> {
        const buffer = await file.arrayBuffer();
        const { positions, colors } = parsePCD(buffer);

        const pointCount = positions.length / 3;

        if (pointCount === 0) {
            throw new Error(`PCD 文件 ${file.name} 中没有有效的点数据`);
        }

        // @ts-ignore - FSCore.Model.PointCloud 构造函数不接受参数
        const pointcloud = new PointCloud();

        if (colors) {
            pointcloud.updateColorByDirection(true);
            pointcloud.addVoxelizedPoints(positions, colors, 200, 200, 200, PointCloudSlice);
        } else {
            pointcloud.updateColorByDirection(true);
            // @ts-ignore
            pointcloud.addVoxelizedPoints(positions, 0x999999, 200, 200, 200, PointCloudSlice);
        }

        return pointcloud;
    }
}

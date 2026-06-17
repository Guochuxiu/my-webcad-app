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
//导入点云模型命令
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
        //把文件内容读取成一段二进制内存数据
        const buffer = await file.arrayBuffer();
        //把 PCD 文件内容解析成 WebCAD 点云可用的数据数组,返回点坐标和颜色
        const { positions, colors } = parsePCD(buffer);

        const pointCount = positions.length / 3;

        if (pointCount === 0) {
            throw new Error(`PCD 文件 ${file.name} 中没有有效的点数据`);
        }

        // @ts-ignore - FSCore.Model.PointCloud 构造函数不接受参数
        const pointcloud = new PointCloud();

        if (colors) {
            //告诉 PointCloud 开启“按方向更新颜色”的能力
            pointcloud.updateColorByDirection(true);
            //把点云数据加入 pointcloud，把大量点按 200 x 200 x 200 的空间块组织起来
            pointcloud.addVoxelizedPoints(positions, colors, 200, 200, 200, PointCloudSlice);
        } else {
            pointcloud.updateColorByDirection(true);
            //如果 PCD 没有颜色，就用灰色显示所有点
            // @ts-ignore
            pointcloud.addVoxelizedPoints(positions, 0x999999, 200, 200, 200, PointCloudSlice);
        }

        return pointcloud;
    }
}

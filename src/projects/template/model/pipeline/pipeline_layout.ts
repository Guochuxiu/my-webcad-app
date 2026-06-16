import type { ConveyorEntity } from '../conveyor';
import type { PipelinePoint } from './pipeline_types';

export const PIPELINE_LAYOUT = {
    warehouseStart: [-160, -220, 70] as PipelinePoint,
    warehouseGap: [0, -120, 0] as PipelinePoint,
    loaderPoint: [-80, 0, 70] as PipelinePoint,
    unloaderPoint: [880, 0, 70] as PipelinePoint,
    worktablePoint: [960, 170, 70] as PipelinePoint,
    completedStart: [1110, 170, 70] as PipelinePoint,
    completedGap: [0, 110, 0] as PipelinePoint
};

export function getWarehousePosition(index: number): PipelinePoint {
    return addPoint(PIPELINE_LAYOUT.warehouseStart, scalePoint(PIPELINE_LAYOUT.warehouseGap, index));
}

export function getCompletedPosition(index: number): PipelinePoint {
    return addPoint(PIPELINE_LAYOUT.completedStart, scalePoint(PIPELINE_LAYOUT.completedGap, index));
}

export function getConveyorPosition(conveyor: ConveyorEntity, progress: number): PipelinePoint {
    return interpolatePoint(conveyor.startPoint, conveyor.endPoint, clamp01(progress));
}

export function interpolatePoint(from: PipelinePoint, to: PipelinePoint, progress: number): PipelinePoint {
    const localProgress = clamp01(progress);

    return [
        from[0] + (to[0] - from[0]) * localProgress,
        from[1] + (to[1] - from[1]) * localProgress,
        from[2] + (to[2] - from[2]) * localProgress
    ];
}

export function addPoint(a: PipelinePoint, b: PipelinePoint): PipelinePoint {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function scalePoint(point: PipelinePoint, scale: number): PipelinePoint {
    return [point[0] * scale, point[1] * scale, point[2] * scale];
}

function clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
}

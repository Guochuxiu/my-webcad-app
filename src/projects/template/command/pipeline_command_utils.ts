import { TempCanvas } from '../view/temp_canvas';
import { ConveyorEntity, DEFAULT_CONVEYOR_META } from '../model/conveyor';
import { LoadingDeviceEntity, LoadingDeviceKind } from '../model/loading_device';
import { WarehouseEntity } from '../model/warehouse';
import {
    createLogisticsSnapshot,
    findFirstConveyor,
    findLoadingDeviceByKind,
    getWarehouseWorkpieces,
} from '../model/logistics';
import { getWorkpieceOnBeltPosition, getWarehousePosition, PIPELINE_LAYOUT } from '../model/pipeline';
import { SimpleWorkpieceFactory, WorkpieceType } from '../model/workpiece';

export const AUTOMATION_PIPELINE_ID = 'automation_pipeline_01';
export const DEFAULT_WAREHOUSE_ID = 'warehouse_01';

export function getOrCreateWarehouse(view: TempCanvas): WarehouseEntity {
    const existed = view.app.doc.entityList.find(entity => {
        return entity instanceof WarehouseEntity && entity.businessId === DEFAULT_WAREHOUSE_ID;
    });

    if (existed instanceof WarehouseEntity) {
        existed.setLayout(PIPELINE_LAYOUT.warehouseBasePoint, PIPELINE_LAYOUT.warehouseBaseSize);
        existed.setStatus(getWarehouseWorkpieces(view.app.doc.entityList).length > 0 ? 'has_workpieces' : 'idle');

        return existed;
    }

    // 多个入口都会确保仓库存在，统一在这里创建可以避免重复底板。
    const warehouse = new WarehouseEntity({
        id: DEFAULT_WAREHOUSE_ID,
        position: PIPELINE_LAYOUT.warehouseBasePoint,
        size: PIPELINE_LAYOUT.warehouseBaseSize,
        status: getWarehouseWorkpieces(view.app.doc.entityList).length > 0 ? 'has_workpieces' : 'idle'
    });

    view.addModel(warehouse);
    warehouse.dirtyGeometry();
    warehouse.dirtyMaterial();
    view.dirty();

    return warehouse;
}

export function syncWarehouseStatus(view: TempCanvas): void {
    const warehouse = view.app.doc.entityList.find(entity => {
        return entity instanceof WarehouseEntity && entity.businessId === DEFAULT_WAREHOUSE_ID;
    });

    if (!(warehouse instanceof WarehouseEntity)) return;

    warehouse.setStatus(getWarehouseWorkpieces(view.app.doc.entityList).length > 0 ? 'has_workpieces' : 'idle');
}

export function getOrCreateConveyor(view: TempCanvas): ConveyorEntity {
    const existed = findFirstConveyor(view.app.doc.entityList);

    if (existed) {
        return existed;
    }

    const conveyor = new ConveyorEntity(DEFAULT_CONVEYOR_META);

    view.addModel(conveyor);
    conveyor.dirtyGeometry();

    return conveyor;
}

export function getOrCreateLoadingDevice(
    view: TempCanvas,
    conveyor: ConveyorEntity,
    kind: LoadingDeviceKind
): LoadingDeviceEntity {
    const existed = findLoadingDeviceByKind(view.app.doc.entityList, kind);
    const points = getLoadingDevicePoints(conveyor, kind);

    if (existed) {
        existed.setPoints(points.position, points.targetPoint);
        existed.setStatus('idle');

        return existed;
    }

    const device = new LoadingDeviceEntity({
        id: kind === 'loader' ? 'loader_01' : 'unloader_01',
        kind,
        position: points.position,
        targetPoint: points.targetPoint,
        status: 'idle'
    });

    view.addModel(device);
    device.dirtyGeometry();

    return device;
}

export function getOrCreateLoadingDevices(view: TempCanvas, conveyor: ConveyorEntity): {
    loader: LoadingDeviceEntity;
    unloader: LoadingDeviceEntity;
} {
    return {
        loader: getOrCreateLoadingDevice(view, conveyor, 'loader'),
        unloader: getOrCreateLoadingDevice(view, conveyor, 'unloader')
    };
}

export function ensureWarehouseWorkpieces(view: TempCanvas, minCount: number): number[] {
    const warehouse = getOrCreateWarehouse(view);
    const waiting = getWarehouseWorkpieces(view.app.doc.entityList);

    for (let index = waiting.length; index < minCount; index++) {
        const type: WorkpieceType = index % 2 === 0 ? 'box' : 'cylinder';
        const workpiece = SimpleWorkpieceFactory.create({
            type,
            center: getWarehousePosition(index)
        });

        workpiece.setState('waiting');
        workpiece.setLocation('warehouse_01');
        view.addModel(workpiece);
        workpiece.dirtyGeometry();
        waiting.push(workpiece);
    }

    waiting.forEach((workpiece, index) => {
        workpiece.setState('waiting');
        workpiece.setLocation('warehouse_01');
        workpiece.setRemaining(0);
        workpiece.moveToPosition(getWarehousePosition(index));
    });
    warehouse.setStatus(waiting.length > 0 ? 'has_workpieces' : 'idle');

    return waiting.map(workpiece => workpiece.id);
}

export function dispatchLogisticsSnapshot(view: TempCanvas, conveyor?: ConveyorEntity | null): void {
    const snapshot = createLogisticsSnapshot(view.app.doc.entityList, conveyor);

    view.app.signalEventBus.dispatch({
        type: 'logisticsSnapshot',
        ...snapshot
    });
}

function getLoadingDevicePoints(conveyor: ConveyorEntity, kind: LoadingDeviceKind): {
    position: [number, number, number];
    targetPoint: [number, number, number];
} {
    const targetPoint = getWorkpieceOnBeltPosition(conveyor, kind === 'loader' ? 0 : 1);
    const fallbackPosition = kind === 'loader' ? PIPELINE_LAYOUT.loaderPoint : PIPELINE_LAYOUT.unloaderPoint;

    return {
        position: [fallbackPosition[0], fallbackPosition[1], fallbackPosition[2]],
        targetPoint
    };
}

import { CmdBase } from '@/common';
import {
    createLogisticsSnapshot,
    findConveyorByEntityId,
    getConveyorProgress,
    getConveyorWorkpieces,
    getExitWaitingWorkpieces,
    LOGISTICS_LOCATIONS,
    LogisticsSnapshotEvent,
} from '../model/logistics';
import { TempCanvas } from '../view/temp_canvas';

export interface TickConveyorWorkpiecesParams {
    conveyorId?: number;
    deltaSeconds: number;
}

const MIN_SLOT_PROGRESS = 0.14;

/**
 * 按 tick 推进传送带上的工件。
 *
 * 只修改工件实体位置和传送带状态；显示刷新仍由 Entity -> Display 完成。
 */
export class TickConveyorWorkpiecesCommand extends CmdBase<TickConveyorWorkpiecesParams, TempCanvas> {
    public async commit(): Promise<void> {
        const conveyor = findConveyorByEntityId(this._view.app.doc.entityList, this._params?.conveyorId);
        const deltaSeconds = Math.max(0, this._params?.deltaSeconds ?? 0);

        if (!conveyor || deltaSeconds <= 0) {
            this.cancel();

            return;
        }

        if (conveyor.status !== 'running' && conveyor.status !== 'blocked') {
            this._dispatchLogisticsSnapshot();
            super.commit(this._createResult());

            return;
        }

        const exitWaiting = getExitWaitingWorkpieces(this._view.app.doc.entityList);
        if (exitWaiting.length > 0) {
            conveyor.setStatus('blocked');
            this._view.dirty();
            this._dispatchLogisticsSnapshot();
            super.commit(this._createResult());

            return;
        }

        const movingWorkpieces = getConveyorWorkpieces(this._view.app.doc.entityList, conveyor)
            .sort((prev, next) => getConveyorProgress(conveyor, next) - getConveyorProgress(conveyor, prev));

        if (movingWorkpieces.length === 0) {
            if (conveyor.status === 'blocked') {
                conveyor.setStatus('running');
                this._view.dirty();
            }

            this._dispatchLogisticsSnapshot();
            super.commit(this._createResult());

            return;
        }

        const step = (conveyor.speed * deltaSeconds) / Math.max(1, conveyor.length);
        let previousFrontProgress = 1 + MIN_SLOT_PROGRESS;
        let hasBlockedExit = false;

        for (const workpiece of movingWorkpieces) {
            const currentProgress = getConveyorProgress(conveyor, workpiece);
            let nextProgress = Math.min(1, currentProgress + step, previousFrontProgress - MIN_SLOT_PROGRESS);

            nextProgress = Math.max(currentProgress, Math.max(0, nextProgress));

            if (nextProgress >= 1 && !hasBlockedExit) {
                workpiece.moveToPosition(conveyor.endPoint);
                workpiece.setRemaining(0);
                workpiece.setState('arrived');
                workpiece.setLocation(LOGISTICS_LOCATIONS.conveyorExit);
                hasBlockedExit = true;
                previousFrontProgress = 1;

                continue;
            }

            const clampedProgress = hasBlockedExit ? Math.min(nextProgress, 1 - MIN_SLOT_PROGRESS) : nextProgress;
            workpiece.moveToPosition(this._getPointOnConveyor(clampedProgress));
            workpiece.setRemaining(((1 - clampedProgress) * conveyor.length) / Math.max(1, conveyor.speed));
            workpiece.setState('moving');
            workpiece.setLocation(conveyor.conveyorId);
            previousFrontProgress = clampedProgress;
        }

        if (hasBlockedExit) {
            conveyor.setStatus('blocked');
        } else if (conveyor.status === 'blocked') {
            conveyor.setStatus('running');
        }

        this._view.dirty();
        this._dispatchLogisticsSnapshot();

        super.commit(this._createResult());
    }

    private _getPointOnConveyor(progress: number): [number, number, number] {
        const conveyor = findConveyorByEntityId(this._view.app.doc.entityList, this._params?.conveyorId);

        if (!conveyor) {
            return [0, 0, 0];
        }

        const [sx, sy, sz] = conveyor.startPoint;
        const [ex, ey, ez] = conveyor.endPoint;

        return [
            sx + (ex - sx) * progress,
            sy + (ey - sy) * progress,
            sz + (ez - sz) * progress,
        ];
    }

    private _createResult() {
        const conveyor = findConveyorByEntityId(this._view.app.doc.entityList, this._params?.conveyorId);

        return createLogisticsSnapshot(this._view.app.doc.entityList, conveyor);
    }

    private _dispatchLogisticsSnapshot(): void {
        const snapshot = this._createResult();
        const event: LogisticsSnapshotEvent = {
            type: 'logisticsSnapshot',
            ...snapshot,
        };

        this._view.app.signalEventBus.dispatch(event);
    }
}


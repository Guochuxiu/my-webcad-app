import { CmdBase } from '@/common';
import { SimpleWorkpiece, WorkpieceState } from '../model/workpiece';
import { TempCanvas } from '../view/temp_canvas';

export type WorkpiecePosition = [number, number, number];

export interface MoveWorkpieceParams {
    workpieceId: number;
    from?: WorkpiecePosition;
    to: WorkpiecePosition;
    duration: number;
}

export interface WorkpieceMoveProgressEvent {
    type: 'workpieceMoveProgress';
    workpieceId: number;
    state: WorkpieceState;
    remaining: number;
    position: WorkpiecePosition;
}

export class MoveWorkpieceCommand extends CmdBase<MoveWorkpieceParams, TempCanvas> {
    private _frameId: number | null = null;
    private _workpiece: SimpleWorkpiece | null = null;
    private _resolveAnimation: (() => void) | null = null;
    private _completed = false;

    public async commit(): Promise<void> {
        const params = this._params;

        if (params?.workpieceId === undefined || !params.to || params.duration <= 0) {
            this.cancel();

            return;
        }

        const entity = this._view.app.doc.getEntity(params.workpieceId);

        if (!(entity instanceof SimpleWorkpiece) || entity.state !== 'waiting') {
            this.cancel();

            return;
        }

        const from = params.from ?? entity.getPositionTuple();

        this._workpiece = entity;

        await new Promise<void>(resolve => {
            this._resolveAnimation = resolve;
            this._startAnimation(entity, from, params.to, params.duration);
        });
    }

    public onCleanup(): void {
        this._cancelAnimationFrame();

        if (!this._completed && this._workpiece?.state === 'moving') {
            this._workpiece.setState('waiting');
            this._workpiece.setRemaining(0);
            this._view.dirty();
            this._dispatchProgress(this._workpiece);
        }

        this._resolvePendingAnimation();
        this._workpiece = null;

        super.onCleanup();
    }

    private _startAnimation(
        workpiece: SimpleWorkpiece,
        from: WorkpiecePosition,
        to: WorkpiecePosition,
        duration: number
    ): void {
        const startedAt = performance.now();
        const durationMs = duration * 1000;

        workpiece.moveToPosition(from);
        workpiece.setState('moving');
        workpiece.setRemaining(duration);
        this._view.dirty();
        this._dispatchProgress(workpiece);

        const tick = (now: number) => {
            const progress = Math.min(1, (now - startedAt) / durationMs);
            const current = this._interpolatePosition(from, to, progress);

            workpiece.moveToPosition(current);
            workpiece.setRemaining((1 - progress) * duration);
            this._view.dirty();
            this._dispatchProgress(workpiece);

            if (progress < 1) {
                this._frameId = requestAnimationFrame(tick);

                return;
            }

            this._completeMove(workpiece, to);
        };

        this._frameId = requestAnimationFrame(tick);
    }

    private _completeMove(workpiece: SimpleWorkpiece, to: WorkpiecePosition): void {
        this._frameId = null;
        this._completed = true;

        workpiece.moveToPosition(to);
        workpiece.setRemaining(0);
        workpiece.setState('arrived');
        this._view.dirty();
        this._dispatchProgress(workpiece);

        const resolve = this._resolveAnimation;
        this._resolveAnimation = null;

        super.commit({
            workpieceId: workpiece.id,
            state: workpiece.state,
            remaining: workpiece.remaining
        });
        this._view.select([workpiece.id]);
        resolve?.();
    }

    private _interpolatePosition(from: WorkpiecePosition, to: WorkpiecePosition, progress: number): WorkpiecePosition {
        return [
            from[0] + (to[0] - from[0]) * progress,
            from[1] + (to[1] - from[1]) * progress,
            from[2] + (to[2] - from[2]) * progress
        ];
    }

    private _cancelAnimationFrame(): void {
        if (this._frameId === null) return;

        cancelAnimationFrame(this._frameId);
        this._frameId = null;
    }

    private _resolvePendingAnimation(): void {
        const resolve = this._resolveAnimation;

        this._resolveAnimation = null;
        resolve?.();
    }

    private _dispatchProgress(workpiece: SimpleWorkpiece): void {
        const event: WorkpieceMoveProgressEvent = {
            type: 'workpieceMoveProgress',
            workpieceId: workpiece.id,
            state: workpiece.state,
            remaining: workpiece.remaining,
            position: workpiece.getPositionTuple()
        };

        this._view.app.signalEventBus.dispatch(event);
    }
}

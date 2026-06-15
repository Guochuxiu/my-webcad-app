import { beforeAll, describe, expect, it, vi } from 'vitest';
import { SELECTION_TYPE } from '@/common/constants/canvas_constants';

let Base3DObserver: any;

vi.mock('@fs/cadnginx', () => ({
    FSApp: {
        Hotkey: {},
        Event: {}
    },
    FSMath: {},
    View: {
        Cad3DCanvasObserver: class {}
    }
}));

vi.mock('../base_3d_canvas', () => ({
    Base3DCanvas: class {}
}));

beforeAll(async () => {
    ({ Base3DObserver } = await import('./base_3d_observer'));
});

describe('Base3DObserver', () => {
    it('uses selectionType when forwarding point-cloud box selection mode', async () => {
        const pickArea = vi.fn().mockResolvedValue({
            selectIdsSet: new Set<number>(),
            unSelectSet: new Set<number>()
        });
        const select = vi.fn();
        const observer: any = Object.create(Base3DObserver.prototype);

        observer._view = {
            selectionType: SELECTION_TYPE.SUBTRACT,
            pickHelper: { pickArea },
            select
        };
        observer._isLButtonDown = true;
        observer._getSelectedIds = vi.fn().mockReturnValue([]);
        observer.selectionBox = {
            active: true,
            box: { clone: vi.fn().mockReturnValue('selection-box') },
            screenStartPoint: { x: 0 },
            screenEndPoint: { x: 100 },
            setActive: vi.fn()
        };

        observer._onLButtonUp({} as any, undefined);
        await Promise.resolve();

        expect(pickArea).toHaveBeenCalledWith('selection-box', true, SELECTION_TYPE.SUBTRACT);
        expect(select).toHaveBeenCalledWith([]);
    });

    it('removes traversed ids in subtract mode', () => {
        const observer: any = Object.create(Base3DObserver.prototype);

        observer._view = {
            selectionType: SELECTION_TYPE.SUBTRACT,
            app: {
                selection: {
                    selectedIds: [1, 2, 3, 4]
                }
            },
            displayMap: new Map([
                [2, {
                    traverse: (fn: (item: { entityId: number }) => void) => {
                        [{ entityId: 2 }, { entityId: 3 }].forEach(fn);
                    }
                }]
            ]),
            pickOptions: {
                clearSelectionOnEmptyClick: true
            }
        };

        const selectedIds = observer._getSelectedIds({
            selectIdsSet: new Set([2]),
            unSelectSet: new Set<number>()
        });

        expect(selectedIds).toEqual([1, 4]);
    });
});

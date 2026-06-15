import { FSApp, FSMath } from '@fs/cadnginx';
import { PickStrategy } from './pick_strategy';
import { Base3DCanvas } from '../base_3d_canvas';
import * as THREE from 'three';
import { SELECTION_MODE } from '@/common/constants/canvas_constants';

interface IPickStrategy {
    displayCls: new (...args: any[]) => FSApp.View.Three.ThreeDisplay,
    priority: number,
    strategy?: new (...args: any[]) => PickStrategy,
}
export class PickHelper {
    protected _currentMode: SELECTION_MODE[] = [];
    protected _cacheMode: SELECTION_MODE[] = [];
    constructor(private view: Base3DCanvas) {
    }

    /**拾取策略 */
    protected _strategiesMap = new Map<SELECTION_MODE, IPickStrategy>();

    /**注册拾取策略
     * @param mode 拾取模式
     * @param displayCls 拾取display类
     * @param priority 拾取优先级
     * @param strategy 拾取策略类,默认PickStrategy
     */
    public registerStrategy(
        mode: SELECTION_MODE,
        displayCls: new (...args: any[]) => FSApp.View.Three.ThreeDisplay,
        priority: number,
        strategy = PickStrategy
    ) {
        this._strategiesMap.set(mode, { strategy, displayCls, priority });
    }

    public strategies: PickStrategy[] = [];

    public use(mode: SELECTION_MODE[]) {
        this.strategies.length = 0;
        // 选择策略去重
        mode = Array.from(new Set(mode));
        this._currentMode = mode;

        for (const m of mode) {
            const strategy = this._strategiesMap.get(m);

            if (!strategy) {
                throw new Error(`No pick strategy found for mode: ${m}`);
            }

            this.strategies.push(new strategy.strategy(strategy.priority, strategy.displayCls));
        }
        this.strategies.sort((a, b) => b.priority - a.priority);
    }

    /**
     * 点选拾取入口,根据当前选择策略,返回拾取结果
     * @param pos 鼠标位置
     * @returns 选中的对象
     */
    public pick(pos: FSMath.Vector2) {
        // 获取所有拾取结果
        const pickResult = this.view.pickObjects(pos);
        // 按优先级拾取,高优先级拾取到不再继续拾取
        // const selectedIds = this.strategies.reduce((ids, strategy) => {
        //     if(ids.length > 0) {
        //         return ids;
        //     }
            
        //     return ids.concat(strategy.pick(pickResult));
        // }, [] as number[]);

        return pickResult.map(item => typeof item === 'number' ? item : item.id);
    }

    /**
     * 框选拾取入口,根据当前选择策略,返回拾取结果
     * @param box2 框选区域
     * @param isLeftToRight 是否从左往右框选
     * @param selectMode 框选模式 0 默认 1 新增 2 删除
     * @returns 选中的对象
     */
    public async pickArea(box2: FSMath.Box2, isLeftToRight: boolean, selectMode: number) {
        const pickResult = this.view.pickAreaByBox(box2, isLeftToRight);
        const pointCloudResult = await this.view.pickPointCloudArea(box2, selectMode);
        const threeBox = new THREE.Box2(new THREE.Vector2().fromArray(box2.min.toArray2()), new THREE.Vector2().fromArray(box2.max.toArray2()));
        const selectedIds = await Promise.all(this.strategies.map(strategy => {
            return strategy.pickArea(pickResult, isLeftToRight, threeBox);
        }));

        const selectIdsSet = new Set(selectedIds.flat());
        const { selectSet, unSelectSet } = pointCloudResult;
        selectSet.forEach(id=>selectIdsSet.add(id));

        return { selectIdsSet, unSelectSet };
    }

    /**
     * 缓存当前选择模式
     */
    public saveCurMode() {
        this._cacheMode = [...this._currentMode];
    }

    /**
     * 恢复缓存的选择模式
     */
    public restoreCurMode() {
        this._currentMode = [...this._cacheMode];
        this.use(this._currentMode);
    }
}

export type IPickStrategyOptions = {
    /** 是否允许 Ctrl/Shift 进入加选 */
    ctrlKeyEnable?: boolean,
    /** 是否允许框选 */
    boxSelectEnable?: boolean,
    /** 点击空白处清空选中 */
    clearSelectionOnEmptyClick?: boolean
}


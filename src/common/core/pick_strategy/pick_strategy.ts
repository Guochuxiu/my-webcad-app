import { FSApp } from '@fs/cadnginx';
import * as THREE from 'three';

export enum PickPriority {
    /** 点 */
    Point = 10,
    /** 线 */
    Line = 9,
    /** 面 */
    Face = 8,
    /** 体 */
    Body = 7,
    Default = 0
}

export class PickStrategy {
    /** 优先级 */
    protected _priority: PickPriority = PickPriority.Default;
    protected _DisplayCtor: new (...args: any[]) => FSApp.View.Three.ThreeDisplay;

    constructor(priority:number, displayCls: new (...args: any[]) => FSApp.View.Three.ThreeDisplay) {
        this._DisplayCtor = displayCls;
        this._priority = priority;
    }

    public get priority() {
        return this._priority;
    }

    public pick(pickResults: (number|FSApp.View.Canvas.IPickResult)[]): number[] {
        
        if (!pickResults.length) {  
            return [];
        }
            
        const pickResult = pickResults.filter(
            item => typeof item !== 'number' &&
                    item.display &&
                    item.display instanceof this._DisplayCtor
        )[0] as FSApp.View.Canvas.IPickResult;
    
        return pickResult ? [pickResult.id] : [];
    }

    /**
     * 框选拾取策略,根据当前选择策略,返回拾取结果
     * @param pickResults 框选区域内的拾取结果
     * @param isLeftToRight 是否从左往右框选
     * @returns 选中的对象
     */
    public pickArea(pickResults: FSApp.View.Canvas.IPickResult[], isLeftToRight: boolean, threeBox:THREE.Box2): number[] {
        if (!pickResults.length) {  
            return [];
        }
        const displays = [];
        pickResults.forEach(({ display }) => {
            
            if (display instanceof this._DisplayCtor) {
                if (isLeftToRight) {
                    threeBox.containsBox(display.screenBox) && displays.push(display);
                } else {
                    threeBox.intersectsBox(display.screenBox) && displays.push(display);
                }
            }
        });

        return displays.map(item => item.entityId);
    }
}

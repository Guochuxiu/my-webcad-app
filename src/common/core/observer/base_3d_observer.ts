import { FSApp, FSMath, View } from '@fs/cadnginx';
import { Base3DCanvas } from '../base_3d_canvas';
import { SELECTION_TYPE } from '@/common/constants/canvas_constants';

export class Base3DObserver<T extends Base3DCanvas = Base3DCanvas> extends View.Cad3DCanvasObserver<T> {
    public processKeyboardEvent(hotkey: FSApp.Hotkey.IHotkey): boolean {
        if (hotkey.key === 'ctrl' || hotkey.key === 'shift') {
            if (!this._view.pickOptions.ctrlKeyEnable || this._view.app.cmdManager.current) {
                return false;
            }

            this._view.setSelectionType(
                hotkey.type === 'keydown' ? SELECTION_TYPE.MULTIPLE : this._view.originSelectionType
            );

            return true;
        }

        if (hotkey.key === 'alt') {
            if (this._view.app.cmdManager.current) {
                return false;
            }

            this._view.setSelectionType(
                hotkey.type === 'keydown' ? SELECTION_TYPE.SUBTRACT : this._view.originSelectionType
            );

            return true;
        }

        return false;
    }

    protected _onLButtonDown(pos: FSMath.Vector2, fnKey?: FSApp.Event.FnKey): boolean {
        super._onLButtonDown(pos, fnKey);

        /** 是否允许框选 */
        if (!this._view.pickOptions.boxSelectEnable) {
            this._isLButtonDown = false;
        }

        return false;
    }

    protected _onMove(pos: FSMath.Vector2, fnKey?:FSApp.Event.FnKey): boolean {
        if (this._isLButtonDown) {
            // 鼠标左键按下移动时，不进行hover处理，只更新框选框范围
            this.setPointHoverIndicatorVisible(false);
            this.setPointSelectIndicatorVisible(false);
            this.selectionBox.screenEndPoint = pos.clone();

            if (this.selectionBox.active) {
                this.selectionBox.updateSelectionRect();
            } else {
                const distance = this.selectionBox.screenStartPoint.distanceTo(this.selectionBox.screenEndPoint);
                this.selectionBox.updateSelectionRect();
                this.selectionBox.setActive(distance > this.selectionBox.activeLength);
            }
        } else {
            const ids = this._view.pickHelper.pick(pos);
            this._view.hover(ids);
        }
        
        return false;
    }

    protected override _onLButtonUp(pos: FSMath.Vector2, fnKey): boolean {
        this._isLButtonDown = false;
    
        // 更新框选框状态
        if (this.selectionBox.active) {
            // 从左往右框
            const isLeftToRight = this.selectionBox.screenStartPoint.x < this.selectionBox.screenEndPoint.x;
            this._view.pickHelper.pickArea(this.selectionBox.box.clone(), isLeftToRight, this._view.selectionType).then(ids => {
                this._view.select(this._getSelectedIds(ids));
                this.selectionBox.setActive(false);
            });
        } else {
            const ids = this._view.pickHelper.pick(pos);
            this._view.select(this._getSelectedIds({ selectIdsSet: new Set(ids), unSelectSet: new Set() }));
        }
    
        return false;
    }

    protected _onClick(pos: FSMath.Vector2, fnKey: FSApp.Event.FnKey): boolean {
    
        return false;
    }

    protected _getSelectedIds(ids:{selectIdsSet:Set<number>, unSelectSet:Set<number>}) {    
        const { selectIdsSet, unSelectSet } = ids;
        const selectedIds = this._view.app.selection.selectedIds;
    
        if (this._view.selectionType !== SELECTION_TYPE.SINGLE) {
            const childIds: number[] = [];
            const delIds: number[] = [];
            selectIdsSet.forEach(id => {
                const display = this._view.displayMap.get(id);

                if (!display) {
                    childIds.push(id);
                    delIds.push(id);

                    return;
                }

                display.traverse(item => {
                    childIds.push(item.entityId);
                    delIds.push(item.entityId);
                });
            });

            const idSet = new Set(selectedIds);

            if (this._view.selectionType === SELECTION_TYPE.MULTIPLE) {
                childIds.forEach(id => idSet.add(id));
            } else {
                delIds.forEach(id => idSet.delete(id));
            }

            unSelectSet.forEach(id=>idSet.delete(id));
    
            return Array.from(idSet);
                
        } else {
    
            /** 点击空白处是否清空选中 */
            if (!selectIdsSet?.size && !this._view.pickOptions.clearSelectionOnEmptyClick) {
                return selectedIds;
            }
                
            return Array.from(selectIdsSet);
        }
    }
}

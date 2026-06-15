// 信号接口
export interface ISignal<T> {
  listen(callback: (event: T) => void): () => void;  // 返回取消订阅函数
  listenOnce(callback: (event: T) => boolean | Promise<boolean>): void;
}

export interface ISelectionChangeEvent {
  selectedIds: number[];
  addedIds: number[];
  removedIds: number[];
}

export interface ICommandStateChangeEvent {
  cmdType: string | symbol;
  state: 'started' | 'event' | 'completed' | 'cancelled';
  data: any;
}

// 统一变更事件
export type IUnifiedChangeEvent = {
  type: 'selection';
  payload: ISelectionChangeEvent;
  timestamp: number;
} | {
  type: 'command';
  payload: ICommandStateChangeEvent;
  timestamp: number;
}

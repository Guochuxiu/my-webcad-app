import { BaseViewHandle } from '@/common';
import { TempCanvas } from './temp_canvas';
import type { ImportModelParams } from '../command/cmd_import_model';
import { CMD_TYPES } from '../command/cmd_types';

export class TempViewHandle extends BaseViewHandle<TempCanvas> {
    public importModels(params: ImportModelParams): Promise<void> {
        return this.executeCommand(CMD_TYPES.IMPORT_MODEL, params);
    }
}


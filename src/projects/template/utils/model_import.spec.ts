import { describe, expect, it } from 'vitest';
import {
    TEMPLATE_MODEL_IMPORT_ACCEPT,
    dedupeImportFiles,
    isSesFile
} from './model_import';

describe('model import utils', () => {
    it('builds the accept list for supported model formats', () => {
        expect(TEMPLATE_MODEL_IMPORT_ACCEPT).toContain('.glb');
        expect(TEMPLATE_MODEL_IMPORT_ACCEPT).toContain('.step');
        expect(TEMPLATE_MODEL_IMPORT_ACCEPT).toContain('.zip');
    });

    it('dedupes repeated files by stable file identity', () => {
        const firstFile = new File(['mesh'], 'demo.glb', { lastModified: 1 });
        const secondFile = new File(['mesh'], 'demo.glb', { lastModified: 1 });
        const thirdFile = new File(['other'], 'demo.obj', { lastModified: 2 });

        const files = dedupeImportFiles([firstFile, secondFile, thirdFile]);

        expect(files).toHaveLength(2);
        expect(files[0].name).toBe('demo.glb');
        expect(files[1].name).toBe('demo.obj');
    });

    it('detects ses model files case-insensitively', () => {
        expect(isSesFile(new File(['mesh'], 'scene.SES'))).toBe(true);
        expect(isSesFile(new File(['mesh'], 'scene.glb'))).toBe(false);
    });
});

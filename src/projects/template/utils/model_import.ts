export const TEMPLATE_MODEL_IMPORT_EXTENSIONS = [
    'glb',
    'gltf',
    'obj',
    'stl',
    'step',
    'stp',
    'brep',
    'ses',
    'zip'
] as const;

export const TEMPLATE_MODEL_IMPORT_ACCEPT = TEMPLATE_MODEL_IMPORT_EXTENSIONS
    .map(extension => `.${extension}`)
    .join(',');

export function dedupeImportFiles(files: File[]): File[] {
    const fileMap = new Map<string, File>();

    files.forEach(file => {
        const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
        fileMap.set(fileKey, file);
    });

    return Array.from(fileMap.values());
}

export function isSesFile(file: File): boolean {
    return getFileExtension(file.name) === 'ses';
}

function getFileExtension(fileName: string): string {
    const extension = fileName.split('.').pop();

    return extension ? extension.toLowerCase() : '';
}

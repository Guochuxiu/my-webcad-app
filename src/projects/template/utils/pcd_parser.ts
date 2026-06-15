/**
 * PCD (Point Cloud Data) 文件解析器
 * 支持 ASCII、Binary、Binary Compressed (LZF) 三种格式
 */

export interface PCDResult {
    positions: Float32Array;
    colors?: Uint8Array;
}

interface PCDHeader {
    version: string;
    fields: string[];
    size: number[];
    type: string[];
    count: number[];
    width: number;
    height: number;
    viewpoint: number[];
    points: number;
    data: 'ascii' | 'binary' | 'binary_compressed';
}

export function parsePCD(data: ArrayBuffer | string): PCDResult {
    if (typeof data === 'string') {
        return parseASCII(data);
    }

    const textDecoder = new TextDecoder();
    const headerStr = readHeaderString(data);
    const header = parseHeader(headerStr);

    switch (header.data) {
        case 'ascii':
            return parseASCII(textDecoder.decode(data));
        case 'binary':
            return parseBinary(data, header);
        case 'binary_compressed':
            return parseBinaryCompressed(data, header);
        default:
            throw new Error(`不支持的 PCD 数据格式: ${header.data}`);
    }
}

function readHeaderString(data: ArrayBuffer): string {
    const bytes = new Uint8Array(data);
    let end = 0;

    for (let i = 0; i < bytes.length - 1; i++) {
        if (bytes[i] === 0x0A && bytes[i + 1] === 0x0A) {
            end = i + 1;
            break;
        }
    }

    if (end === 0) {
        for (let i = 0; i < bytes.length; i++) {
            if (bytes[i] === 0x0A) {
                const nextLine = readLine(bytes, i + 1);
                if (nextLine.startsWith('DATA')) {
                    end = i;
                    break;
                }
            }
        }
    }

    const textDecoder = new TextDecoder();
    return textDecoder.decode(bytes.slice(0, end));
}

function readLine(bytes: Uint8Array, offset: number): string {
    const textDecoder = new TextDecoder();
    let end = offset;

    for (let i = offset; i < bytes.length; i++) {
        if (bytes[i] === 0x0A || bytes[i] === 0x0D) {
            end = i;
            break;
        }
    }

    return textDecoder.decode(bytes.slice(offset, end));
}

function parseHeader(headerStr: string): PCDHeader {
    const lines = headerStr.split('\n').map(l => l.trim()).filter(Boolean);
    const header: Partial<PCDHeader> = {};

    for (const line of lines) {
        const [key, ...rest] = line.split(' ');
        const value = rest.join(' ').trim();

        switch (key) {
            case 'VERSION':
                header.version = value;
                break;
            case 'FIELDS':
                header.fields = value.split(' ');
                break;
            case 'SIZE':
                header.size = value.split(' ').map(Number);
                break;
            case 'TYPE':
                header.type = value.split(' ');
                break;
            case 'COUNT':
                header.count = value.split(' ').map(Number);
                break;
            case 'WIDTH':
                header.width = Number(value);
                break;
            case 'HEIGHT':
                header.height = Number(value);
                break;
            case 'VIEWPOINT':
                header.viewpoint = value.split(' ').map(Number);
                break;
            case 'POINTS':
                header.points = Number(value);
                break;
            case 'DATA':
                header.data = value as PCDHeader['data'];
                break;
        }
    }

    if (!header.fields || !header.points || !header.data) {
        throw new Error('PCD 文件头缺少必要字段');
    }

    return header as PCDHeader;
}

function findDataOffset(data: ArrayBuffer): number {
    const bytes = new Uint8Array(data);
    const textDecoder = new TextDecoder();
    let lineStart = 0;

    for (let i = 0; i < bytes.length; i++) {
        if (bytes[i] === 0x0A || bytes[i] === 0x0D) {
            const line = textDecoder.decode(bytes.slice(lineStart, i)).trim();

            if (line.startsWith('DATA')) {
                while (i < bytes.length && (bytes[i] === 0x0A || bytes[i] === 0x0D)) {
                    i++;
                }

                return i;
            }

            while (i < bytes.length && (bytes[i] === 0x0A || bytes[i] === 0x0D)) {
                i++;
            }

            lineStart = i;
        }
    }

    throw new Error('无法找到 PCD 数据段的起始位置');
}

function parseASCII(content: string): PCDResult {
    const lines = content.split('\n').map(l => l.trim());
    let dataStart = 0;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('DATA')) {
            dataStart = i + 1;
            break;
        }
    }

    const headerLines = lines.slice(0, dataStart);
    const headerStr = headerLines.join('\n');
    const header = parseHeader(headerStr);

    const { fields, type, count, points } = header;
    const fieldIndices = getFieldIndices(fields, type, count);

    const positions = new Float32Array(points * 3);
    const hasColor = fieldIndices.r !== undefined;
    const colors = hasColor ? new Uint8Array(points * 3) : undefined;

    let pointIdx = 0;

    for (let i = dataStart; i < lines.length && pointIdx < points; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(' ').map(Number);

        positions[pointIdx * 3] = values[fieldIndices.x] ?? 0;
        positions[pointIdx * 3 + 1] = values[fieldIndices.y] ?? 0;
        positions[pointIdx * 3 + 2] = values[fieldIndices.z] ?? 0;

        if (hasColor) {
            const rType = type[fieldIndices.rFieldIdx];
            const rSize = header.size[fieldIndices.rFieldIdx];

            if (rType === 'U' && rSize === 4) {
                const packed = values[fieldIndices.r] >>> 0;
                colors[pointIdx * 3] = (packed >> 16) & 0xFF;
                colors[pointIdx * 3 + 1] = (packed >> 8) & 0xFF;
                colors[pointIdx * 3 + 2] = packed & 0xFF;
            } else {
                colors[pointIdx * 3] = Math.round(values[fieldIndices.r] ?? 0);
                colors[pointIdx * 3 + 1] = Math.round(values[fieldIndices.g] ?? 0);
                colors[pointIdx * 3 + 2] = Math.round(values[fieldIndices.b] ?? 0);
            }
        }

        pointIdx++;
    }

    return { positions: positions.slice(0, pointIdx * 3), colors: colors?.slice(0, pointIdx * 3) };
}

function parseBinary(data: ArrayBuffer, header: PCDHeader): PCDResult {
    const { fields, size, type, count, points } = header;
    const dataOffset = findDataOffset(data);
    const view = new DataView(data, dataOffset);

    const fieldIndices = getFieldIndices(fields, type, count);
    const recordSize = size.reduce((sum, s, i) => sum + s * count[i], 0);

    const positions = new Float32Array(points * 3);
    const hasColor = fieldIndices.r !== undefined;
    const colors = hasColor ? new Uint8Array(points * 3) : undefined;

    const fieldOffsets = computeFieldOffsets(fields, size, count);

    for (let i = 0; i < points; i++) {
        const recordOffset = i * recordSize;

        positions[i * 3] = readFieldValue(view, recordOffset + fieldOffsets.x, size[fieldIndices.xFieldIdx], type[fieldIndices.xFieldIdx]);
        positions[i * 3 + 1] = readFieldValue(view, recordOffset + fieldOffsets.y, size[fieldIndices.yFieldIdx], type[fieldIndices.yFieldIdx]);
        positions[i * 3 + 2] = readFieldValue(view, recordOffset + fieldOffsets.z, size[fieldIndices.zFieldIdx], type[fieldIndices.zFieldIdx]);

        if (hasColor) {
            const rType = type[fieldIndices.rFieldIdx];
            const rSize = size[fieldIndices.rFieldIdx];

            if (rType === 'U' && rSize === 4) {
                const packed = view.getUint32(recordOffset + fieldOffsets.r, true);
                colors[i * 3] = (packed >> 16) & 0xFF;
                colors[i * 3 + 1] = (packed >> 8) & 0xFF;
                colors[i * 3 + 2] = packed & 0xFF;
            } else {
                colors[i * 3] = readUByteValue(view, recordOffset + fieldOffsets.r, rSize, rType);
                colors[i * 3 + 1] = readUByteValue(view, recordOffset + fieldOffsets.g, rSize, rType);
                colors[i * 3 + 2] = readUByteValue(view, recordOffset + fieldOffsets.b, rSize, rType);
            }
        }
    }

    return { positions, colors };
}

function parseBinaryCompressed(data: ArrayBuffer, header: PCDHeader): PCDResult {
    const { fields, size, type, count, points } = header;
    const dataOffset = findDataOffset(data);
    const view = new DataView(data, dataOffset);

    const fieldIndices = getFieldIndices(fields, type, count);

    let offset = 0;
    const compressedSizes: number[] = [];

    for (let i = 0; i < fields.length; i++) {
        compressedSizes.push(view.getUint32(offset, true));
        offset += 4;
    }

    const rawSizes: number[] = [];

    for (let i = 0; i < fields.length; i++) {
        rawSizes.push(view.getUint32(offset, true));
        offset += 4;
    }

    const fieldBuffers: Uint8Array[] = [];

    for (let i = 0; i < fields.length; i++) {
        const compressed = new Uint8Array(data, dataOffset + offset, compressedSizes[i]);
        const decompressed = lzfDecompress(compressed, rawSizes[i]);
        fieldBuffers.push(decompressed);
        offset += compressedSizes[i];
    }

    const positions = new Float32Array(points * 3);
    const hasColor = fieldIndices.r !== undefined;
    const colors = hasColor ? new Uint8Array(points * 3) : undefined;

    const xBuf = new DataView(fieldBuffers[fieldIndices.xFieldIdx].buffer, fieldBuffers[fieldIndices.xFieldIdx].byteOffset, fieldBuffers[fieldIndices.xFieldIdx].byteLength);
    const yBuf = new DataView(fieldBuffers[fieldIndices.yFieldIdx].buffer, fieldBuffers[fieldIndices.yFieldIdx].byteOffset, fieldBuffers[fieldIndices.yFieldIdx].byteLength);
    const zBuf = new DataView(fieldBuffers[fieldIndices.zFieldIdx].buffer, fieldBuffers[fieldIndices.zFieldIdx].byteOffset, fieldBuffers[fieldIndices.zFieldIdx].byteLength);

    const xSize = size[fieldIndices.xFieldIdx];
    const xType = type[fieldIndices.xFieldIdx];
    const ySize = size[fieldIndices.yFieldIdx];
    const yType = type[fieldIndices.yFieldIdx];
    const zSize = size[fieldIndices.zFieldIdx];
    const zType = type[fieldIndices.zFieldIdx];

    for (let i = 0; i < points; i++) {
        positions[i * 3] = readFieldValue(xBuf, i * xSize, xSize, xType);
        positions[i * 3 + 1] = readFieldValue(yBuf, i * ySize, ySize, yType);
        positions[i * 3 + 2] = readFieldValue(zBuf, i * zSize, zSize, zType);
    }

    if (hasColor) {
        const rBuf = fieldBuffers[fieldIndices.rFieldIdx];
        const rType = type[fieldIndices.rFieldIdx];
        const rSize = size[fieldIndices.rFieldIdx];

        if (rType === 'U' && rSize === 4) {
            const rView = new DataView(rBuf.buffer, rBuf.byteOffset, rBuf.byteLength);

            for (let i = 0; i < points; i++) {
                const packed = rView.getUint32(i * 4, true);
                colors[i * 3] = (packed >> 16) & 0xFF;
                colors[i * 3 + 1] = (packed >> 8) & 0xFF;
                colors[i * 3 + 2] = packed & 0xFF;
            }
        } else {
            for (let i = 0; i < points; i++) {
                colors[i * 3] = rBuf[i * 3] ?? 0;
                colors[i * 3 + 1] = rBuf[i * 3 + 1] ?? 0;
                colors[i * 3 + 2] = rBuf[i * 3 + 2] ?? 0;
            }
        }
    }

    return { positions, colors };
}

interface FieldIndices {
    x: number;
    y: number;
    z: number;
    r?: number;
    g?: number;
    b?: number;
    xFieldIdx: number;
    yFieldIdx: number;
    zFieldIdx: number;
    rFieldIdx?: number;
    gFieldIdx?: number;
    bFieldIdx?: number;
}

function getFieldIndices(fields: string[], types: string[], counts: number[]): FieldIndices {
    const result: Partial<FieldIndices> = {};

    fields.forEach((field, idx) => {
        switch (field) {
            case 'x':
                result.x = idx;
                result.xFieldIdx = idx;
                break;
            case 'y':
                result.y = idx;
                result.yFieldIdx = idx;
                break;
            case 'z':
                result.z = idx;
                result.zFieldIdx = idx;
                break;
            case 'r':
            case 'red':
                result.r = idx;
                result.rFieldIdx = idx;
                break;
            case 'g':
            case 'green':
                result.g = idx;
                result.gFieldIdx = idx;
                break;
            case 'b':
            case 'blue':
                result.b = idx;
                result.bFieldIdx = idx;
                break;
            case 'rgb':
                result.r = idx;
                result.rFieldIdx = idx;
                result.g = idx;
                result.gFieldIdx = idx;
                result.b = idx;
                result.bFieldIdx = idx;
                break;
        }
    });

    return result as FieldIndices;
}

function computeFieldOffsets(fields: string[], sizes: number[], counts: number[]): Record<string, number> {
    const offsets: Record<string, number> = {};
    let offset = 0;

    fields.forEach((field, i) => {
        offsets[field] = offset;
        offset += sizes[i] * counts[i];
    });

    return offsets;
}

function readFieldValue(view: DataView, offset: number, size: number, type: string): number {
    switch (type) {
        case 'F':
            return size === 8 ? view.getFloat64(offset, true) : view.getFloat32(offset, true);
        case 'I':
            return size === 8 ? Number(view.getBigInt64(offset, true)) : size === 2 ? view.getInt16(offset, true) : view.getInt32(offset, true);
        case 'U':
            return size === 8 ? Number(view.getBigUint64(offset, true)) : size === 2 ? view.getUint16(offset, true) : view.getUint32(offset, true);
        default:
            return view.getFloat32(offset, true);
    }
}

function readUByteValue(view: DataView, offset: number, size: number, type: string): number {
    if (size === 1) {
        return view.getUint8(offset);
    }

    return Math.min(255, Math.max(0, Math.round(readFieldValue(view, offset, size, type))));
}

function lzfDecompress(compressed: Uint8Array, expectedSize: number): Uint8Array {
    const output = new Uint8Array(expectedSize);
    let inIdx = 0;
    let outIdx = 0;

    while (inIdx < compressed.length && outIdx < expectedSize) {
        const ctrl = compressed[inIdx++];

        if (ctrl < 32) {
            const len = ctrl + 1;
            output.set(compressed.subarray(inIdx, inIdx + len), outIdx);
            inIdx += len;
            outIdx += len;
        } else {
            let len = ctrl >> 5;
            const ref = ((ctrl & 0x1F) << 8) | (compressed[inIdx++] ?? 0);

            if (len === 7) {
                len += compressed[inIdx++] ?? 0;
            }

            len += 2;
            const srcIdx = outIdx - ref - 1;

            for (let i = 0; i < len; i++) {
                output[outIdx++] = output[srcIdx + i];
            }
        }
    }

    return output;
}

export function isPCDFile(file: File): boolean {
    return file.name.toLowerCase().endsWith('.pcd');
}

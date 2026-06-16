import { FSCore } from '@fs/cadnginx';
import { SimpleWorkpiece, WorkpieceFeatureFace, WorkpieceFeatureLine, WorkpieceFeaturePoint, WorkpieceType } from './simple_workpiece';

export interface CreateSimpleWorkpieceOptions {
    type: WorkpieceType;
    center?: [number, number, number];
    size?: {
        width?: number;
        height?: number;
        depth?: number;
        radius?: number;
        segments?: number;
    };
}

interface WorkpieceGeometry {
    bodyVertex: number[];
    bodyIndex: number[];
    points: WorkpieceFeaturePoint[];
    lines: WorkpieceFeatureLine[];
    faces: WorkpieceFeatureFace[];
}

/**
 * 工件演示数据工厂。
 *
 * 这个类只负责把“立方体/圆柱体”转换成 WebCAD 可消费的实体树：
 * SimpleWorkpiece(Group) -> BatchMesh(主体) + BatchLine(特征线) + BatchPoint(特征点)。
 * Display 创建和命令触发都放在外层链路里处理。
 */
export class SimpleWorkpieceFactory {
    public static create(options: CreateSimpleWorkpieceOptions): SimpleWorkpiece {
        const localOptions = {
            ...options,
            center: [0, 0, 0] as [number, number, number]
        };
        const geometry = options.type === 'cylinder'
            ? this._buildCylinderGeometry(localOptions)
            : this._buildBoxGeometry(localOptions);

        const workpiece = new SimpleWorkpiece({
            type: options.type,
            state: 'waiting',
            location: 'warehouse_01',
            features: {
                points: geometry.points,
                lines: geometry.lines,
                faces: geometry.faces
            }
        });

        const body = new FSCore.Model.BatchMesh({
            vertex: geometry.bodyVertex,
            vertexIndex: geometry.bodyIndex,
            color: options.type === 'cylinder' ? 0x72c7b0 : 0x6ea8fe
        });

        const featureLines = new FSCore.Model.BatchLine({
            vertex: this._buildLineVertex(geometry.points, geometry.lines),
            color: 0x1f2937
        });

        const featurePoints = new FSCore.Model.BatchPoint({
            vertex: geometry.points.flatMap(point => point.position),
            color: 0xffb020
        });

        body.shouldPickParent = true;
        featureLines.shouldPickParent = true;
        featurePoints.shouldPickParent = true;

        // 子实体进入父 Group 后，WebCAD 会沿实体树递归创建对应 Display。
        workpiece.addChild([body, featureLines, featurePoints]);
        workpiece.moveToPosition(options.center ?? [0, 0, 0]);
        workpiece.dirtyGeometry();

        return workpiece;
    }

    /**
     * 立方体演示工件：
     * 8 个角点作为特征点，12 条棱作为特征线，6 个面作为特征面。
     */
    private static _buildBoxGeometry(options: CreateSimpleWorkpieceOptions): WorkpieceGeometry {
        const [cx, cy, cz] = options.center ?? [0, 0, 0];
        const width = options.size?.width ?? 120;
        const height = options.size?.height ?? 90;
        const depth = options.size?.depth ?? 70;
        const halfW = width / 2;
        const halfH = height / 2;
        const halfD = depth / 2;

        const corners: Array<[number, number, number]> = [
            [cx - halfW, cy - halfH, cz - halfD],
            [cx + halfW, cy - halfH, cz - halfD],
            [cx + halfW, cy + halfH, cz - halfD],
            [cx - halfW, cy + halfH, cz - halfD],
            [cx - halfW, cy - halfH, cz + halfD],
            [cx + halfW, cy - halfH, cz + halfD],
            [cx + halfW, cy + halfH, cz + halfD],
            [cx - halfW, cy + halfH, cz + halfD]
        ];

        const points = corners.map((position, index) => ({
            id: `P${index + 1}`,
            name: `corner_${index + 1}`,
            position
        }));

        const edgePairs = [
            [0, 1], [1, 2], [2, 3], [3, 0],
            [4, 5], [5, 6], [6, 7], [7, 4],
            [0, 4], [1, 5], [2, 6], [3, 7]
        ];

        const faces = [
            ['bottom', [0, 1, 2, 3]],
            ['top', [4, 5, 6, 7]],
            ['front', [0, 1, 5, 4]],
            ['right', [1, 2, 6, 5]],
            ['back', [2, 3, 7, 6]],
            ['left', [3, 0, 4, 7]]
        ] as const;

        return {
            bodyVertex: corners.flat(),
            bodyIndex: [
                0, 2, 1, 0, 3, 2,
                4, 5, 6, 4, 6, 7,
                0, 1, 5, 0, 5, 4,
                1, 2, 6, 1, 6, 5,
                2, 3, 7, 2, 7, 6,
                3, 0, 4, 3, 4, 7
            ],
            points,
            lines: edgePairs.map(([from, to], index) => ({
                id: `L${index + 1}`,
                name: `edge_${index + 1}`,
                from: points[from].id,
                to: points[to].id
            })),
            faces: faces.map(([name, indices], index) => ({
                id: `F${index + 1}`,
                name,
                pointIds: indices.map(pointIndex => points[pointIndex].id)
            }))
        };
    }

    /**
     * 圆柱体演示工件：
     * 顶/底圆心和圆周采样点作为特征点，圆环边、轴线和少量母线作为特征线。
     */
    private static _buildCylinderGeometry(options: CreateSimpleWorkpieceOptions): WorkpieceGeometry {
        const [cx, cy, cz] = options.center ?? [0, 0, 0];
        const radius = options.size?.radius ?? 45;
        const height = options.size?.height ?? 100;
        const segments = Math.max(12, options.size?.segments ?? 24);
        const halfH = height / 2;

        const points: WorkpieceFeaturePoint[] = [
            { id: 'P_TOP_CENTER', name: 'top_center', position: [cx, cy, cz + halfH] },
            { id: 'P_BOTTOM_CENTER', name: 'bottom_center', position: [cx, cy, cz - halfH] }
        ];

        const vertices: number[] = [
            cx, cy, cz + halfH,
            cx, cy, cz - halfH
        ];

        for (let i = 0; i < segments; i++) {
            const angle = (Math.PI * 2 * i) / segments;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            const topId = `P_TOP_${i + 1}`;
            const bottomId = `P_BOTTOM_${i + 1}`;

            points.push({ id: topId, name: `top_ring_${i + 1}`, position: [x, y, cz + halfH] });
            points.push({ id: bottomId, name: `bottom_ring_${i + 1}`, position: [x, y, cz - halfH] });
            vertices.push(x, y, cz + halfH, x, y, cz - halfH);
        }

        const indices: number[] = [];
        const lines: WorkpieceFeatureLine[] = [
            { id: 'L_AXIS', name: 'axis', from: 'P_BOTTOM_CENTER', to: 'P_TOP_CENTER' }
        ];

        for (let i = 0; i < segments; i++) {
            const next = (i + 1) % segments;
            const top = 2 + i * 2;
            const bottom = top + 1;
            const nextTop = 2 + next * 2;
            const nextBottom = nextTop + 1;

            indices.push(0, top, nextTop);
            indices.push(1, nextBottom, bottom);
            indices.push(top, bottom, nextBottom, top, nextBottom, nextTop);

            lines.push({
                id: `L_TOP_${i + 1}`,
                name: `top_ring_edge_${i + 1}`,
                from: `P_TOP_${i + 1}`,
                to: `P_TOP_${next + 1}`
            });
            lines.push({
                id: `L_BOTTOM_${i + 1}`,
                name: `bottom_ring_edge_${i + 1}`,
                from: `P_BOTTOM_${i + 1}`,
                to: `P_BOTTOM_${next + 1}`
            });

            if (i % Math.max(1, Math.floor(segments / 4)) === 0) {
                lines.push({
                    id: `L_VERTICAL_${i + 1}`,
                    name: `vertical_feature_${i + 1}`,
                    from: `P_BOTTOM_${i + 1}`,
                    to: `P_TOP_${i + 1}`
                });
            }
        }

        return {
            bodyVertex: vertices,
            bodyIndex: indices,
            points,
            lines,
            faces: [
                {
                    id: 'F_TOP',
                    name: 'top_cap',
                    pointIds: points.filter(point => point.id.startsWith('P_TOP')).map(point => point.id)
                },
                {
                    id: 'F_BOTTOM',
                    name: 'bottom_cap',
                    pointIds: points.filter(point => point.id.startsWith('P_BOTTOM')).map(point => point.id)
                },
                {
                    id: 'F_SIDE',
                    name: 'side_surface',
                    pointIds: points
                        .filter(point => point.id.startsWith('P_TOP_') || point.id.startsWith('P_BOTTOM_'))
                        .map(point => point.id)
                }
            ]
        };
    }

    /** 将“特征线的端点 id”转换为 BatchLine 需要的扁平顶点数组。 */
    private static _buildLineVertex(points: WorkpieceFeaturePoint[], lines: WorkpieceFeatureLine[]): number[] {
        const pointMap = new Map(points.map(point => [point.id, point.position]));

        return lines.flatMap(line => {
            const from = pointMap.get(line.from);
            const to = pointMap.get(line.to);

            return from && to ? [...from, ...to] : [];
        });
    }
}

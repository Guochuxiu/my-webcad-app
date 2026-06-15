import * as $protobuf from 'protobufjs';
/** Namespace cadModel3D. */
export namespace cadModel3D {

    /** Properties of a CADModels. */
    interface ICADModels {

        /** CADModels models */
        models?: (cadModel3D.ICADModel[]|null);
    }

    /** Represents a CADModels. */
    class CADModels implements ICADModels {

        /**
         * Constructs a new CADModels.
         * @param [properties] Properties to set
         */
        constructor(properties?: cadModel3D.ICADModels);

        /** CADModels models. */
        public models: cadModel3D.ICADModel[];

        /**
         * Creates a new CADModels instance using the specified properties.
         * @param [properties] Properties to set
         * @returns CADModels instance
         */
        public static create(properties?: cadModel3D.ICADModels): cadModel3D.CADModels;

        /**
         * Encodes the specified CADModels message. Does not implicitly {@link cadModel3D.CADModels.verify|verify} messages.
         * @param message CADModels message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: cadModel3D.ICADModels, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified CADModels message, length delimited. Does not implicitly {@link cadModel3D.CADModels.verify|verify} messages.
         * @param message CADModels message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: cadModel3D.ICADModels, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a CADModels message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns CADModels
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cadModel3D.CADModels;

        /**
         * Decodes a CADModels message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns CADModels
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cadModel3D.CADModels;

        /**
         * Verifies a CADModels message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a CADModels message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns CADModels
         */
        public static fromObject(object: { [k: string]: any }): cadModel3D.CADModels;

        /**
         * Creates a plain object from a CADModels message. Also converts values to other types if specified.
         * @param message CADModels
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: cadModel3D.CADModels, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this CADModels to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a CADModel. */
    interface ICADModel {

        /** CADModel id */
        id?: (number|null);

        /** CADModel vertices */
        vertices?: (cadModel3D.IVertex[]|null);

        /** CADModel edges */
        edges?: (cadModel3D.IEdge[]|null);

        /** CADModel faces */
        faces?: (cadModel3D.IFace[]|null);

        /** CADModel bodies */
        bodies?: (cadModel3D.IBody[]|null);
    }

    /** Represents a CADModel. */
    class CADModel implements ICADModel {

        /**
         * Constructs a new CADModel.
         * @param [properties] Properties to set
         */
        constructor(properties?: cadModel3D.ICADModel);

        /** CADModel id. */
        public id: number;

        /** CADModel vertices. */
        public vertices: cadModel3D.IVertex[];

        /** CADModel edges. */
        public edges: cadModel3D.IEdge[];

        /** CADModel faces. */
        public faces: cadModel3D.IFace[];

        /** CADModel bodies. */
        public bodies: cadModel3D.IBody[];

        /**
         * Creates a new CADModel instance using the specified properties.
         * @param [properties] Properties to set
         * @returns CADModel instance
         */
        public static create(properties?: cadModel3D.ICADModel): cadModel3D.CADModel;

        /**
         * Encodes the specified CADModel message. Does not implicitly {@link cadModel3D.CADModel.verify|verify} messages.
         * @param message CADModel message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: cadModel3D.ICADModel, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified CADModel message, length delimited. Does not implicitly {@link cadModel3D.CADModel.verify|verify} messages.
         * @param message CADModel message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: cadModel3D.ICADModel, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a CADModel message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns CADModel
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cadModel3D.CADModel;

        /**
         * Decodes a CADModel message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns CADModel
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cadModel3D.CADModel;

        /**
         * Verifies a CADModel message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a CADModel message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns CADModel
         */
        public static fromObject(object: { [k: string]: any }): cadModel3D.CADModel;

        /**
         * Creates a plain object from a CADModel message. Also converts values to other types if specified.
         * @param message CADModel
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: cadModel3D.CADModel, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this CADModel to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a Vertex. */
    interface IVertex {

        /** Vertex id */
        id?: (number|null);

        /** Vertex point */
        point?: (number[]|null);

        /** Vertex color */
        color?: (number|null);
    }

    /** Represents a Vertex. */
    class Vertex implements IVertex {

        /**
         * Constructs a new Vertex.
         * @param [properties] Properties to set
         */
        constructor(properties?: cadModel3D.IVertex);

        /** Vertex id. */
        public id: number;

        /** Vertex point. */
        public point: number[];

        /** Vertex color. */
        public color: number;

        /**
         * Creates a new Vertex instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Vertex instance
         */
        public static create(properties?: cadModel3D.IVertex): cadModel3D.Vertex;

        /**
         * Encodes the specified Vertex message. Does not implicitly {@link cadModel3D.Vertex.verify|verify} messages.
         * @param message Vertex message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: cadModel3D.IVertex, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Vertex message, length delimited. Does not implicitly {@link cadModel3D.Vertex.verify|verify} messages.
         * @param message Vertex message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: cadModel3D.IVertex, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Vertex message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Vertex
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cadModel3D.Vertex;

        /**
         * Decodes a Vertex message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Vertex
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cadModel3D.Vertex;

        /**
         * Verifies a Vertex message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Vertex message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Vertex
         */
        public static fromObject(object: { [k: string]: any }): cadModel3D.Vertex;

        /**
         * Creates a plain object from a Vertex message. Also converts values to other types if specified.
         * @param message Vertex
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: cadModel3D.Vertex, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Vertex to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an Edge. */
    interface IEdge {

        /** Edge id */
        id?: (number|null);

        /** Edge points */
        points?: (number[]|null);

        /** Edge color */
        color?: (number|null);
    }

    /** Represents an Edge. */
    class Edge implements IEdge {

        /**
         * Constructs a new Edge.
         * @param [properties] Properties to set
         */
        constructor(properties?: cadModel3D.IEdge);

        /** Edge id. */
        public id: number;

        /** Edge points. */
        public points: number[];

        /** Edge color. */
        public color: number;

        /**
         * Creates a new Edge instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Edge instance
         */
        public static create(properties?: cadModel3D.IEdge): cadModel3D.Edge;

        /**
         * Encodes the specified Edge message. Does not implicitly {@link cadModel3D.Edge.verify|verify} messages.
         * @param message Edge message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: cadModel3D.IEdge, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Edge message, length delimited. Does not implicitly {@link cadModel3D.Edge.verify|verify} messages.
         * @param message Edge message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: cadModel3D.IEdge, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Edge message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Edge
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cadModel3D.Edge;

        /**
         * Decodes an Edge message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Edge
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cadModel3D.Edge;

        /**
         * Verifies an Edge message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Edge message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Edge
         */
        public static fromObject(object: { [k: string]: any }): cadModel3D.Edge;

        /**
         * Creates a plain object from an Edge message. Also converts values to other types if specified.
         * @param message Edge
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: cadModel3D.Edge, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Edge to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a Face. */
    interface IFace {

        /** Face id */
        id?: (number|null);

        /** Face refEdges */
        refEdges?: (number[]|null);

        /** Face surface */
        surface?: (cadModel3D.IMesh|null);

        /** Face color */
        color?: (number|null);
    }

    /** Represents a Face. */
    class Face implements IFace {

        /**
         * Constructs a new Face.
         * @param [properties] Properties to set
         */
        constructor(properties?: cadModel3D.IFace);

        /** Face id. */
        public id: number;

        /** Face refEdges. */
        public refEdges: number[];

        /** Face surface. */
        public surface?: (cadModel3D.IMesh|null);

        /** Face color. */
        public color: number;

        /**
         * Creates a new Face instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Face instance
         */
        public static create(properties?: cadModel3D.IFace): cadModel3D.Face;

        /**
         * Encodes the specified Face message. Does not implicitly {@link cadModel3D.Face.verify|verify} messages.
         * @param message Face message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: cadModel3D.IFace, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Face message, length delimited. Does not implicitly {@link cadModel3D.Face.verify|verify} messages.
         * @param message Face message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: cadModel3D.IFace, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Face message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Face
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cadModel3D.Face;

        /**
         * Decodes a Face message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Face
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cadModel3D.Face;

        /**
         * Verifies a Face message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Face message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Face
         */
        public static fromObject(object: { [k: string]: any }): cadModel3D.Face;

        /**
         * Creates a plain object from a Face message. Also converts values to other types if specified.
         * @param message Face
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: cadModel3D.Face, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Face to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a Mesh. */
    interface IMesh {

        /** Mesh positions */
        positions?: (number[]|null);

        /** Mesh normals */
        normals?: (number[]|null);

        /** Mesh indices */
        indices?: (number[]|null);
    }

    /** Represents a Mesh. */
    class Mesh implements IMesh {

        /**
         * Constructs a new Mesh.
         * @param [properties] Properties to set
         */
        constructor(properties?: cadModel3D.IMesh);

        /** Mesh positions. */
        public positions: number[];

        /** Mesh normals. */
        public normals: number[];

        /** Mesh indices. */
        public indices: number[];

        /**
         * Creates a new Mesh instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Mesh instance
         */
        public static create(properties?: cadModel3D.IMesh): cadModel3D.Mesh;

        /**
         * Encodes the specified Mesh message. Does not implicitly {@link cadModel3D.Mesh.verify|verify} messages.
         * @param message Mesh message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: cadModel3D.IMesh, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Mesh message, length delimited. Does not implicitly {@link cadModel3D.Mesh.verify|verify} messages.
         * @param message Mesh message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: cadModel3D.IMesh, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Mesh message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Mesh
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cadModel3D.Mesh;

        /**
         * Decodes a Mesh message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Mesh
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cadModel3D.Mesh;

        /**
         * Verifies a Mesh message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Mesh message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Mesh
         */
        public static fromObject(object: { [k: string]: any }): cadModel3D.Mesh;

        /**
         * Creates a plain object from a Mesh message. Also converts values to other types if specified.
         * @param message Mesh
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: cadModel3D.Mesh, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Mesh to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a Body. */
    interface IBody {

        /** Body id */
        id?: (number|null);

        /** Body edges */
        edges?: (cadModel3D.IEdge[]|null);

        /** Body faces */
        faces?: (cadModel3D.IFace[]|null);
    }

    /** Represents a Body. */
    class Body implements IBody {

        /**
         * Constructs a new Body.
         * @param [properties] Properties to set
         */
        constructor(properties?: cadModel3D.IBody);

        /** Body id. */
        public id: number;

        /** Body edges. */
        public edges: cadModel3D.IEdge[];

        /** Body faces. */
        public faces: cadModel3D.IFace[];

        /**
         * Creates a new Body instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Body instance
         */
        public static create(properties?: cadModel3D.IBody): cadModel3D.Body;

        /**
         * Encodes the specified Body message. Does not implicitly {@link cadModel3D.Body.verify|verify} messages.
         * @param message Body message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: cadModel3D.IBody, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Body message, length delimited. Does not implicitly {@link cadModel3D.Body.verify|verify} messages.
         * @param message Body message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: cadModel3D.IBody, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Body message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Body
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cadModel3D.Body;

        /**
         * Decodes a Body message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Body
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cadModel3D.Body;

        /**
         * Verifies a Body message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Body message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Body
         */
        public static fromObject(object: { [k: string]: any }): cadModel3D.Body;

        /**
         * Creates a plain object from a Body message. Also converts values to other types if specified.
         * @param message Body
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: cadModel3D.Body, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Body to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }
}

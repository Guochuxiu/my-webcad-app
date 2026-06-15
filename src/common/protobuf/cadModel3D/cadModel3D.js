/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const cadModel3D = $root.cadModel3D = (() => {

    /**
     * Namespace cadModel3D.
     * @exports cadModel3D
     * @namespace
     */
    const cadModel3D = {};

    cadModel3D.CADModels = (function() {

        /**
         * Properties of a CADModels.
         * @memberof cadModel3D
         * @interface ICADModels
         * @property {Array.<cadModel3D.ICADModel>|null} [models] CADModels models
         */

        /**
         * Constructs a new CADModels.
         * @memberof cadModel3D
         * @classdesc Represents a CADModels.
         * @implements ICADModels
         * @constructor
         * @param {cadModel3D.ICADModels=} [properties] Properties to set
         */
        function CADModels(properties) {
            this.models = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * CADModels models.
         * @member {Array.<cadModel3D.ICADModel>} models
         * @memberof cadModel3D.CADModels
         * @instance
         */
        CADModels.prototype.models = $util.emptyArray;

        /**
         * Creates a new CADModels instance using the specified properties.
         * @function create
         * @memberof cadModel3D.CADModels
         * @static
         * @param {cadModel3D.ICADModels=} [properties] Properties to set
         * @returns {cadModel3D.CADModels} CADModels instance
         */
        CADModels.create = function create(properties) {
            return new CADModels(properties);
        };

        /**
         * Encodes the specified CADModels message. Does not implicitly {@link cadModel3D.CADModels.verify|verify} messages.
         * @function encode
         * @memberof cadModel3D.CADModels
         * @static
         * @param {cadModel3D.ICADModels} message CADModels message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CADModels.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.models != null && message.models.length)
                for (let i = 0; i < message.models.length; ++i)
                    $root.cadModel3D.CADModel.encode(message.models[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified CADModels message, length delimited. Does not implicitly {@link cadModel3D.CADModels.verify|verify} messages.
         * @function encodeDelimited
         * @memberof cadModel3D.CADModels
         * @static
         * @param {cadModel3D.ICADModels} message CADModels message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CADModels.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a CADModels message from the specified reader or buffer.
         * @function decode
         * @memberof cadModel3D.CADModels
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {cadModel3D.CADModels} CADModels
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CADModels.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.cadModel3D.CADModels();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.models && message.models.length))
                        message.models = [];
                    message.models.push($root.cadModel3D.CADModel.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a CADModels message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof cadModel3D.CADModels
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {cadModel3D.CADModels} CADModels
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CADModels.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a CADModels message.
         * @function verify
         * @memberof cadModel3D.CADModels
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        CADModels.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.models != null && message.hasOwnProperty("models")) {
                if (!Array.isArray(message.models))
                    return "models: array expected";
                for (let i = 0; i < message.models.length; ++i) {
                    let error = $root.cadModel3D.CADModel.verify(message.models[i]);
                    if (error)
                        return "models." + error;
                }
            }
            return null;
        };

        /**
         * Creates a CADModels message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof cadModel3D.CADModels
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {cadModel3D.CADModels} CADModels
         */
        CADModels.fromObject = function fromObject(object) {
            if (object instanceof $root.cadModel3D.CADModels)
                return object;
            let message = new $root.cadModel3D.CADModels();
            if (object.models) {
                if (!Array.isArray(object.models))
                    throw TypeError(".cadModel3D.CADModels.models: array expected");
                message.models = [];
                for (let i = 0; i < object.models.length; ++i) {
                    if (typeof object.models[i] !== "object")
                        throw TypeError(".cadModel3D.CADModels.models: object expected");
                    message.models[i] = $root.cadModel3D.CADModel.fromObject(object.models[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a CADModels message. Also converts values to other types if specified.
         * @function toObject
         * @memberof cadModel3D.CADModels
         * @static
         * @param {cadModel3D.CADModels} message CADModels
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        CADModels.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.models = [];
            if (message.models && message.models.length) {
                object.models = [];
                for (let j = 0; j < message.models.length; ++j)
                    object.models[j] = $root.cadModel3D.CADModel.toObject(message.models[j], options);
            }
            return object;
        };

        /**
         * Converts this CADModels to JSON.
         * @function toJSON
         * @memberof cadModel3D.CADModels
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        CADModels.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return CADModels;
    })();

    cadModel3D.CADModel = (function() {

        /**
         * Properties of a CADModel.
         * @memberof cadModel3D
         * @interface ICADModel
         * @property {number|null} [id] CADModel id
         * @property {Array.<cadModel3D.IVertex>|null} [vertices] CADModel vertices
         * @property {Array.<cadModel3D.IEdge>|null} [edges] CADModel edges
         * @property {Array.<cadModel3D.IFace>|null} [faces] CADModel faces
         * @property {Array.<cadModel3D.IBody>|null} [bodies] CADModel bodies
         */

        /**
         * Constructs a new CADModel.
         * @memberof cadModel3D
         * @classdesc Represents a CADModel.
         * @implements ICADModel
         * @constructor
         * @param {cadModel3D.ICADModel=} [properties] Properties to set
         */
        function CADModel(properties) {
            this.vertices = [];
            this.edges = [];
            this.faces = [];
            this.bodies = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * CADModel id.
         * @member {number} id
         * @memberof cadModel3D.CADModel
         * @instance
         */
        CADModel.prototype.id = 0;

        /**
         * CADModel vertices.
         * @member {Array.<cadModel3D.IVertex>} vertices
         * @memberof cadModel3D.CADModel
         * @instance
         */
        CADModel.prototype.vertices = $util.emptyArray;

        /**
         * CADModel edges.
         * @member {Array.<cadModel3D.IEdge>} edges
         * @memberof cadModel3D.CADModel
         * @instance
         */
        CADModel.prototype.edges = $util.emptyArray;

        /**
         * CADModel faces.
         * @member {Array.<cadModel3D.IFace>} faces
         * @memberof cadModel3D.CADModel
         * @instance
         */
        CADModel.prototype.faces = $util.emptyArray;

        /**
         * CADModel bodies.
         * @member {Array.<cadModel3D.IBody>} bodies
         * @memberof cadModel3D.CADModel
         * @instance
         */
        CADModel.prototype.bodies = $util.emptyArray;

        /**
         * Creates a new CADModel instance using the specified properties.
         * @function create
         * @memberof cadModel3D.CADModel
         * @static
         * @param {cadModel3D.ICADModel=} [properties] Properties to set
         * @returns {cadModel3D.CADModel} CADModel instance
         */
        CADModel.create = function create(properties) {
            return new CADModel(properties);
        };

        /**
         * Encodes the specified CADModel message. Does not implicitly {@link cadModel3D.CADModel.verify|verify} messages.
         * @function encode
         * @memberof cadModel3D.CADModel
         * @static
         * @param {cadModel3D.ICADModel} message CADModel message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CADModel.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.id);
            if (message.vertices != null && message.vertices.length)
                for (let i = 0; i < message.vertices.length; ++i)
                    $root.cadModel3D.Vertex.encode(message.vertices[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.edges != null && message.edges.length)
                for (let i = 0; i < message.edges.length; ++i)
                    $root.cadModel3D.Edge.encode(message.edges[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            if (message.faces != null && message.faces.length)
                for (let i = 0; i < message.faces.length; ++i)
                    $root.cadModel3D.Face.encode(message.faces[i], writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
            if (message.bodies != null && message.bodies.length)
                for (let i = 0; i < message.bodies.length; ++i)
                    $root.cadModel3D.Body.encode(message.bodies[i], writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified CADModel message, length delimited. Does not implicitly {@link cadModel3D.CADModel.verify|verify} messages.
         * @function encodeDelimited
         * @memberof cadModel3D.CADModel
         * @static
         * @param {cadModel3D.ICADModel} message CADModel message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CADModel.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a CADModel message from the specified reader or buffer.
         * @function decode
         * @memberof cadModel3D.CADModel
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {cadModel3D.CADModel} CADModel
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CADModel.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.cadModel3D.CADModel();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.uint32();
                    break;
                case 2:
                    if (!(message.vertices && message.vertices.length))
                        message.vertices = [];
                    message.vertices.push($root.cadModel3D.Vertex.decode(reader, reader.uint32()));
                    break;
                case 3:
                    if (!(message.edges && message.edges.length))
                        message.edges = [];
                    message.edges.push($root.cadModel3D.Edge.decode(reader, reader.uint32()));
                    break;
                case 4:
                    if (!(message.faces && message.faces.length))
                        message.faces = [];
                    message.faces.push($root.cadModel3D.Face.decode(reader, reader.uint32()));
                    break;
                case 5:
                    if (!(message.bodies && message.bodies.length))
                        message.bodies = [];
                    message.bodies.push($root.cadModel3D.Body.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a CADModel message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof cadModel3D.CADModel
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {cadModel3D.CADModel} CADModel
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CADModel.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a CADModel message.
         * @function verify
         * @memberof cadModel3D.CADModel
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        CADModel.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.vertices != null && message.hasOwnProperty("vertices")) {
                if (!Array.isArray(message.vertices))
                    return "vertices: array expected";
                for (let i = 0; i < message.vertices.length; ++i) {
                    let error = $root.cadModel3D.Vertex.verify(message.vertices[i]);
                    if (error)
                        return "vertices." + error;
                }
            }
            if (message.edges != null && message.hasOwnProperty("edges")) {
                if (!Array.isArray(message.edges))
                    return "edges: array expected";
                for (let i = 0; i < message.edges.length; ++i) {
                    let error = $root.cadModel3D.Edge.verify(message.edges[i]);
                    if (error)
                        return "edges." + error;
                }
            }
            if (message.faces != null && message.hasOwnProperty("faces")) {
                if (!Array.isArray(message.faces))
                    return "faces: array expected";
                for (let i = 0; i < message.faces.length; ++i) {
                    let error = $root.cadModel3D.Face.verify(message.faces[i]);
                    if (error)
                        return "faces." + error;
                }
            }
            if (message.bodies != null && message.hasOwnProperty("bodies")) {
                if (!Array.isArray(message.bodies))
                    return "bodies: array expected";
                for (let i = 0; i < message.bodies.length; ++i) {
                    let error = $root.cadModel3D.Body.verify(message.bodies[i]);
                    if (error)
                        return "bodies." + error;
                }
            }
            return null;
        };

        /**
         * Creates a CADModel message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof cadModel3D.CADModel
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {cadModel3D.CADModel} CADModel
         */
        CADModel.fromObject = function fromObject(object) {
            if (object instanceof $root.cadModel3D.CADModel)
                return object;
            let message = new $root.cadModel3D.CADModel();
            if (object.id != null)
                message.id = object.id >>> 0;
            if (object.vertices) {
                if (!Array.isArray(object.vertices))
                    throw TypeError(".cadModel3D.CADModel.vertices: array expected");
                message.vertices = [];
                for (let i = 0; i < object.vertices.length; ++i) {
                    if (typeof object.vertices[i] !== "object")
                        throw TypeError(".cadModel3D.CADModel.vertices: object expected");
                    message.vertices[i] = $root.cadModel3D.Vertex.fromObject(object.vertices[i]);
                }
            }
            if (object.edges) {
                if (!Array.isArray(object.edges))
                    throw TypeError(".cadModel3D.CADModel.edges: array expected");
                message.edges = [];
                for (let i = 0; i < object.edges.length; ++i) {
                    if (typeof object.edges[i] !== "object")
                        throw TypeError(".cadModel3D.CADModel.edges: object expected");
                    message.edges[i] = $root.cadModel3D.Edge.fromObject(object.edges[i]);
                }
            }
            if (object.faces) {
                if (!Array.isArray(object.faces))
                    throw TypeError(".cadModel3D.CADModel.faces: array expected");
                message.faces = [];
                for (let i = 0; i < object.faces.length; ++i) {
                    if (typeof object.faces[i] !== "object")
                        throw TypeError(".cadModel3D.CADModel.faces: object expected");
                    message.faces[i] = $root.cadModel3D.Face.fromObject(object.faces[i]);
                }
            }
            if (object.bodies) {
                if (!Array.isArray(object.bodies))
                    throw TypeError(".cadModel3D.CADModel.bodies: array expected");
                message.bodies = [];
                for (let i = 0; i < object.bodies.length; ++i) {
                    if (typeof object.bodies[i] !== "object")
                        throw TypeError(".cadModel3D.CADModel.bodies: object expected");
                    message.bodies[i] = $root.cadModel3D.Body.fromObject(object.bodies[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a CADModel message. Also converts values to other types if specified.
         * @function toObject
         * @memberof cadModel3D.CADModel
         * @static
         * @param {cadModel3D.CADModel} message CADModel
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        CADModel.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults) {
                object.vertices = [];
                object.edges = [];
                object.faces = [];
                object.bodies = [];
            }
            if (options.defaults)
                object.id = 0;
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.vertices && message.vertices.length) {
                object.vertices = [];
                for (let j = 0; j < message.vertices.length; ++j)
                    object.vertices[j] = $root.cadModel3D.Vertex.toObject(message.vertices[j], options);
            }
            if (message.edges && message.edges.length) {
                object.edges = [];
                for (let j = 0; j < message.edges.length; ++j)
                    object.edges[j] = $root.cadModel3D.Edge.toObject(message.edges[j], options);
            }
            if (message.faces && message.faces.length) {
                object.faces = [];
                for (let j = 0; j < message.faces.length; ++j)
                    object.faces[j] = $root.cadModel3D.Face.toObject(message.faces[j], options);
            }
            if (message.bodies && message.bodies.length) {
                object.bodies = [];
                for (let j = 0; j < message.bodies.length; ++j)
                    object.bodies[j] = $root.cadModel3D.Body.toObject(message.bodies[j], options);
            }
            return object;
        };

        /**
         * Converts this CADModel to JSON.
         * @function toJSON
         * @memberof cadModel3D.CADModel
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        CADModel.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return CADModel;
    })();

    cadModel3D.Vertex = (function() {

        /**
         * Properties of a Vertex.
         * @memberof cadModel3D
         * @interface IVertex
         * @property {number|null} [id] Vertex id
         * @property {Array.<number>|null} [point] Vertex point
         * @property {number|null} [color] Vertex color
         */

        /**
         * Constructs a new Vertex.
         * @memberof cadModel3D
         * @classdesc Represents a Vertex.
         * @implements IVertex
         * @constructor
         * @param {cadModel3D.IVertex=} [properties] Properties to set
         */
        function Vertex(properties) {
            this.point = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Vertex id.
         * @member {number} id
         * @memberof cadModel3D.Vertex
         * @instance
         */
        Vertex.prototype.id = 0;

        /**
         * Vertex point.
         * @member {Array.<number>} point
         * @memberof cadModel3D.Vertex
         * @instance
         */
        Vertex.prototype.point = $util.emptyArray;

        /**
         * Vertex color.
         * @member {number} color
         * @memberof cadModel3D.Vertex
         * @instance
         */
        Vertex.prototype.color = 0;

        /**
         * Creates a new Vertex instance using the specified properties.
         * @function create
         * @memberof cadModel3D.Vertex
         * @static
         * @param {cadModel3D.IVertex=} [properties] Properties to set
         * @returns {cadModel3D.Vertex} Vertex instance
         */
        Vertex.create = function create(properties) {
            return new Vertex(properties);
        };

        /**
         * Encodes the specified Vertex message. Does not implicitly {@link cadModel3D.Vertex.verify|verify} messages.
         * @function encode
         * @memberof cadModel3D.Vertex
         * @static
         * @param {cadModel3D.IVertex} message Vertex message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Vertex.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.id);
            if (message.point != null && message.point.length) {
                writer.uint32(/* id 2, wireType 2 =*/18).fork();
                for (let i = 0; i < message.point.length; ++i)
                    writer.float(message.point[i]);
                writer.ldelim();
            }
            if (message.color != null && Object.hasOwnProperty.call(message, "color"))
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.color);
            return writer;
        };

        /**
         * Encodes the specified Vertex message, length delimited. Does not implicitly {@link cadModel3D.Vertex.verify|verify} messages.
         * @function encodeDelimited
         * @memberof cadModel3D.Vertex
         * @static
         * @param {cadModel3D.IVertex} message Vertex message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Vertex.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Vertex message from the specified reader or buffer.
         * @function decode
         * @memberof cadModel3D.Vertex
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {cadModel3D.Vertex} Vertex
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Vertex.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.cadModel3D.Vertex();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.uint32();
                    break;
                case 2:
                    if (!(message.point && message.point.length))
                        message.point = [];
                    if ((tag & 7) === 2) {
                        let end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.point.push(reader.float());
                    } else
                        message.point.push(reader.float());
                    break;
                case 3:
                    message.color = reader.uint32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Vertex message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof cadModel3D.Vertex
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {cadModel3D.Vertex} Vertex
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Vertex.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Vertex message.
         * @function verify
         * @memberof cadModel3D.Vertex
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Vertex.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.point != null && message.hasOwnProperty("point")) {
                if (!Array.isArray(message.point))
                    return "point: array expected";
                for (let i = 0; i < message.point.length; ++i)
                    if (typeof message.point[i] !== "number")
                        return "point: number[] expected";
            }
            if (message.color != null && message.hasOwnProperty("color"))
                if (!$util.isInteger(message.color))
                    return "color: integer expected";
            return null;
        };

        /**
         * Creates a Vertex message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof cadModel3D.Vertex
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {cadModel3D.Vertex} Vertex
         */
        Vertex.fromObject = function fromObject(object) {
            if (object instanceof $root.cadModel3D.Vertex)
                return object;
            let message = new $root.cadModel3D.Vertex();
            if (object.id != null)
                message.id = object.id >>> 0;
            if (object.point) {
                if (!Array.isArray(object.point))
                    throw TypeError(".cadModel3D.Vertex.point: array expected");
                message.point = [];
                for (let i = 0; i < object.point.length; ++i)
                    message.point[i] = Number(object.point[i]);
            }
            if (object.color != null)
                message.color = object.color >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a Vertex message. Also converts values to other types if specified.
         * @function toObject
         * @memberof cadModel3D.Vertex
         * @static
         * @param {cadModel3D.Vertex} message Vertex
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Vertex.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.point = [];
            if (options.defaults) {
                object.id = 0;
                object.color = 0;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.point && message.point.length) {
                object.point = [];
                for (let j = 0; j < message.point.length; ++j)
                    object.point[j] = options.json && !isFinite(message.point[j]) ? String(message.point[j]) : message.point[j];
            }
            if (message.color != null && message.hasOwnProperty("color"))
                object.color = message.color;
            return object;
        };

        /**
         * Converts this Vertex to JSON.
         * @function toJSON
         * @memberof cadModel3D.Vertex
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Vertex.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Vertex;
    })();

    cadModel3D.Edge = (function() {

        /**
         * Properties of an Edge.
         * @memberof cadModel3D
         * @interface IEdge
         * @property {number|null} [id] Edge id
         * @property {Array.<number>|null} [points] Edge points
         * @property {number|null} [color] Edge color
         */

        /**
         * Constructs a new Edge.
         * @memberof cadModel3D
         * @classdesc Represents an Edge.
         * @implements IEdge
         * @constructor
         * @param {cadModel3D.IEdge=} [properties] Properties to set
         */
        function Edge(properties) {
            this.points = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Edge id.
         * @member {number} id
         * @memberof cadModel3D.Edge
         * @instance
         */
        Edge.prototype.id = 0;

        /**
         * Edge points.
         * @member {Array.<number>} points
         * @memberof cadModel3D.Edge
         * @instance
         */
        Edge.prototype.points = $util.emptyArray;

        /**
         * Edge color.
         * @member {number} color
         * @memberof cadModel3D.Edge
         * @instance
         */
        Edge.prototype.color = 0;

        /**
         * Creates a new Edge instance using the specified properties.
         * @function create
         * @memberof cadModel3D.Edge
         * @static
         * @param {cadModel3D.IEdge=} [properties] Properties to set
         * @returns {cadModel3D.Edge} Edge instance
         */
        Edge.create = function create(properties) {
            return new Edge(properties);
        };

        /**
         * Encodes the specified Edge message. Does not implicitly {@link cadModel3D.Edge.verify|verify} messages.
         * @function encode
         * @memberof cadModel3D.Edge
         * @static
         * @param {cadModel3D.IEdge} message Edge message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Edge.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.id);
            if (message.points != null && message.points.length) {
                writer.uint32(/* id 2, wireType 2 =*/18).fork();
                for (let i = 0; i < message.points.length; ++i)
                    writer.float(message.points[i]);
                writer.ldelim();
            }
            if (message.color != null && Object.hasOwnProperty.call(message, "color"))
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.color);
            return writer;
        };

        /**
         * Encodes the specified Edge message, length delimited. Does not implicitly {@link cadModel3D.Edge.verify|verify} messages.
         * @function encodeDelimited
         * @memberof cadModel3D.Edge
         * @static
         * @param {cadModel3D.IEdge} message Edge message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Edge.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an Edge message from the specified reader or buffer.
         * @function decode
         * @memberof cadModel3D.Edge
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {cadModel3D.Edge} Edge
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Edge.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.cadModel3D.Edge();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.uint32();
                    break;
                case 2:
                    if (!(message.points && message.points.length))
                        message.points = [];
                    if ((tag & 7) === 2) {
                        let end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.points.push(reader.float());
                    } else
                        message.points.push(reader.float());
                    break;
                case 3:
                    message.color = reader.uint32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an Edge message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof cadModel3D.Edge
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {cadModel3D.Edge} Edge
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Edge.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an Edge message.
         * @function verify
         * @memberof cadModel3D.Edge
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Edge.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.points != null && message.hasOwnProperty("points")) {
                if (!Array.isArray(message.points))
                    return "points: array expected";
                for (let i = 0; i < message.points.length; ++i)
                    if (typeof message.points[i] !== "number")
                        return "points: number[] expected";
            }
            if (message.color != null && message.hasOwnProperty("color"))
                if (!$util.isInteger(message.color))
                    return "color: integer expected";
            return null;
        };

        /**
         * Creates an Edge message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof cadModel3D.Edge
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {cadModel3D.Edge} Edge
         */
        Edge.fromObject = function fromObject(object) {
            if (object instanceof $root.cadModel3D.Edge)
                return object;
            let message = new $root.cadModel3D.Edge();
            if (object.id != null)
                message.id = object.id >>> 0;
            if (object.points) {
                if (!Array.isArray(object.points))
                    throw TypeError(".cadModel3D.Edge.points: array expected");
                message.points = [];
                for (let i = 0; i < object.points.length; ++i)
                    message.points[i] = Number(object.points[i]);
            }
            if (object.color != null)
                message.color = object.color >>> 0;
            return message;
        };

        /**
         * Creates a plain object from an Edge message. Also converts values to other types if specified.
         * @function toObject
         * @memberof cadModel3D.Edge
         * @static
         * @param {cadModel3D.Edge} message Edge
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Edge.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.points = [];
            if (options.defaults) {
                object.id = 0;
                object.color = 0;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.points && message.points.length) {
                object.points = [];
                for (let j = 0; j < message.points.length; ++j)
                    object.points[j] = options.json && !isFinite(message.points[j]) ? String(message.points[j]) : message.points[j];
            }
            if (message.color != null && message.hasOwnProperty("color"))
                object.color = message.color;
            return object;
        };

        /**
         * Converts this Edge to JSON.
         * @function toJSON
         * @memberof cadModel3D.Edge
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Edge.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Edge;
    })();

    cadModel3D.Face = (function() {

        /**
         * Properties of a Face.
         * @memberof cadModel3D
         * @interface IFace
         * @property {number|null} [id] Face id
         * @property {Array.<number>|null} [refEdges] Face refEdges
         * @property {cadModel3D.IMesh|null} [surface] Face surface
         * @property {number|null} [color] Face color
         */

        /**
         * Constructs a new Face.
         * @memberof cadModel3D
         * @classdesc Represents a Face.
         * @implements IFace
         * @constructor
         * @param {cadModel3D.IFace=} [properties] Properties to set
         */
        function Face(properties) {
            this.refEdges = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Face id.
         * @member {number} id
         * @memberof cadModel3D.Face
         * @instance
         */
        Face.prototype.id = 0;

        /**
         * Face refEdges.
         * @member {Array.<number>} refEdges
         * @memberof cadModel3D.Face
         * @instance
         */
        Face.prototype.refEdges = $util.emptyArray;

        /**
         * Face surface.
         * @member {cadModel3D.IMesh|null|undefined} surface
         * @memberof cadModel3D.Face
         * @instance
         */
        Face.prototype.surface = null;

        /**
         * Face color.
         * @member {number} color
         * @memberof cadModel3D.Face
         * @instance
         */
        Face.prototype.color = 0;

        /**
         * Creates a new Face instance using the specified properties.
         * @function create
         * @memberof cadModel3D.Face
         * @static
         * @param {cadModel3D.IFace=} [properties] Properties to set
         * @returns {cadModel3D.Face} Face instance
         */
        Face.create = function create(properties) {
            return new Face(properties);
        };

        /**
         * Encodes the specified Face message. Does not implicitly {@link cadModel3D.Face.verify|verify} messages.
         * @function encode
         * @memberof cadModel3D.Face
         * @static
         * @param {cadModel3D.IFace} message Face message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Face.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.id);
            if (message.refEdges != null && message.refEdges.length) {
                writer.uint32(/* id 2, wireType 2 =*/18).fork();
                for (let i = 0; i < message.refEdges.length; ++i)
                    writer.uint32(message.refEdges[i]);
                writer.ldelim();
            }
            if (message.surface != null && Object.hasOwnProperty.call(message, "surface"))
                $root.cadModel3D.Mesh.encode(message.surface, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            if (message.color != null && Object.hasOwnProperty.call(message, "color"))
                writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.color);
            return writer;
        };

        /**
         * Encodes the specified Face message, length delimited. Does not implicitly {@link cadModel3D.Face.verify|verify} messages.
         * @function encodeDelimited
         * @memberof cadModel3D.Face
         * @static
         * @param {cadModel3D.IFace} message Face message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Face.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Face message from the specified reader or buffer.
         * @function decode
         * @memberof cadModel3D.Face
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {cadModel3D.Face} Face
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Face.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.cadModel3D.Face();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.uint32();
                    break;
                case 2:
                    if (!(message.refEdges && message.refEdges.length))
                        message.refEdges = [];
                    if ((tag & 7) === 2) {
                        let end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.refEdges.push(reader.uint32());
                    } else
                        message.refEdges.push(reader.uint32());
                    break;
                case 3:
                    message.surface = $root.cadModel3D.Mesh.decode(reader, reader.uint32());
                    break;
                case 4:
                    message.color = reader.uint32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Face message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof cadModel3D.Face
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {cadModel3D.Face} Face
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Face.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Face message.
         * @function verify
         * @memberof cadModel3D.Face
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Face.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.refEdges != null && message.hasOwnProperty("refEdges")) {
                if (!Array.isArray(message.refEdges))
                    return "refEdges: array expected";
                for (let i = 0; i < message.refEdges.length; ++i)
                    if (!$util.isInteger(message.refEdges[i]))
                        return "refEdges: integer[] expected";
            }
            if (message.surface != null && message.hasOwnProperty("surface")) {
                let error = $root.cadModel3D.Mesh.verify(message.surface);
                if (error)
                    return "surface." + error;
            }
            if (message.color != null && message.hasOwnProperty("color"))
                if (!$util.isInteger(message.color))
                    return "color: integer expected";
            return null;
        };

        /**
         * Creates a Face message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof cadModel3D.Face
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {cadModel3D.Face} Face
         */
        Face.fromObject = function fromObject(object) {
            if (object instanceof $root.cadModel3D.Face)
                return object;
            let message = new $root.cadModel3D.Face();
            if (object.id != null)
                message.id = object.id >>> 0;
            if (object.refEdges) {
                if (!Array.isArray(object.refEdges))
                    throw TypeError(".cadModel3D.Face.refEdges: array expected");
                message.refEdges = [];
                for (let i = 0; i < object.refEdges.length; ++i)
                    message.refEdges[i] = object.refEdges[i] >>> 0;
            }
            if (object.surface != null) {
                if (typeof object.surface !== "object")
                    throw TypeError(".cadModel3D.Face.surface: object expected");
                message.surface = $root.cadModel3D.Mesh.fromObject(object.surface);
            }
            if (object.color != null)
                message.color = object.color >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a Face message. Also converts values to other types if specified.
         * @function toObject
         * @memberof cadModel3D.Face
         * @static
         * @param {cadModel3D.Face} message Face
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Face.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.refEdges = [];
            if (options.defaults) {
                object.id = 0;
                object.surface = null;
                object.color = 0;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.refEdges && message.refEdges.length) {
                object.refEdges = [];
                for (let j = 0; j < message.refEdges.length; ++j)
                    object.refEdges[j] = message.refEdges[j];
            }
            if (message.surface != null && message.hasOwnProperty("surface"))
                object.surface = $root.cadModel3D.Mesh.toObject(message.surface, options);
            if (message.color != null && message.hasOwnProperty("color"))
                object.color = message.color;
            return object;
        };

        /**
         * Converts this Face to JSON.
         * @function toJSON
         * @memberof cadModel3D.Face
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Face.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Face;
    })();

    cadModel3D.Mesh = (function() {

        /**
         * Properties of a Mesh.
         * @memberof cadModel3D
         * @interface IMesh
         * @property {Array.<number>|null} [positions] Mesh positions
         * @property {Array.<number>|null} [normals] Mesh normals
         * @property {Array.<number>|null} [indices] Mesh indices
         */

        /**
         * Constructs a new Mesh.
         * @memberof cadModel3D
         * @classdesc Represents a Mesh.
         * @implements IMesh
         * @constructor
         * @param {cadModel3D.IMesh=} [properties] Properties to set
         */
        function Mesh(properties) {
            this.positions = [];
            this.normals = [];
            this.indices = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Mesh positions.
         * @member {Array.<number>} positions
         * @memberof cadModel3D.Mesh
         * @instance
         */
        Mesh.prototype.positions = $util.emptyArray;

        /**
         * Mesh normals.
         * @member {Array.<number>} normals
         * @memberof cadModel3D.Mesh
         * @instance
         */
        Mesh.prototype.normals = $util.emptyArray;

        /**
         * Mesh indices.
         * @member {Array.<number>} indices
         * @memberof cadModel3D.Mesh
         * @instance
         */
        Mesh.prototype.indices = $util.emptyArray;

        /**
         * Creates a new Mesh instance using the specified properties.
         * @function create
         * @memberof cadModel3D.Mesh
         * @static
         * @param {cadModel3D.IMesh=} [properties] Properties to set
         * @returns {cadModel3D.Mesh} Mesh instance
         */
        Mesh.create = function create(properties) {
            return new Mesh(properties);
        };

        /**
         * Encodes the specified Mesh message. Does not implicitly {@link cadModel3D.Mesh.verify|verify} messages.
         * @function encode
         * @memberof cadModel3D.Mesh
         * @static
         * @param {cadModel3D.IMesh} message Mesh message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Mesh.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.positions != null && message.positions.length) {
                writer.uint32(/* id 1, wireType 2 =*/10).fork();
                for (let i = 0; i < message.positions.length; ++i)
                    writer.float(message.positions[i]);
                writer.ldelim();
            }
            if (message.normals != null && message.normals.length) {
                writer.uint32(/* id 2, wireType 2 =*/18).fork();
                for (let i = 0; i < message.normals.length; ++i)
                    writer.float(message.normals[i]);
                writer.ldelim();
            }
            if (message.indices != null && message.indices.length) {
                writer.uint32(/* id 3, wireType 2 =*/26).fork();
                for (let i = 0; i < message.indices.length; ++i)
                    writer.uint32(message.indices[i]);
                writer.ldelim();
            }
            return writer;
        };

        /**
         * Encodes the specified Mesh message, length delimited. Does not implicitly {@link cadModel3D.Mesh.verify|verify} messages.
         * @function encodeDelimited
         * @memberof cadModel3D.Mesh
         * @static
         * @param {cadModel3D.IMesh} message Mesh message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Mesh.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Mesh message from the specified reader or buffer.
         * @function decode
         * @memberof cadModel3D.Mesh
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {cadModel3D.Mesh} Mesh
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Mesh.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.cadModel3D.Mesh();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.positions && message.positions.length))
                        message.positions = [];
                    if ((tag & 7) === 2) {
                        let end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.positions.push(reader.float());
                    } else
                        message.positions.push(reader.float());
                    break;
                case 2:
                    if (!(message.normals && message.normals.length))
                        message.normals = [];
                    if ((tag & 7) === 2) {
                        let end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.normals.push(reader.float());
                    } else
                        message.normals.push(reader.float());
                    break;
                case 3:
                    if (!(message.indices && message.indices.length))
                        message.indices = [];
                    if ((tag & 7) === 2) {
                        let end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.indices.push(reader.uint32());
                    } else
                        message.indices.push(reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Mesh message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof cadModel3D.Mesh
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {cadModel3D.Mesh} Mesh
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Mesh.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Mesh message.
         * @function verify
         * @memberof cadModel3D.Mesh
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Mesh.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.positions != null && message.hasOwnProperty("positions")) {
                if (!Array.isArray(message.positions))
                    return "positions: array expected";
                for (let i = 0; i < message.positions.length; ++i)
                    if (typeof message.positions[i] !== "number")
                        return "positions: number[] expected";
            }
            if (message.normals != null && message.hasOwnProperty("normals")) {
                if (!Array.isArray(message.normals))
                    return "normals: array expected";
                for (let i = 0; i < message.normals.length; ++i)
                    if (typeof message.normals[i] !== "number")
                        return "normals: number[] expected";
            }
            if (message.indices != null && message.hasOwnProperty("indices")) {
                if (!Array.isArray(message.indices))
                    return "indices: array expected";
                for (let i = 0; i < message.indices.length; ++i)
                    if (!$util.isInteger(message.indices[i]))
                        return "indices: integer[] expected";
            }
            return null;
        };

        /**
         * Creates a Mesh message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof cadModel3D.Mesh
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {cadModel3D.Mesh} Mesh
         */
        Mesh.fromObject = function fromObject(object) {
            if (object instanceof $root.cadModel3D.Mesh)
                return object;
            let message = new $root.cadModel3D.Mesh();
            if (object.positions) {
                if (!Array.isArray(object.positions))
                    throw TypeError(".cadModel3D.Mesh.positions: array expected");
                message.positions = [];
                for (let i = 0; i < object.positions.length; ++i)
                    message.positions[i] = Number(object.positions[i]);
            }
            if (object.normals) {
                if (!Array.isArray(object.normals))
                    throw TypeError(".cadModel3D.Mesh.normals: array expected");
                message.normals = [];
                for (let i = 0; i < object.normals.length; ++i)
                    message.normals[i] = Number(object.normals[i]);
            }
            if (object.indices) {
                if (!Array.isArray(object.indices))
                    throw TypeError(".cadModel3D.Mesh.indices: array expected");
                message.indices = [];
                for (let i = 0; i < object.indices.length; ++i)
                    message.indices[i] = object.indices[i] >>> 0;
            }
            return message;
        };

        /**
         * Creates a plain object from a Mesh message. Also converts values to other types if specified.
         * @function toObject
         * @memberof cadModel3D.Mesh
         * @static
         * @param {cadModel3D.Mesh} message Mesh
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Mesh.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults) {
                object.positions = [];
                object.normals = [];
                object.indices = [];
            }
            if (message.positions && message.positions.length) {
                object.positions = [];
                for (let j = 0; j < message.positions.length; ++j)
                    object.positions[j] = options.json && !isFinite(message.positions[j]) ? String(message.positions[j]) : message.positions[j];
            }
            if (message.normals && message.normals.length) {
                object.normals = [];
                for (let j = 0; j < message.normals.length; ++j)
                    object.normals[j] = options.json && !isFinite(message.normals[j]) ? String(message.normals[j]) : message.normals[j];
            }
            if (message.indices && message.indices.length) {
                object.indices = [];
                for (let j = 0; j < message.indices.length; ++j)
                    object.indices[j] = message.indices[j];
            }
            return object;
        };

        /**
         * Converts this Mesh to JSON.
         * @function toJSON
         * @memberof cadModel3D.Mesh
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Mesh.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Mesh;
    })();

    cadModel3D.Body = (function() {

        /**
         * Properties of a Body.
         * @memberof cadModel3D
         * @interface IBody
         * @property {number|null} [id] Body id
         * @property {Array.<cadModel3D.IEdge>|null} [edges] Body edges
         * @property {Array.<cadModel3D.IFace>|null} [faces] Body faces
         */

        /**
         * Constructs a new Body.
         * @memberof cadModel3D
         * @classdesc Represents a Body.
         * @implements IBody
         * @constructor
         * @param {cadModel3D.IBody=} [properties] Properties to set
         */
        function Body(properties) {
            this.edges = [];
            this.faces = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Body id.
         * @member {number} id
         * @memberof cadModel3D.Body
         * @instance
         */
        Body.prototype.id = 0;

        /**
         * Body edges.
         * @member {Array.<cadModel3D.IEdge>} edges
         * @memberof cadModel3D.Body
         * @instance
         */
        Body.prototype.edges = $util.emptyArray;

        /**
         * Body faces.
         * @member {Array.<cadModel3D.IFace>} faces
         * @memberof cadModel3D.Body
         * @instance
         */
        Body.prototype.faces = $util.emptyArray;

        /**
         * Creates a new Body instance using the specified properties.
         * @function create
         * @memberof cadModel3D.Body
         * @static
         * @param {cadModel3D.IBody=} [properties] Properties to set
         * @returns {cadModel3D.Body} Body instance
         */
        Body.create = function create(properties) {
            return new Body(properties);
        };

        /**
         * Encodes the specified Body message. Does not implicitly {@link cadModel3D.Body.verify|verify} messages.
         * @function encode
         * @memberof cadModel3D.Body
         * @static
         * @param {cadModel3D.IBody} message Body message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Body.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.id);
            if (message.edges != null && message.edges.length)
                for (let i = 0; i < message.edges.length; ++i)
                    $root.cadModel3D.Edge.encode(message.edges[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.faces != null && message.faces.length)
                for (let i = 0; i < message.faces.length; ++i)
                    $root.cadModel3D.Face.encode(message.faces[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified Body message, length delimited. Does not implicitly {@link cadModel3D.Body.verify|verify} messages.
         * @function encodeDelimited
         * @memberof cadModel3D.Body
         * @static
         * @param {cadModel3D.IBody} message Body message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Body.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Body message from the specified reader or buffer.
         * @function decode
         * @memberof cadModel3D.Body
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {cadModel3D.Body} Body
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Body.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.cadModel3D.Body();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.uint32();
                    break;
                case 2:
                    if (!(message.edges && message.edges.length))
                        message.edges = [];
                    message.edges.push($root.cadModel3D.Edge.decode(reader, reader.uint32()));
                    break;
                case 3:
                    if (!(message.faces && message.faces.length))
                        message.faces = [];
                    message.faces.push($root.cadModel3D.Face.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Body message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof cadModel3D.Body
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {cadModel3D.Body} Body
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Body.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Body message.
         * @function verify
         * @memberof cadModel3D.Body
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Body.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.edges != null && message.hasOwnProperty("edges")) {
                if (!Array.isArray(message.edges))
                    return "edges: array expected";
                for (let i = 0; i < message.edges.length; ++i) {
                    let error = $root.cadModel3D.Edge.verify(message.edges[i]);
                    if (error)
                        return "edges." + error;
                }
            }
            if (message.faces != null && message.hasOwnProperty("faces")) {
                if (!Array.isArray(message.faces))
                    return "faces: array expected";
                for (let i = 0; i < message.faces.length; ++i) {
                    let error = $root.cadModel3D.Face.verify(message.faces[i]);
                    if (error)
                        return "faces." + error;
                }
            }
            return null;
        };

        /**
         * Creates a Body message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof cadModel3D.Body
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {cadModel3D.Body} Body
         */
        Body.fromObject = function fromObject(object) {
            if (object instanceof $root.cadModel3D.Body)
                return object;
            let message = new $root.cadModel3D.Body();
            if (object.id != null)
                message.id = object.id >>> 0;
            if (object.edges) {
                if (!Array.isArray(object.edges))
                    throw TypeError(".cadModel3D.Body.edges: array expected");
                message.edges = [];
                for (let i = 0; i < object.edges.length; ++i) {
                    if (typeof object.edges[i] !== "object")
                        throw TypeError(".cadModel3D.Body.edges: object expected");
                    message.edges[i] = $root.cadModel3D.Edge.fromObject(object.edges[i]);
                }
            }
            if (object.faces) {
                if (!Array.isArray(object.faces))
                    throw TypeError(".cadModel3D.Body.faces: array expected");
                message.faces = [];
                for (let i = 0; i < object.faces.length; ++i) {
                    if (typeof object.faces[i] !== "object")
                        throw TypeError(".cadModel3D.Body.faces: object expected");
                    message.faces[i] = $root.cadModel3D.Face.fromObject(object.faces[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a Body message. Also converts values to other types if specified.
         * @function toObject
         * @memberof cadModel3D.Body
         * @static
         * @param {cadModel3D.Body} message Body
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Body.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults) {
                object.edges = [];
                object.faces = [];
            }
            if (options.defaults)
                object.id = 0;
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.edges && message.edges.length) {
                object.edges = [];
                for (let j = 0; j < message.edges.length; ++j)
                    object.edges[j] = $root.cadModel3D.Edge.toObject(message.edges[j], options);
            }
            if (message.faces && message.faces.length) {
                object.faces = [];
                for (let j = 0; j < message.faces.length; ++j)
                    object.faces[j] = $root.cadModel3D.Face.toObject(message.faces[j], options);
            }
            return object;
        };

        /**
         * Converts this Body to JSON.
         * @function toJSON
         * @memberof cadModel3D.Body
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Body.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Body;
    })();

    return cadModel3D;
})();

export { $root as default };

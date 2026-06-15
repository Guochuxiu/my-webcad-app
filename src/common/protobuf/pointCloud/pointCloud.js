/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const pointCloud = $root.pointCloud = (() => {

    /**
     * Namespace pointCloud.
     * @exports pointCloud
     * @namespace
     */
    const pointCloud = {};

    pointCloud.PointCloud = (function() {

        /**
         * Properties of a PointCloud.
         * @memberof pointCloud
         * @interface IPointCloud
         * @property {number|null} [id] PointCloud id
         * @property {Array.<number>|null} [data] PointCloud data
         * @property {number|null} [uniformColor] PointCloud uniformColor
         * @property {number|null} [colors] PointCloud colors
         */

        /**
         * Constructs a new PointCloud.
         * @memberof pointCloud
         * @classdesc Represents a PointCloud.
         * @implements IPointCloud
         * @constructor
         * @param {pointCloud.IPointCloud=} [properties] Properties to set
         */
        function PointCloud(properties) {
            this.data = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PointCloud id.
         * @member {number} id
         * @memberof pointCloud.PointCloud
         * @instance
         */
        PointCloud.prototype.id = 0;

        /**
         * PointCloud data.
         * @member {Array.<number>} data
         * @memberof pointCloud.PointCloud
         * @instance
         */
        PointCloud.prototype.data = $util.emptyArray;

        /**
         * PointCloud uniformColor.
         * @member {number|null|undefined} uniformColor
         * @memberof pointCloud.PointCloud
         * @instance
         */
        PointCloud.prototype.uniformColor = null;

        /**
         * PointCloud colors.
         * @member {number|null|undefined} colors
         * @memberof pointCloud.PointCloud
         * @instance
         */
        PointCloud.prototype.colors = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * PointCloud colorSpec.
         * @member {"uniformColor"|"colors"|undefined} colorSpec
         * @memberof pointCloud.PointCloud
         * @instance
         */
        Object.defineProperty(PointCloud.prototype, "colorSpec", {
            get: $util.oneOfGetter($oneOfFields = ["uniformColor", "colors"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new PointCloud instance using the specified properties.
         * @function create
         * @memberof pointCloud.PointCloud
         * @static
         * @param {pointCloud.IPointCloud=} [properties] Properties to set
         * @returns {pointCloud.PointCloud} PointCloud instance
         */
        PointCloud.create = function create(properties) {
            return new PointCloud(properties);
        };

        /**
         * Encodes the specified PointCloud message. Does not implicitly {@link pointCloud.PointCloud.verify|verify} messages.
         * @function encode
         * @memberof pointCloud.PointCloud
         * @static
         * @param {pointCloud.IPointCloud} message PointCloud message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PointCloud.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.id);
            if (message.data != null && message.data.length) {
                writer.uint32(/* id 2, wireType 2 =*/18).fork();
                for (let i = 0; i < message.data.length; ++i)
                    writer.float(message.data[i]);
                writer.ldelim();
            }
            if (message.uniformColor != null && Object.hasOwnProperty.call(message, "uniformColor"))
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.uniformColor);
            if (message.colors != null && Object.hasOwnProperty.call(message, "colors"))
                writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.colors);
            return writer;
        };

        /**
         * Encodes the specified PointCloud message, length delimited. Does not implicitly {@link pointCloud.PointCloud.verify|verify} messages.
         * @function encodeDelimited
         * @memberof pointCloud.PointCloud
         * @static
         * @param {pointCloud.IPointCloud} message PointCloud message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PointCloud.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PointCloud message from the specified reader or buffer.
         * @function decode
         * @memberof pointCloud.PointCloud
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {pointCloud.PointCloud} PointCloud
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PointCloud.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.pointCloud.PointCloud();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.uint32();
                    break;
                case 2:
                    if (!(message.data && message.data.length))
                        message.data = [];
                    if ((tag & 7) === 2) {
                        let end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.data.push(reader.float());
                    } else
                        message.data.push(reader.float());
                    break;
                case 3:
                    message.uniformColor = reader.uint32();
                    break;
                case 4:
                    message.colors = reader.uint32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a PointCloud message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof pointCloud.PointCloud
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {pointCloud.PointCloud} PointCloud
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PointCloud.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PointCloud message.
         * @function verify
         * @memberof pointCloud.PointCloud
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PointCloud.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            let properties = {};
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.data != null && message.hasOwnProperty("data")) {
                if (!Array.isArray(message.data))
                    return "data: array expected";
                for (let i = 0; i < message.data.length; ++i)
                    if (typeof message.data[i] !== "number")
                        return "data: number[] expected";
            }
            if (message.uniformColor != null && message.hasOwnProperty("uniformColor")) {
                properties.colorSpec = 1;
                if (!$util.isInteger(message.uniformColor))
                    return "uniformColor: integer expected";
            }
            if (message.colors != null && message.hasOwnProperty("colors")) {
                if (properties.colorSpec === 1)
                    return "colorSpec: multiple values";
                properties.colorSpec = 1;
                if (!$util.isInteger(message.colors))
                    return "colors: integer expected";
            }
            return null;
        };

        /**
         * Creates a PointCloud message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof pointCloud.PointCloud
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {pointCloud.PointCloud} PointCloud
         */
        PointCloud.fromObject = function fromObject(object) {
            if (object instanceof $root.pointCloud.PointCloud)
                return object;
            let message = new $root.pointCloud.PointCloud();
            if (object.id != null)
                message.id = object.id >>> 0;
            if (object.data) {
                if (!Array.isArray(object.data))
                    throw TypeError(".pointCloud.PointCloud.data: array expected");
                message.data = [];
                for (let i = 0; i < object.data.length; ++i)
                    message.data[i] = Number(object.data[i]);
            }
            if (object.uniformColor != null)
                message.uniformColor = object.uniformColor >>> 0;
            if (object.colors != null)
                message.colors = object.colors >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a PointCloud message. Also converts values to other types if specified.
         * @function toObject
         * @memberof pointCloud.PointCloud
         * @static
         * @param {pointCloud.PointCloud} message PointCloud
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PointCloud.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.data = [];
            if (options.defaults)
                object.id = 0;
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.data && message.data.length) {
                object.data = [];
                for (let j = 0; j < message.data.length; ++j)
                    object.data[j] = options.json && !isFinite(message.data[j]) ? String(message.data[j]) : message.data[j];
            }
            if (message.uniformColor != null && message.hasOwnProperty("uniformColor")) {
                object.uniformColor = message.uniformColor;
                if (options.oneofs)
                    object.colorSpec = "uniformColor";
            }
            if (message.colors != null && message.hasOwnProperty("colors")) {
                object.colors = message.colors;
                if (options.oneofs)
                    object.colorSpec = "colors";
            }
            return object;
        };

        /**
         * Converts this PointCloud to JSON.
         * @function toJSON
         * @memberof pointCloud.PointCloud
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PointCloud.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return PointCloud;
    })();

    pointCloud.PointClouds = (function() {

        /**
         * Properties of a PointClouds.
         * @memberof pointCloud
         * @interface IPointClouds
         * @property {Array.<pointCloud.IPointCloud>|null} [pointClouds] PointClouds pointClouds
         */

        /**
         * Constructs a new PointClouds.
         * @memberof pointCloud
         * @classdesc Represents a PointClouds.
         * @implements IPointClouds
         * @constructor
         * @param {pointCloud.IPointClouds=} [properties] Properties to set
         */
        function PointClouds(properties) {
            this.pointClouds = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PointClouds pointClouds.
         * @member {Array.<pointCloud.IPointCloud>} pointClouds
         * @memberof pointCloud.PointClouds
         * @instance
         */
        PointClouds.prototype.pointClouds = $util.emptyArray;

        /**
         * Creates a new PointClouds instance using the specified properties.
         * @function create
         * @memberof pointCloud.PointClouds
         * @static
         * @param {pointCloud.IPointClouds=} [properties] Properties to set
         * @returns {pointCloud.PointClouds} PointClouds instance
         */
        PointClouds.create = function create(properties) {
            return new PointClouds(properties);
        };

        /**
         * Encodes the specified PointClouds message. Does not implicitly {@link pointCloud.PointClouds.verify|verify} messages.
         * @function encode
         * @memberof pointCloud.PointClouds
         * @static
         * @param {pointCloud.IPointClouds} message PointClouds message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PointClouds.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.pointClouds != null && message.pointClouds.length)
                for (let i = 0; i < message.pointClouds.length; ++i)
                    $root.pointCloud.PointCloud.encode(message.pointClouds[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified PointClouds message, length delimited. Does not implicitly {@link pointCloud.PointClouds.verify|verify} messages.
         * @function encodeDelimited
         * @memberof pointCloud.PointClouds
         * @static
         * @param {pointCloud.IPointClouds} message PointClouds message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PointClouds.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PointClouds message from the specified reader or buffer.
         * @function decode
         * @memberof pointCloud.PointClouds
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {pointCloud.PointClouds} PointClouds
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PointClouds.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.pointCloud.PointClouds();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.pointClouds && message.pointClouds.length))
                        message.pointClouds = [];
                    message.pointClouds.push($root.pointCloud.PointCloud.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a PointClouds message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof pointCloud.PointClouds
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {pointCloud.PointClouds} PointClouds
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PointClouds.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PointClouds message.
         * @function verify
         * @memberof pointCloud.PointClouds
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PointClouds.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.pointClouds != null && message.hasOwnProperty("pointClouds")) {
                if (!Array.isArray(message.pointClouds))
                    return "pointClouds: array expected";
                for (let i = 0; i < message.pointClouds.length; ++i) {
                    let error = $root.pointCloud.PointCloud.verify(message.pointClouds[i]);
                    if (error)
                        return "pointClouds." + error;
                }
            }
            return null;
        };

        /**
         * Creates a PointClouds message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof pointCloud.PointClouds
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {pointCloud.PointClouds} PointClouds
         */
        PointClouds.fromObject = function fromObject(object) {
            if (object instanceof $root.pointCloud.PointClouds)
                return object;
            let message = new $root.pointCloud.PointClouds();
            if (object.pointClouds) {
                if (!Array.isArray(object.pointClouds))
                    throw TypeError(".pointCloud.PointClouds.pointClouds: array expected");
                message.pointClouds = [];
                for (let i = 0; i < object.pointClouds.length; ++i) {
                    if (typeof object.pointClouds[i] !== "object")
                        throw TypeError(".pointCloud.PointClouds.pointClouds: object expected");
                    message.pointClouds[i] = $root.pointCloud.PointCloud.fromObject(object.pointClouds[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a PointClouds message. Also converts values to other types if specified.
         * @function toObject
         * @memberof pointCloud.PointClouds
         * @static
         * @param {pointCloud.PointClouds} message PointClouds
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PointClouds.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.pointClouds = [];
            if (message.pointClouds && message.pointClouds.length) {
                object.pointClouds = [];
                for (let j = 0; j < message.pointClouds.length; ++j)
                    object.pointClouds[j] = $root.pointCloud.PointCloud.toObject(message.pointClouds[j], options);
            }
            return object;
        };

        /**
         * Converts this PointClouds to JSON.
         * @function toJSON
         * @memberof pointCloud.PointClouds
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PointClouds.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return PointClouds;
    })();

    return pointCloud;
})();

export { $root as default };

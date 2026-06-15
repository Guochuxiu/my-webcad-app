/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const SimuCommand = $root.SimuCommand = (() => {

    /**
     * Namespace SimuCommand.
     * @exports SimuCommand
     * @namespace
     */
    const SimuCommand = {};

    SimuCommand.SimuCommand = (function() {

        /**
         * Properties of a SimuCommand.
         * @memberof SimuCommand
         * @interface ISimuCommand
         * @property {number|null} [op] SimuCommand op
         * @property {Array.<number>|null} [axis] SimuCommand axis
         */

        /**
         * Constructs a new SimuCommand.
         * @memberof SimuCommand
         * @classdesc Represents a SimuCommand.
         * @implements ISimuCommand
         * @constructor
         * @param {SimuCommand.ISimuCommand=} [properties] Properties to set
         */
        function SimuCommand(properties) {
            this.axis = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * SimuCommand op.
         * @member {number} op
         * @memberof SimuCommand.SimuCommand
         * @instance
         */
        SimuCommand.prototype.op = 0;

        /**
         * SimuCommand axis.
         * @member {Array.<number>} axis
         * @memberof SimuCommand.SimuCommand
         * @instance
         */
        SimuCommand.prototype.axis = $util.emptyArray;

        /**
         * Creates a new SimuCommand instance using the specified properties.
         * @function create
         * @memberof SimuCommand.SimuCommand
         * @static
         * @param {SimuCommand.ISimuCommand=} [properties] Properties to set
         * @returns {SimuCommand.SimuCommand} SimuCommand instance
         */
        SimuCommand.create = function create(properties) {
            return new SimuCommand(properties);
        };

        /**
         * Encodes the specified SimuCommand message. Does not implicitly {@link SimuCommand.SimuCommand.verify|verify} messages.
         * @function encode
         * @memberof SimuCommand.SimuCommand
         * @static
         * @param {SimuCommand.ISimuCommand} message SimuCommand message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SimuCommand.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.op != null && Object.hasOwnProperty.call(message, "op"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.op);
            if (message.axis != null && message.axis.length) {
                writer.uint32(/* id 2, wireType 2 =*/18).fork();
                for (let i = 0; i < message.axis.length; ++i)
                    writer.double(message.axis[i]);
                writer.ldelim();
            }
            return writer;
        };

        /**
         * Encodes the specified SimuCommand message, length delimited. Does not implicitly {@link SimuCommand.SimuCommand.verify|verify} messages.
         * @function encodeDelimited
         * @memberof SimuCommand.SimuCommand
         * @static
         * @param {SimuCommand.ISimuCommand} message SimuCommand message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SimuCommand.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a SimuCommand message from the specified reader or buffer.
         * @function decode
         * @memberof SimuCommand.SimuCommand
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {SimuCommand.SimuCommand} SimuCommand
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SimuCommand.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.SimuCommand.SimuCommand();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.op = reader.int32();
                    break;
                case 2:
                    if (!(message.axis && message.axis.length))
                        message.axis = [];
                    if ((tag & 7) === 2) {
                        let end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.axis.push(reader.double());
                    } else
                        message.axis.push(reader.double());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a SimuCommand message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof SimuCommand.SimuCommand
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {SimuCommand.SimuCommand} SimuCommand
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SimuCommand.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a SimuCommand message.
         * @function verify
         * @memberof SimuCommand.SimuCommand
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        SimuCommand.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.op != null && message.hasOwnProperty("op"))
                if (!$util.isInteger(message.op))
                    return "op: integer expected";
            if (message.axis != null && message.hasOwnProperty("axis")) {
                if (!Array.isArray(message.axis))
                    return "axis: array expected";
                for (let i = 0; i < message.axis.length; ++i)
                    if (typeof message.axis[i] !== "number")
                        return "axis: number[] expected";
            }
            return null;
        };

        /**
         * Creates a SimuCommand message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof SimuCommand.SimuCommand
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {SimuCommand.SimuCommand} SimuCommand
         */
        SimuCommand.fromObject = function fromObject(object) {
            if (object instanceof $root.SimuCommand.SimuCommand)
                return object;
            let message = new $root.SimuCommand.SimuCommand();
            if (object.op != null)
                message.op = object.op | 0;
            if (object.axis) {
                if (!Array.isArray(object.axis))
                    throw TypeError(".SimuCommand.SimuCommand.axis: array expected");
                message.axis = [];
                for (let i = 0; i < object.axis.length; ++i)
                    message.axis[i] = Number(object.axis[i]);
            }
            return message;
        };

        /**
         * Creates a plain object from a SimuCommand message. Also converts values to other types if specified.
         * @function toObject
         * @memberof SimuCommand.SimuCommand
         * @static
         * @param {SimuCommand.SimuCommand} message SimuCommand
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        SimuCommand.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.axis = [];
            if (options.defaults)
                object.op = 0;
            if (message.op != null && message.hasOwnProperty("op"))
                object.op = message.op;
            if (message.axis && message.axis.length) {
                object.axis = [];
                for (let j = 0; j < message.axis.length; ++j)
                    object.axis[j] = options.json && !isFinite(message.axis[j]) ? String(message.axis[j]) : message.axis[j];
            }
            return object;
        };

        /**
         * Converts this SimuCommand to JSON.
         * @function toJSON
         * @memberof SimuCommand.SimuCommand
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        SimuCommand.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return SimuCommand;
    })();

    SimuCommand.SimuCommands = (function() {

        /**
         * Properties of a SimuCommands.
         * @memberof SimuCommand
         * @interface ISimuCommands
         * @property {Array.<SimuCommand.ISimuCommand>|null} [ops] SimuCommands ops
         */

        /**
         * Constructs a new SimuCommands.
         * @memberof SimuCommand
         * @classdesc Represents a SimuCommands.
         * @implements ISimuCommands
         * @constructor
         * @param {SimuCommand.ISimuCommands=} [properties] Properties to set
         */
        function SimuCommands(properties) {
            this.ops = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * SimuCommands ops.
         * @member {Array.<SimuCommand.ISimuCommand>} ops
         * @memberof SimuCommand.SimuCommands
         * @instance
         */
        SimuCommands.prototype.ops = $util.emptyArray;

        /**
         * Creates a new SimuCommands instance using the specified properties.
         * @function create
         * @memberof SimuCommand.SimuCommands
         * @static
         * @param {SimuCommand.ISimuCommands=} [properties] Properties to set
         * @returns {SimuCommand.SimuCommands} SimuCommands instance
         */
        SimuCommands.create = function create(properties) {
            return new SimuCommands(properties);
        };

        /**
         * Encodes the specified SimuCommands message. Does not implicitly {@link SimuCommand.SimuCommands.verify|verify} messages.
         * @function encode
         * @memberof SimuCommand.SimuCommands
         * @static
         * @param {SimuCommand.ISimuCommands} message SimuCommands message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SimuCommands.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.ops != null && message.ops.length)
                for (let i = 0; i < message.ops.length; ++i)
                    $root.SimuCommand.SimuCommand.encode(message.ops[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified SimuCommands message, length delimited. Does not implicitly {@link SimuCommand.SimuCommands.verify|verify} messages.
         * @function encodeDelimited
         * @memberof SimuCommand.SimuCommands
         * @static
         * @param {SimuCommand.ISimuCommands} message SimuCommands message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SimuCommands.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a SimuCommands message from the specified reader or buffer.
         * @function decode
         * @memberof SimuCommand.SimuCommands
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {SimuCommand.SimuCommands} SimuCommands
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SimuCommands.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.SimuCommand.SimuCommands();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.ops && message.ops.length))
                        message.ops = [];
                    message.ops.push($root.SimuCommand.SimuCommand.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a SimuCommands message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof SimuCommand.SimuCommands
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {SimuCommand.SimuCommands} SimuCommands
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SimuCommands.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a SimuCommands message.
         * @function verify
         * @memberof SimuCommand.SimuCommands
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        SimuCommands.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.ops != null && message.hasOwnProperty("ops")) {
                if (!Array.isArray(message.ops))
                    return "ops: array expected";
                for (let i = 0; i < message.ops.length; ++i) {
                    let error = $root.SimuCommand.SimuCommand.verify(message.ops[i]);
                    if (error)
                        return "ops." + error;
                }
            }
            return null;
        };

        /**
         * Creates a SimuCommands message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof SimuCommand.SimuCommands
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {SimuCommand.SimuCommands} SimuCommands
         */
        SimuCommands.fromObject = function fromObject(object) {
            if (object instanceof $root.SimuCommand.SimuCommands)
                return object;
            let message = new $root.SimuCommand.SimuCommands();
            if (object.ops) {
                if (!Array.isArray(object.ops))
                    throw TypeError(".SimuCommand.SimuCommands.ops: array expected");
                message.ops = [];
                for (let i = 0; i < object.ops.length; ++i) {
                    if (typeof object.ops[i] !== "object")
                        throw TypeError(".SimuCommand.SimuCommands.ops: object expected");
                    message.ops[i] = $root.SimuCommand.SimuCommand.fromObject(object.ops[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a SimuCommands message. Also converts values to other types if specified.
         * @function toObject
         * @memberof SimuCommand.SimuCommands
         * @static
         * @param {SimuCommand.SimuCommands} message SimuCommands
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        SimuCommands.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.ops = [];
            if (message.ops && message.ops.length) {
                object.ops = [];
                for (let j = 0; j < message.ops.length; ++j)
                    object.ops[j] = $root.SimuCommand.SimuCommand.toObject(message.ops[j], options);
            }
            return object;
        };

        /**
         * Converts this SimuCommands to JSON.
         * @function toJSON
         * @memberof SimuCommand.SimuCommands
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        SimuCommands.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return SimuCommands;
    })();

    return SimuCommand;
})();

export { $root as default };

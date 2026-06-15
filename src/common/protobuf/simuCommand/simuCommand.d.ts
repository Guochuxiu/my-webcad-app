import * as $protobuf from 'protobufjs';
/** Namespace SimuCommand. */
export namespace SimuCommand {

    /** Properties of a SimuCommand. */
    interface ISimuCommand {

        /** SimuCommand op */
        op?: (number|null);

        /** SimuCommand axis */
        axis?: (number[]|null);
    }

    /** Represents a SimuCommand. */
    class SimuCommand implements ISimuCommand {

        /**
         * Constructs a new SimuCommand.
         * @param [properties] Properties to set
         */
        constructor(properties?: SimuCommand.ISimuCommand);

        /** SimuCommand op. */
        public op: number;

        /** SimuCommand axis. */
        public axis: number[];

        /**
         * Creates a new SimuCommand instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SimuCommand instance
         */
        public static create(properties?: SimuCommand.ISimuCommand): SimuCommand.SimuCommand;

        /**
         * Encodes the specified SimuCommand message. Does not implicitly {@link SimuCommand.SimuCommand.verify|verify} messages.
         * @param message SimuCommand message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: SimuCommand.ISimuCommand, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SimuCommand message, length delimited. Does not implicitly {@link SimuCommand.SimuCommand.verify|verify} messages.
         * @param message SimuCommand message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: SimuCommand.ISimuCommand, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SimuCommand message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SimuCommand
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SimuCommand.SimuCommand;

        /**
         * Decodes a SimuCommand message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SimuCommand
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SimuCommand.SimuCommand;

        /**
         * Verifies a SimuCommand message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SimuCommand message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SimuCommand
         */
        public static fromObject(object: { [k: string]: any }): SimuCommand.SimuCommand;

        /**
         * Creates a plain object from a SimuCommand message. Also converts values to other types if specified.
         * @param message SimuCommand
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: SimuCommand.SimuCommand, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SimuCommand to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a SimuCommands. */
    interface ISimuCommands {

        /** SimuCommands ops */
        ops?: (SimuCommand.ISimuCommand[]|null);
    }

    /** Represents a SimuCommands. */
    class SimuCommands implements ISimuCommands {

        /**
         * Constructs a new SimuCommands.
         * @param [properties] Properties to set
         */
        constructor(properties?: SimuCommand.ISimuCommands);

        /** SimuCommands ops. */
        public ops: SimuCommand.ISimuCommand[];

        /**
         * Creates a new SimuCommands instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SimuCommands instance
         */
        public static create(properties?: SimuCommand.ISimuCommands): SimuCommand.SimuCommands;

        /**
         * Encodes the specified SimuCommands message. Does not implicitly {@link SimuCommand.SimuCommands.verify|verify} messages.
         * @param message SimuCommands message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: SimuCommand.ISimuCommands, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SimuCommands message, length delimited. Does not implicitly {@link SimuCommand.SimuCommands.verify|verify} messages.
         * @param message SimuCommands message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: SimuCommand.ISimuCommands, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SimuCommands message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SimuCommands
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SimuCommand.SimuCommands;

        /**
         * Decodes a SimuCommands message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SimuCommands
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): SimuCommand.SimuCommands;

        /**
         * Verifies a SimuCommands message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SimuCommands message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SimuCommands
         */
        public static fromObject(object: { [k: string]: any }): SimuCommand.SimuCommands;

        /**
         * Creates a plain object from a SimuCommands message. Also converts values to other types if specified.
         * @param message SimuCommands
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: SimuCommand.SimuCommands, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SimuCommands to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }
}

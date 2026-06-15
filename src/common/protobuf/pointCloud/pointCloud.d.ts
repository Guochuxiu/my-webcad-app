import * as $protobuf from 'protobufjs';
/** Namespace pointCloud. */
export namespace pointCloud {

    /** Properties of a PointCloud. */
    interface IPointCloud {

        /** PointCloud id */
        id?: (number|null);

        /** PointCloud data */
        data?: (number[]|null);

        /** PointCloud uniformColor */
        uniformColor?: (number|null);

        /** PointCloud colors */
        colors?: (number|null);
    }

    /** Represents a PointCloud. */
    class PointCloud implements IPointCloud {

        /**
         * Constructs a new PointCloud.
         * @param [properties] Properties to set
         */
        constructor(properties?: pointCloud.IPointCloud);

        /** PointCloud id. */
        public id: number;

        /** PointCloud data. */
        public data: number[];

        /** PointCloud uniformColor. */
        public uniformColor?: (number|null);

        /** PointCloud colors. */
        public colors?: (number|null);

        /** PointCloud colorSpec. */
        public colorSpec?: ('uniformColor'|'colors');

        /**
         * Creates a new PointCloud instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PointCloud instance
         */
        public static create(properties?: pointCloud.IPointCloud): pointCloud.PointCloud;

        /**
         * Encodes the specified PointCloud message. Does not implicitly {@link pointCloud.PointCloud.verify|verify} messages.
         * @param message PointCloud message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: pointCloud.IPointCloud, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PointCloud message, length delimited. Does not implicitly {@link pointCloud.PointCloud.verify|verify} messages.
         * @param message PointCloud message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: pointCloud.IPointCloud, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PointCloud message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PointCloud
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): pointCloud.PointCloud;

        /**
         * Decodes a PointCloud message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PointCloud
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): pointCloud.PointCloud;

        /**
         * Verifies a PointCloud message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PointCloud message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PointCloud
         */
        public static fromObject(object: { [k: string]: any }): pointCloud.PointCloud;

        /**
         * Creates a plain object from a PointCloud message. Also converts values to other types if specified.
         * @param message PointCloud
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: pointCloud.PointCloud, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PointCloud to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a PointClouds. */
    interface IPointClouds {

        /** PointClouds pointClouds */
        pointClouds?: (pointCloud.IPointCloud[]|null);
    }

    /** Represents a PointClouds. */
    class PointClouds implements IPointClouds {

        /**
         * Constructs a new PointClouds.
         * @param [properties] Properties to set
         */
        constructor(properties?: pointCloud.IPointClouds);

        /** PointClouds pointClouds. */
        public pointClouds: pointCloud.IPointCloud[];

        /**
         * Creates a new PointClouds instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PointClouds instance
         */
        public static create(properties?: pointCloud.IPointClouds): pointCloud.PointClouds;

        /**
         * Encodes the specified PointClouds message. Does not implicitly {@link pointCloud.PointClouds.verify|verify} messages.
         * @param message PointClouds message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: pointCloud.IPointClouds, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PointClouds message, length delimited. Does not implicitly {@link pointCloud.PointClouds.verify|verify} messages.
         * @param message PointClouds message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: pointCloud.IPointClouds, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PointClouds message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PointClouds
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): pointCloud.PointClouds;

        /**
         * Decodes a PointClouds message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PointClouds
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): pointCloud.PointClouds;

        /**
         * Verifies a PointClouds message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PointClouds message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PointClouds
         */
        public static fromObject(object: { [k: string]: any }): pointCloud.PointClouds;

        /**
         * Creates a plain object from a PointClouds message. Also converts values to other types if specified.
         * @param message PointClouds
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: pointCloud.PointClouds, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PointClouds to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }
}

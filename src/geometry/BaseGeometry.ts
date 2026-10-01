import { GeometryFormat } from "./GeometryFormat.ts";
import {VertexFormat} from "../VertexFormat.ts";
import type {IGeometry} from "ris-framework-api";

export class BaseGeometry implements IGeometry {

    /** @inheritdoc */
    public vertexCount: number = 0;

    /** @inheritdoc */
    public positions?: number[];

    /** @inheritdoc */
    public positionsFormat: VertexFormat = VertexFormat.FLOAT_32X3;

    /** @inheritdoc */
    public colors?: number[];

    /** @inheritdoc */
    public colorFormat: VertexFormat = VertexFormat.FLOAT_32X4;

    /** @inheritdoc */
    public textureCoords?: number[];

    /** @inheritdoc */
    public textureFormat: VertexFormat = VertexFormat.FLOAT_32X2;

    /** @inheritdoc */
    public normals?: number[];

    /** @inheritdoc */
    public normalsFormat: VertexFormat = VertexFormat.FLOAT_32X3;

    /** The indices of geometry. */
    public indices?: number[];

    /**
     * Pushes vertex data from source format to destination format.
     * @param index The index of the vertex to push.
     * @param source The source vertex data.
     * @param sourceFormat The vertex format of the source vertex data.
     * @param destination The destination array to push the vertex data to.
     * @param destinationFormat The vertex format of the destination vertex data.
     */
    private pushFormat(index: number,
        source: number[],
        sourceFormat: VertexFormat,
        destination: number[],
        destinationFormat: VertexFormat) {
        // This simply takes the source format and pushes new vertices to the destination format.
        // If the source format is less than destination, 0 is being pushed in its place.
        let _0 = 0;
        let _1 = 0;
        let _2 = 0;
        let _3 = 0;

        if (sourceFormat == VertexFormat.FLOAT_32) {
            _0 = source[index];
        }
        else if (sourceFormat == VertexFormat.FLOAT_32X2) {
            _0 = source[index * 2];
            _1 = source[index * 2 + 1];
        }
        else if (sourceFormat == VertexFormat.FLOAT_32X3) {
            _0 = source[index * 3];
            _1 = source[index * 3 + 1];
            _2 = source[index * 3 + 2];
        }
        else if (sourceFormat == VertexFormat.FLOAT_32X4) {
            _0 = source[index * 4];
            _1 = source[index * 4 + 1];
            _2 = source[index * 4 + 2];
            _3 = source[index * 4 + 3];
        }

        destination.push(_0);
        if (destinationFormat >= VertexFormat.FLOAT_32X2) {
            destination.push(_1);
        }

        if (destinationFormat >= VertexFormat.FLOAT_32X3) {
            destination.push(_2);
        }

        if (destinationFormat >= VertexFormat.FLOAT_32X4) {
            destination.push(_3);
        }
    }

    /**
     * Converts the geometry data to interleaved vertex data based on the specified geometry format.
     * @param format The geometry format to convert the geometry data to.
     * @returns The interleaved vertex data as an array of numbers.
     */
    public toInterleaved(format: GeometryFormat): number[] {
        let interleavedData: number[] = [];

        switch (format) {
            case GeometryFormat.POS3_TEXTURECOORDS2:
                {
                    let count = this.positions!.length / 3;

                    for (let i = 0; i < count; i++) {
                        this.pushFormat(i, this.positions!, VertexFormat.FLOAT_32X3, interleavedData, VertexFormat.FLOAT_32X3);
                        this.pushFormat(i, this.textureCoords!, VertexFormat.FLOAT_32X2, interleavedData, VertexFormat.FLOAT_32X2);
                    }
                    break;
                }
            case GeometryFormat.POS3_COLOR4_TEXTURECOORDS2:
                {
                    let count = this.positions!.length / 3;

                    for (let i = 0; i < count; i++) {
                        this.pushFormat(i, this.positions!, VertexFormat.FLOAT_32X3, interleavedData, VertexFormat.FLOAT_32X3);
                        this.pushFormat(i, this.colors!, VertexFormat.FLOAT_32X4, interleavedData, VertexFormat.FLOAT_32X4);
                        this.pushFormat(i, this.textureCoords!, VertexFormat.FLOAT_32X2, interleavedData, VertexFormat.FLOAT_32X2);
                    }
                    break;
                }
            case GeometryFormat.POS3_COLOR4_TEXTURECOORDS2_NORMAL3:
                {
                    let count = this.positions!.length / 3;

                    for (let i = 0; i < count; i++) {
                        this.pushFormat(i, this.positions!, VertexFormat.FLOAT_32X3, interleavedData, VertexFormat.FLOAT_32X3);
                        this.pushFormat(i, this.colors!, VertexFormat.FLOAT_32X4, interleavedData, VertexFormat.FLOAT_32X4);
                        this.pushFormat(i, this.textureCoords!, VertexFormat.FLOAT_32X2, interleavedData, VertexFormat.FLOAT_32X2);
                        this.pushFormat(i, this.normals!, VertexFormat.FLOAT_32X3, interleavedData, VertexFormat.FLOAT_32X3);
                    }
                    break;
                }
            case GeometryFormat.POS3_COLOR4_TEXTURECOORDS2_ALIGNED:
                {
                    let count = this.positions!.length / 3;

                    for (let i = 0; i < count; i++) {
                        this.pushFormat(i, this.positions!, VertexFormat.FLOAT_32X3, interleavedData, VertexFormat.FLOAT_32X4);
                        this.pushFormat(i, this.colors!, VertexFormat.FLOAT_32X4, interleavedData, VertexFormat.FLOAT_32X4);
                        this.pushFormat(i, this.textureCoords!, VertexFormat.FLOAT_32X2, interleavedData, VertexFormat.FLOAT_32X4);
                    }
                    break;
                }
        }


        return interleavedData;
    }
}
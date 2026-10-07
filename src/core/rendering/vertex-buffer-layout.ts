import { VertexStepMode } from "../../api/index.ts";
import type {  VertexAttribute } from "./vertex-attribute";
import {VertexFormat} from "../../VertexFormat.ts";

/**
 * Describes the layout of a vertex buffer, including the stride, step mode, and attributes.
 */
export class VertexBufferLayout {
    /**
     * Stride in bytes (size of one vertex)
     */
    arrayStride: number;

    /**
     * How to step through the buffer
     */
    stepMode: VertexStepMode;

    /**
     * Vertex attributes
     */
    attributes: VertexAttribute[] = [];

    constructor(
        arrayStride: number,
        stepMode: VertexStepMode,
        attributes: VertexAttribute[]
    ) {
        this.arrayStride = arrayStride;
        this.stepMode = stepMode;
        this.attributes = attributes;
    }

    // =========================
    // Static helpers
    // =========================

    static createFloat3Float2Layout(): VertexBufferLayout {
        const floatSize = 4;

        return new VertexBufferLayout(
            (3 + 2) * floatSize,
            VertexStepMode.VERTEX,
            [
                {
                    format: VertexFormat.FLOAT_32X3,
                    offset: 0,
                    shaderLocation: 0,
                },
                {
                    format: VertexFormat.FLOAT_32X2,
                    offset: 3 * floatSize,
                    shaderLocation: 1,
                },
            ]
        );
    }

    static createFloat3Float4Float2Layout(): VertexBufferLayout {
        const floatSize = 4;

        return new VertexBufferLayout(
            (3 + 4 + 2) * floatSize,
            VertexStepMode.VERTEX,
            [
                {
                    format: VertexFormat.FLOAT_32X3,
                    offset: 0,
                    shaderLocation: 0,
                },
                {
                    format: VertexFormat.FLOAT_32X4,
                    offset: 3 * floatSize,
                    shaderLocation: 1,
                },
                {
                    format: VertexFormat.FLOAT_32X2,
                    offset: (3 + 4) * floatSize,
                    shaderLocation: 2,
                },
            ]
        );
    }
}
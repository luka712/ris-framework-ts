import { WebGlUtilities } from "../utilities/WebGlUtilities.ts";
import type { WebGlGraphicsDevice } from "../WebGlGraphicsDevice.ts";
import {AlignUtilities, type BufferUsage, type IFramework, type IUniformBuffer} from "../../api/index.ts";

/**
 * A WebGL uniform buffer.
 */
export class WebGlUniformBuffer implements IUniformBuffer {

    private readonly _gl: WebGL2RenderingContext;
    private _byteSize: number = 0;
    private _data: Float32Array;

    /**
     * The constructor.
     * @param framework The framework.
     * @param dataOrByteSize The data or it's byte size.
     * @param bufferUsage The buffer usage.
     * @param label The label to use.
     */
    public constructor(framework: IFramework,
                       dataOrByteSize: ArrayLike<number> | number,
                       bufferUsage: BufferUsage,
                       label?: string) {

        this._gl = (framework.graphicsDevice as WebGlGraphicsDevice).gl;
        this.usage = bufferUsage;
        this.label = label;

        if(typeof dataOrByteSize === "number") {
            this._data = new Float32Array(dataOrByteSize);
        }
        else {
            this._data = new Float32Array(AlignUtilities.alignArray(dataOrByteSize, 4));
        }

        this._byteSize = this._data.byteLength;

    }


    /** 
     * The native WebGL buffer object that is used to store the uniform data. 
     */
    public glBuffer: WebGLBuffer | null = null;

    /** @inheritdoc */
    public readonly label?: string;

    /** @inheritdoc */
    public get byteSize(): number {
        return this._byteSize;
    }

    /** @inheritdoc */
    public readonly usage: BufferUsage;

    /** @inheritdoc */
    public initialize(): void {

        this.glBuffer = WebGlUtilities.buffer.createUniformBuffer(
            this._gl, this._data, this.usage, this.label);
    }


    /** @inheritdoc */
    public write(data: Float32Array, offset: number = 0, length: number = 0): void {
        const count = length > 0 ? length : data.length - offset;
        this._data.set(data.subarray(offset, offset + count), offset);
    }

    /**
     * Writes a single float into the CPU-side data.
     * @param value The value.
     * @param offset The offset in floats.
     * @ai-generated
     */
    public writeSingle(value: number, offset: number): void {
        this._data[offset] = value;
    }

    /**
     * Uploads the CPU-side data to the GPU buffer.
     * @ai-generated
     */
    public update(): void {
        this._gl.bindBuffer(this._gl.UNIFORM_BUFFER, this.glBuffer);
        this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, 0, this._data);
        this._gl.bindBuffer(this._gl.UNIFORM_BUFFER, null);
    }

    /** @inheritdoc */
    public dispose(): void {
        if (this.glBuffer) {
            this._gl.deleteBuffer(this.glBuffer);
            this.glBuffer = null;
        }
    }
}
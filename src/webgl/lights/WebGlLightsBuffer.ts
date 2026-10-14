import {
    AmbientLight,
    BufferUsage,
    type DirectionalLight,
    type IFramework,
    type IUniformBuffer,
    type LightsBuffer,
    type LightsBufferDescriptor,
    DEFAULT_DIRECTIONAL_LIGHTS_COUNT,
} from "../../api/index.ts";

/**
 * The WebGL lights buffer. Owns a std140 uniform buffer for the `LightsBuffer` block.
 * See {@link LightsBuffer} for the layout.
 */
export class WebGlLightsBuffer implements LightsBuffer {

    /** Floats for the ambient light: vec3 padded to 16 bytes. */
    public static readonly AMBIENT_FLOAT_COUNT = 4;

    /** Floats per directional light: two vec3, each padded to 16 bytes. */
    public static readonly DIRECTIONAL_LIGHT_FLOAT_COUNT = 8;

    private readonly _buffer: IUniformBuffer;
    private readonly _data: number[];
    private readonly _uploaded: number[];
    private _disposed = false;

    /**
     * The constructor.
     * @param framework The framework, used to create the uniform buffer.
     * @param descriptor The optional initial lights and directional light count.
     */
    public constructor(framework: IFramework, descriptor?: LightsBufferDescriptor) {
        this.ambientLight = descriptor?.ambientLight ?? new AmbientLight(0);
        this.directionalLights = descriptor?.directionalLights ?? [];
        this.maxDirectionalLights = descriptor?.maxDirectionalLights ?? DEFAULT_DIRECTIONAL_LIGHTS_COUNT;

        const floatCount = WebGlLightsBuffer.AMBIENT_FLOAT_COUNT
            + this.maxDirectionalLights * WebGlLightsBuffer.DIRECTIONAL_LIGHT_FLOAT_COUNT;
        this._data = new Array<number>(floatCount).fill(0);
        this._writeData();
        this._uploaded = [...this._data];
        this._buffer = framework.bufferFactory.createUniformBuffer(this._data, BufferUsage.UNIFORM | BufferUsage.COPY_DST);
    }

    /** @inheritDoc */
    public ambientLight: AmbientLight;

    /** @inheritDoc */
    public directionalLights: DirectionalLight[];

    /** @inheritDoc */
    public readonly maxDirectionalLights: number;

    /** @inheritDoc */
    public get buffer(): IUniformBuffer {
        return this._buffer;
    }

    /** @inheritDoc */
    public update(): void {
        this._writeData();
        if (!this._hasChanged()) {
            return;
        }

        this._buffer.update(this._data);
        for (let i = 0; i < this._data.length; i++) {
            this._uploaded[i] = this._data[i];
        }
    }

    /** @inheritDoc */
    public dispose(): void {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this._buffer.dispose();
    }

    private _hasChanged(): boolean {
        for (let i = 0; i < this._data.length; i++) {
            if (this._data[i] !== this._uploaded[i]) {
                return true;
            }
        }
        return false;
    }

    private _writeData(): void {
        const ambient = this.ambientLight.value;
        this._data[0] = ambient.r;
        this._data[1] = ambient.g;
        this._data[2] = ambient.b;
        this._data[3] = 0; // std140 padding for vec3.

        for (let i = 0; i < this.maxDirectionalLights; i++) {
            const offset = WebGlLightsBuffer.AMBIENT_FLOAT_COUNT + i * WebGlLightsBuffer.DIRECTIONAL_LIGHT_FLOAT_COUNT;
            const light = this.directionalLights[i];

            // vec3 light
            this._data[offset] = light ? light.value.r : 0;
            this._data[offset + 1] = light ? light.value.g : 0;
            this._data[offset + 2] = light ? light.value.b : 0;
            this._data[offset + 3] = 0;

            // vec3 direction
            this._data[offset + 4] = light ? light.direction[0] : 0;
            this._data[offset + 5] = light ? light.direction[1] : 0;
            this._data[offset + 6] = light ? light.direction[2] : 0;
            this._data[offset + 7] = 0;
        }
    }
}

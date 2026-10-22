import {
    AmbientLight,
    BufferUsage,
    DirectionalLight,
    PointLight,
    type Color,
    DEFAULT_POINT_LIGHTS_COUNT,
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

    /** Floats per point light: vec3 light + float constant, vec3 position + float linear, float quadratic, padded to 48 bytes. */
    public static readonly POINT_LIGHT_FLOAT_COUNT = 12;

    private _ambientLight!: AmbientLight;
    private readonly _buffer: IUniformBuffer;
    private readonly _data: number[];
    private readonly _uploaded: number[];
    private readonly _directionalLights: DirectionalLight[] = [];
    private readonly _pointLights: PointLight[] = [];
    private _disposed = false;

    /**
     * The constructor.
     * @param framework The framework, used to create the uniform buffer.
     * @param descriptor The optional initial lights and directional light count.
     */
    public constructor(framework: IFramework, descriptor?: LightsBufferDescriptor) {
        this.ambientLight = descriptor?.ambientLight ?? new AmbientLight();
        this.maxDirectionalLights = descriptor?.maxDirectionalLights ?? DEFAULT_DIRECTIONAL_LIGHTS_COUNT;
        this.maxPointLights = descriptor?.maxPointLights ?? DEFAULT_POINT_LIGHTS_COUNT;
        for (const light of descriptor?.directionalLights ?? []) {
            this.add(light);
        }
        for (const light of descriptor?.pointLights ?? []) {
            this.add(light);
        }

        const floatCount = WebGlLightsBuffer.AMBIENT_FLOAT_COUNT
            + this.maxDirectionalLights * WebGlLightsBuffer.DIRECTIONAL_LIGHT_FLOAT_COUNT
            + this.maxPointLights * WebGlLightsBuffer.POINT_LIGHT_FLOAT_COUNT;
        this._data = new Array<number>(floatCount).fill(0);
        this._writeData();
        this._uploaded = [...this._data];
        this._buffer = framework.bufferFactory.createUniformBuffer(this._data, BufferUsage.UNIFORM | BufferUsage.COPY_DST);
    }

    /** @inheritDoc */
    public get ambientLight(): AmbientLight {
        return this._ambientLight;
    }

    /** @inheritDoc */
    public set ambientLight(ambientLight: AmbientLight) {
        this._ambientLight = ambientLight;
    }

    /** @inheritDoc */
    public get directionalLights(): readonly DirectionalLight[] {
        return this._directionalLights;
    }

    /** @inheritDoc */
    public readonly maxDirectionalLights: number;

    /** @inheritDoc */
    public get pointLights(): readonly PointLight[] {
        return this._pointLights;
    }

    /** @inheritDoc */
    public add(light: DirectionalLight | PointLight): void {
        const [list, max, kind] = this._listFor(light);
        if (list.includes(light)) {
            return;
        }
        if (list.length >= max) {
            throw new Error(`LightsBuffer: cannot add ${kind} light ${light.id}; all ${max} ${kind} light slots are in use (max${kind === "directional" ? "Directional" : "Point"}Lights = ${max}).`);
        }
        list.push(light);
    }

    /** @inheritDoc */
    public remove(light: DirectionalLight | PointLight): boolean {
        const [list] = this._listFor(light);
        const index = list.indexOf(light);
        if (index < 0) {
            return false;
        }
        list.splice(index, 1);
        return true;
    }

    /** @inheritDoc */
    public readonly maxPointLights: number;

    /** @inheritDoc */
    public get buffer(): IUniformBuffer {
        return this._buffer;
    }

    /** @inheritDoc */
    public update(): void {

        // The ambient light (also a newly assigned one) is written with the rest; only changed data is uploaded.
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

    private _writeAmbientLight() {
        this._writeColor(0, this.ambientLight.color, this.ambientLight.intensity);
        this._data[3] = 0; // std140 padding for vec3.
    }

    private _listFor(light: DirectionalLight | PointLight): [(DirectionalLight | PointLight)[], number, string] {
        if (light instanceof DirectionalLight) {
            return [this._directionalLights, this.maxDirectionalLights, "directional"];
        }
        if (light instanceof PointLight) {
            return [this._pointLights, this.maxPointLights, "point"];
        }
        throw new Error("LightsBuffer: expected a DirectionalLight or PointLight instance.");
    }

    /** Writes color * intensity as vec3 at offset (the fourth float is left to the caller). */
    private _writeColor(offset: number, color: Color | undefined, intensity: number): void {
        this._data[offset] = color ? color.r * intensity : 0;
        this._data[offset + 1] = color ? color.g * intensity : 0;
        this._data[offset + 2] = color ? color.b * intensity : 0;
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
        // Written every time, so in-place colour and intensity edits are detected by _hasChanged().
        this._writeAmbientLight();

        for (let i = 0; i < this.maxDirectionalLights; i++) {
            const offset = WebGlLightsBuffer.AMBIENT_FLOAT_COUNT + i * WebGlLightsBuffer.DIRECTIONAL_LIGHT_FLOAT_COUNT;
            const light = this._directionalLights[i];

            // vec3 light (colour * intensity)
            this._writeColor(offset, light?.color, light?.intensity ?? 0);
            this._data[offset + 3] = 0;

            // vec3 direction
            this._data[offset + 4] = light ? light.direction[0] : 0;
            this._data[offset + 5] = light ? light.direction[1] : 0;
            this._data[offset + 6] = light ? light.direction[2] : 0;
            this._data[offset + 7] = 0;
        }

        const pointLightsStart = WebGlLightsBuffer.AMBIENT_FLOAT_COUNT
            + this.maxDirectionalLights * WebGlLightsBuffer.DIRECTIONAL_LIGHT_FLOAT_COUNT;
        for (let i = 0; i < this.maxPointLights; i++) {
            const offset = pointLightsStart + i * WebGlLightsBuffer.POINT_LIGHT_FLOAT_COUNT;
            const light = this._pointLights[i];

            // vec3 light (colour * intensity), float constant
            this._writeColor(offset, light?.color, light?.intensity ?? 0);
            // An empty slot keeps constant at 1 so the shader never divides by zero.
            this._data[offset + 3] = light ? light.constant : 1;

            // vec3 position, float linear
            this._data[offset + 4] = light ? light.position[0] : 0;
            this._data[offset + 5] = light ? light.position[1] : 0;
            this._data[offset + 6] = light ? light.position[2] : 0;
            this._data[offset + 7] = light ? light.linear : 0;

            // float quadratic, then padding to the 16-byte struct size
            this._data[offset + 8] = light ? light.quadratic : 0;
            this._data[offset + 9] = 0;
            this._data[offset + 10] = 0;
            this._data[offset + 11] = 0;
        }
    }
}

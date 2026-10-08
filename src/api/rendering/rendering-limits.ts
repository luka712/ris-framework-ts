export class RenderingLimits {

    /**
     * The constructor.
     * @param _maximumAnisotropyLevel The maximum anisotropic filtering level.
     */
    constructor(private _maximumAnisotropyLevel: number) {

    }

    /**
     * The maximum anisotropy level supported by the renderer.
     * This value is typically determined by the graphics hardware and driver capabilities.
     * It indicates the highest level of anisotropic filtering that can be applied to textures,
     * which can improve the visual quality of textures when viewed at oblique angles.
     */
    public get maximumAnisotropyLevel() : number {
        return this._maximumAnisotropyLevel;
    }
}
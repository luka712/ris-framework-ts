/**
 * The utility class for WebGL anisotropic filtering operations.
 */
export class WebGLFilterAnisotropicUtilities {
    /**
     * The max anisotropy extension string.
     */
    private MAX_ANISOTROPY_EXT: string = "EXT_texture_filter_anisotropic";

    private _extension: any;

    /**
     * Gets the max anisotropy.
     * @param gl The WebGL2 rendering context.
     * @returns The maximum supported level of anisotropic filtering. <c>0</c> if not supported. 
     */
    public getMaxAnisotropy(gl: WebGL2RenderingContext): number {
        this._extension = gl.getExtension(this.MAX_ANISOTROPY_EXT);

        if (this._extension) {
            return gl.getParameter(this._extension.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
        }

        return 0;
    }

    /**
     * Sets the anisotropy filtering level for texture.
     * @param gl The WebGL2 rendering context.
     * @param texture The WebGL texture.
     * @param anisotropy The level of anisotropic filtering
     */
    public setAnisotropy(gl: WebGL2RenderingContext, texture: WebGLTexture, anisotropy: number) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameterf(gl.TEXTURE_2D, this._extension.MAX_TEXTURE_MAX_ANISOTROPY_EXT, anisotropy);
    }
}

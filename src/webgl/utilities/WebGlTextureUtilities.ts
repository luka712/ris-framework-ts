import {WebGlConverter} from "./WebGlConverter.ts";
import {TextureFormat} from "ris-framework-api";
import {vec2} from "gl-matrix";

/**
 * The utilities for working with WebGL textures.
 */
export class WebGlTextureUtilities {

    /**
     * Creates a 2D texture.
     * @param gl The WebGL rendering context.
     * @param width The width of the texture.
     * @param height The height of the texture.
     * @param data The texture data. If null, an uninitialized texture will be created.
     * @param textureFormat The format of the texture. If not specified, BGRA_8_UNORM will be used.
     * @param useMipMaps True to generate mipmaps for the texture, false otherwise. By default, it is false.
     * @param anisotropy The level of anisotropic filtering to use when sampling the texture. A value of 1 means no anisotropic filtering, while higher values (e.g., 4, 8, 16) indicate increasing levels of anisotropic filtering. By default, it is 1 (no anisotropic filtering).
     * @param label The label for the texture. This can be used for debugging purposes to identify the texture in graphics debuggers.
     * @returns The created WebGL texture.
     */
    public createTexture2D(
        gl: WebGL2RenderingContext,
        width: number, height: number,
        data: Uint8Array[] | HTMLImageElement[] | null = null,
        textureFormat = TextureFormat.RGBA_8_UNORM,
        useMipMaps = false,
        anisotropy = 1.0,
        label: string | null = null
    ): WebGLTexture {

        const texture = gl.createTexture();

        if (label != null) {
            (texture as any).__SPECTOR_Metadata = {
                name: label,
            };
        }

        gl.bindTexture(gl.TEXTURE_2D, texture);

        const internalFormat = WebGlConverter.convertInternalFormat(gl, textureFormat);
        const format = WebGlConverter.convertToPixelFormat(gl, textureFormat);

        let mipLevels = data?.length ?? 1;
        // We can generate only if mip levels are not provided.
        const generateMipMaps = useMipMaps && mipLevels <= 1;
        if (generateMipMaps) {
            mipLevels = Math.floor(Math.log2(Math.max(width, height))) + 1;
        }

        gl.texStorage2D(gl.TEXTURE_2D, mipLevels, internalFormat, width, height);

        if(data) {
            for (let i = 0; i < mipLevels; i++) {

                const mipLevelData = data[i];
                const levelWidth = width >> i;
                const levelHeight = height >> i;

                if (mipLevelData instanceof HTMLImageElement) {
                    gl.texSubImage2D(gl.TEXTURE_2D, i, 0, 0, levelWidth, levelHeight, format, gl.UNSIGNED_BYTE, mipLevelData);
                } else if (mipLevelData instanceof Uint8Array) {
                    gl.texSubImage2D(gl.TEXTURE_2D, i, 0, 0, levelWidth, levelHeight, format, gl.UNSIGNED_BYTE, mipLevelData);
                } else if (mipLevelData) {
                    gl.texSubImage2D(gl.TEXTURE_2D, i, 0, 0, levelWidth, levelHeight, format, gl.UNSIGNED_BYTE, mipLevelData);
                }
                else if(!mipLevelData) {
                    // If not must be empty array, so we can safely ignore it.
                }
                else {
                    throw new Error("unsupported data type");
                }
            }
        }

        // Generate mipmaps.
        if (generateMipMaps) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        // Set anisotropy.
        if (anisotropy > 1.0) {
            throw new Error("Not implemented yet.");
            //OpenGLESUtilities.Anisotropy.SetAnisotropy(gl, texture, anisotropy);
        }

        return texture;
    }

    /**
     * Creates a compressed 2D texture.
     * @param gl The WebGL rendering context.
     * @param dimension The dimensions of the texture.
     * @param blockSize The block size of a compressed format.
     * @param data The texture data. If null, an uninitialized texture will be created.
     * @param textureFormat The format of the texture. If not specified, BGRA_8_UNORM will be used.
     * @param anisotropy The level of anisotropic filtering to use when sampling the texture. A value of 1 means no anisotropic filtering, while higher values (e.g., 4, 8, 16) indicate increasing levels of anisotropic filtering. By default, it is 1 (no anisotropic filtering).
     * @param label The label for the texture. This can be used for debugging purposes to identify the texture in graphics debuggers.
     * @returns The created WebGL texture.
     */
    public createCompressedTexture2D(
        gl: WebGL2RenderingContext,
        dimension: vec2, _blockSize: vec2,
        data: Uint8Array[] | null = null,
        label: string | null = null,
        textureFormat = TextureFormat.RGBA_8_UNORM,
        anisotropy = 1.0,
    ): WebGLTexture {

        const baseWidth = dimension[0];
        const baseHeight = dimension[1];
        const mipLevels = data?.length ?? 1;

        const texture = gl.createTexture();

        if (label != null) {
            (texture as any).__SPECTOR_Metadata = {
                name: label,
            };
        }

        gl.bindTexture(gl.TEXTURE_2D, texture);

        const internalFormat = WebGlConverter.convertInternalFormat(gl, textureFormat);

        gl.texStorage2D(gl.TEXTURE_2D, mipLevels, internalFormat, baseWidth, baseHeight);

        if(data && data.length > 0) {

            let width = baseWidth;
            let height = baseHeight;

            for (let i = 0; i < mipLevels; i++) {

                const mipLevelData = data[i];

                if (mipLevelData instanceof Uint8Array) {
                    gl.compressedTexSubImage2D(gl.TEXTURE_2D, i,  0, 0, width, height, internalFormat, mipLevelData, 0);
                } else {
                    throw new Error("unsupported data type");
                }

                width /= 2;
                height /= 2;
            }
        }

        // Generate mipmaps.
        if (mipLevels > 1) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        // Set anisotropy.
        if (anisotropy > 1.0) {
            throw new Error("Not implemented yet.");
            //OpenGLESUtilities.Anisotropy.SetAnisotropy(gl, texture, anisotropy);
        }

        return texture;
    }
}

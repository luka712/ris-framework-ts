import {WebGlConverter} from "./WebGlConverter.ts";
import {TextureFormat, TextureUtilities} from "../../api";
import {vec2} from "gl-matrix";
import {WebGlUtilities} from "./WebGlUtilities.ts";

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
     * @param textureFormat The format of the texture. If not specified, RGBA8_UNORM will be used.
     * @param useMipMaps True to generate mipmaps for the texture, false otherwise. By default, it is false.
     * @param anisotropy The level of anisotropic filtering to use when sampling the texture. A value of 1 means no anisotropic filtering, while higher values (e.g., 4, 8, 16) indicate increasing levels of anisotropic filtering. By default, it is 1 (no anisotropic filtering).
     * Values above 1 are not implemented yet and throw.
     * @param label The label for the texture. This can be used for debugging purposes to identify the texture in graphics debuggers.
     * @returns The created WebGL texture.
     */
    public createTexture2D(
        gl: WebGL2RenderingContext,
        width: number, height: number,
        data: Uint8Array[] | HTMLImageElement[] | null = null,
        textureFormat = TextureFormat.RGBA8_UNORM,
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
            mipLevels = TextureUtilities.mipLevels(width, height);
        }

        gl.texStorage2D(gl.TEXTURE_2D, mipLevels, internalFormat, width, height);

        if (data) {
            for (let i = 0; i < mipLevels; i++) {

                const mipLevelData = data[i];
                // Each mip is at least 1x1 (non-square textures reach 1 on one side first).
                const levelWidth = Math.max(1, width >> i);
                const levelHeight = Math.max(1, height >> i);

                if (mipLevelData) {
                    gl.texSubImage2D(gl.TEXTURE_2D,
                        i,
                        0, 0,
                        levelWidth, levelHeight,
                        format, gl.UNSIGNED_BYTE, mipLevelData as any);
                }
            }
        }

        // Generate mipmaps.
        if (generateMipMaps) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        // Set anisotropy.
        if (anisotropy > 1.0) {
            throw new Error(`WebGlTextureUtilities.createTexture2D: anisotropic filtering (anisotropy ${anisotropy}) is not implemented for WebGL2 yet.`);
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
     * @param label The label for the texture. This can be used for debugging purposes to identify the texture in graphics debuggers.
     * @param textureFormat The format of the texture. If not specified, RGBA8_UNORM will be used.
     * @param anisotropy The level of anisotropic filtering to use when sampling the texture. A value of 1 means no anisotropic filtering, while higher values (e.g., 4, 8, 16) indicate increasing levels of anisotropic filtering. By default, it is 1 (no anisotropic filtering).
     * Values above 1 are not implemented yet and throw.
     * @returns The created WebGL texture.
     * @throws Error when a mip level is not a Uint8Array, or when WebGL reports an error after the upload.
     */
    public createCompressedTexture2D(
        gl: WebGL2RenderingContext,
        dimension: vec2, blockSize: vec2,
        data: Uint8Array[] | null = null,
        label: string | null = null,
        textureFormat = TextureFormat.RGBA8_UNORM,
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
        const useTexStorage = baseWidth % blockSize[0] == 0 && baseHeight % blockSize[1] == 0;

        if (useTexStorage) {
            gl.texStorage2D(gl.TEXTURE_2D, mipLevels, internalFormat, baseWidth, baseHeight);
        }

        // Texture data might not be aligned to 4. So disable it.
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        if (data && data.length > 0) {

            let width = baseWidth;
            let height = baseHeight;

            for (let i = 0; i < mipLevels; i++) {

                const mipLevelData = data[i];

                if (mipLevelData instanceof Uint8Array) {
                    if (useTexStorage) {
                        gl.compressedTexSubImage2D(gl.TEXTURE_2D, i, 0, 0, width, height, internalFormat, mipLevelData, 0);
                    } else {
                        // const alignedWidth = AlignUtilities.align(width, blockSize[0]);
                        // const alignedHeight = AlignUtilities.align(height, blockSize[1]);
                        gl.compressedTexImage2D(gl.TEXTURE_2D, i, internalFormat, width, height, 0, mipLevelData, 0);
                    }
                } else {
                    throw new Error(`WebGlTextureUtilities.createCompressedTexture2D: mip level ${i} of '${label ?? "unlabeled"}' must be a Uint8Array; got ${(mipLevelData as object)?.constructor?.name ?? mipLevelData}.`);
                }

                width = Math.max(1, Math.floor(width / 2));
                height = Math.max(1, Math.floor(height / 2));
            }
        }

        // Restore to default.
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Set anisotropy.
        if (anisotropy > 1.0) {
            throw new Error(`WebGlTextureUtilities.createCompressedTexture2D: anisotropic filtering (anisotropy ${anisotropy}) is not implemented for WebGL2 yet.`);
            //OpenGLESUtilities.Anisotropy.SetAnisotropy(gl, texture, anisotropy);
        }

        const error = gl.getError();
        if (error != gl.NO_ERROR) {
            const errorStr = `WebGlTextureUtilities.createCompressedTexture2D: WebGL error ${WebGlUtilities.error.errorToStr(error)} while creating '${label ?? "unlabeled"}' (${textureFormat}, ${baseWidth}x${baseHeight}, ${mipLevels} mip levels).`;
            console.error(errorStr);
            throw new Error(errorStr);
        }

        return texture;
    }

    /**
     * Creates a 2D texture array.
     * @param gl The WebGL rendering context.
     * @param width The width of the texture.
     * @param height The height of the texture.
     * @param layers The number of layers.
     * @param data The texture data. If null, an uninitialized texture will be created. Data is organized per layer, and each layer has mip levels.
     * It may have fewer entries than `layers` (the remaining layers stay uninitialized), but not more.
     * @param textureFormat The format of the texture. If not specified, RGBA8_UNORM will be used.
     * @param useMipMaps True to generate mipmaps for the texture, false otherwise. By default, it is false.
     * @param anisotropy The level of anisotropic filtering to use when sampling the texture. A value of 1 means no anisotropic filtering, while higher values (e.g., 4, 8, 16) indicate increasing levels of anisotropic filtering. By default, it is 1 (no anisotropic filtering).
     * Values above 1 are not implemented yet and throw.
     * @param label The label for the texture. This can be used for debugging purposes to identify the texture in graphics debuggers.
     * @returns The created WebGL texture.
     * @throws Error when `data` has more layer entries than `layers`, or mipmap generation is requested for a format other than RGBA8_UNORM or RGBA8_UNORM_SRGB.
     */
    public createTexture2DArray(
        gl: WebGL2RenderingContext,
        width: number, height: number, layers: number,
        data: Uint8Array[][] | HTMLImageElement[][] | null = null,
        textureFormat = TextureFormat.RGBA8_UNORM,
        useMipMaps = false,
        anisotropy = 1.0,
        label: string | null = null
    ): WebGLTexture {

        // Checked before any GL object is created.
        if (data && data.length > layers) {
            throw new Error(`WebGlTextureUtilities.createTexture2DArray: '${label ?? "unlabeled"}' has data for ${data.length} layers, but the texture array has ${layers} layers.`);
        }
        // generateMipmap needs a color-renderable, filterable format.
        if (useMipMaps && TextureUtilities.maxMipLevels(data ?? undefined) <= 1
            && textureFormat != TextureFormat.RGBA8_UNORM && textureFormat != TextureFormat.RGBA8_UNORM_SRGB) {
            throw new Error(`WebGlTextureUtilities.createTexture2DArray: '${label ?? "unlabeled"}' requests mipmap generation for ${textureFormat}; ` +
                `WebGL2 can only generate mipmaps here for RGBA8_UNORM and RGBA8_UNORM_SRGB.`);
        }

        const texture = gl.createTexture();

        if (label != null) {
            (texture as any).__SPECTOR_Metadata = {
                name: label,
            };
        }

        gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);

        const internalFormat = WebGlConverter.convertInternalFormat(gl, textureFormat);
        const format = WebGlConverter.convertToPixelFormat(gl, textureFormat);

        let mipLevels =1;
        const hasData = !!data;
        if (hasData) {
                // Now find max mip
                mipLevels =  TextureUtilities.maxMipLevels(data);
            
        }

        // We can generate only if mip levels are not provided.
        const generateMipMaps = useMipMaps && mipLevels <= 1;
        if (generateMipMaps) {
            mipLevels = TextureUtilities.mipLevels(width, height);
        }

        gl.texStorage3D(gl.TEXTURE_2D_ARRAY, mipLevels, internalFormat, width, height, layers);

        if (hasData) {
            for (let layer = 0; layer < data.length; layer++) {

                for (let mipLevel = 0; mipLevel < data[layer].length; mipLevel++) {

                    const mipLevelData = data[layer][mipLevel];
                    const levelWidth = Math.max(1, width >> mipLevel);
                    const levelHeight = Math.max(1, height >> mipLevel);

                    if (mipLevelData) {
                        gl.texSubImage3D(gl.TEXTURE_2D_ARRAY,
                            mipLevel,
                            0, 0, layer,
                            levelWidth, levelHeight,
                            1,
                            format, gl.UNSIGNED_BYTE, mipLevelData as any);
                    }
                }
            }
        }

        // Generate mipmaps.
        if (generateMipMaps) {
            gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
        }

        // Set anisotropy.
        if (anisotropy > 1.0) {
            throw new Error(`WebGlTextureUtilities.createTexture2DArray: anisotropic filtering (anisotropy ${anisotropy}) is not implemented for WebGL2 yet.`);
            //OpenGLESUtilities.Anisotropy.SetAnisotropy(gl, texture, anisotropy);
        }

        return texture;
    }

    /**
     * Creates a block-compressed 2D texture array (`TEXTURE_2D_ARRAY`) and uploads every given layer and mip level.
     * Supports the BC (S3TC, BPTC), ETC2 and ASTC formats; the caller checks that the device supports the format.
     * PVRTC can't be used: WebGL only allows it on `TEXTURE_2D`.
     *
     * When the base size is a whole number of blocks, the storage is allocated with `texStorage3D` and each layer is uploaded
     * with `compressedTexSubImage3D`; layers or levels without data stay uninitialized.
     * Otherwise (e.g. a 6x6 BC7 texture, which `texStorage3D` rejects) every level is uploaded with `compressedTexImage3D`,
     * missing layers are zero-filled, and `TEXTURE_MAX_LEVEL` is set to the last level.
     * The bytes of a level are counted in whole blocks: `ceil(width / blockWidth) * ceil(height / blockHeight) * bytesPerBlock` per layer.
     * The mip level count is taken from `data` with {@link TextureUtilities.maxMipLevels}, as for uncompressed arrays.
     * @param gl The WebGL rendering context.
     * @param width The width of one layer in pixels. Must be greater than 0.
     * @param height The height of one layer in pixels. Must be greater than 0.
     * @param layers The number of layers. Must be greater than 0.
     * @param blockSize The block size [width, height] in pixels.
     * @param data The data per layer, per mip level (`data[layer][mipLevel]`). By default, null (one uninitialized mip level).
     * It may have fewer entries than `layers`, but not more.
     * @param textureFormat The compressed texture format.
     * @param label The label, used by graphics debuggers and in error messages. By default, null.
     * @returns The created WebGL texture.
     * @throws Error when the format is not compressed or is PVRTC, `data` has more layer entries than `layers`,
     * a level is not a Uint8Array or is shorter than its block size, or WebGL reports an error after the upload.
     */
    public createCompressedTexture2DArray(
        gl: WebGL2RenderingContext,
        width: number, height: number, layers: number,
        blockSize: vec2,
        data: Uint8Array[][] | null = null,
        textureFormat: TextureFormat,
        label: string | null = null,
    ): WebGLTexture {

        const name = label ?? "unlabeled";
        // Checked before any GL object is created.
        if (!TextureUtilities.isCompressedTextureFormat(textureFormat)) {
            throw new Error(`WebGlTextureUtilities.createCompressedTexture2DArray: '${name}' has uncompressed format ${textureFormat}; use createTexture2DArray instead.`);
        }
        if (TextureUtilities.isPvrtcFormat(textureFormat)) {
            throw new Error(`WebGlTextureUtilities.createCompressedTexture2DArray: '${name}' has format ${textureFormat}; ` +
                `WebGL only supports PVRTC on TEXTURE_2D, not TEXTURE_2D_ARRAY. Use a 2D texture, or a BC, ETC2 or ASTC format for the array.`);
        }
        if (!(layers > 0)) {
            throw new Error(`WebGlTextureUtilities.createCompressedTexture2DArray: '${name}' has ${layers} layers; the layer count must be greater than 0.`);
        }
        if (data && data.length > layers) {
            throw new Error(`WebGlTextureUtilities.createCompressedTexture2DArray: '${name}' has data for ${data.length} layers, but the texture array has ${layers} layers.`);
        }

        const mipLevels = TextureUtilities.maxMipLevels(data ?? undefined);
        // Bytes of one layer of each level, in whole blocks.
        const levelByteLengths: number[] = [];
        for (let level = 0; level < mipLevels; level++) {
            levelByteLengths.push(TextureUtilities.getVRamSize(textureFormat, Math.max(1, width >> level), Math.max(1, height >> level)));
        }
        if (data) {
            for (let layer = 0; layer < data.length; layer++) {
                const levels = data[layer] ?? [];
                for (let level = 0; level < levels.length; level++) {
                    const levelData = levels[level];
                    if (!(levelData instanceof Uint8Array)) {
                        throw new Error(`WebGlTextureUtilities.createCompressedTexture2DArray: '${name}' layer ${layer} mip ${level} must be a Uint8Array; got ${(levelData as object)?.constructor?.name ?? levelData}.`);
                    }
                    if (levelData.byteLength < levelByteLengths[level]) {
                        throw new Error(`WebGlTextureUtilities.createCompressedTexture2DArray: '${name}' layer ${layer} mip ${level} has ${levelData.byteLength} bytes; ` +
                            `${Math.max(1, width >> level)}x${Math.max(1, height >> level)} ${textureFormat} needs ${levelByteLengths[level]} (whole ${blockSize[0]}x${blockSize[1]} blocks).`);
                    }
                }
            }
        }

        const texture = gl.createTexture();
        if (label != null) {
            (texture as any).__SPECTOR_Metadata = {
                name: label,
            };
        }

        gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
        const internalFormat = WebGlConverter.convertInternalFormat(gl, textureFormat);
        // Compressed data rows are not aligned to 4.
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        const useTexStorage = width % blockSize[0] == 0 && height % blockSize[1] == 0;
        if (useTexStorage) {
            gl.texStorage3D(gl.TEXTURE_2D_ARRAY, mipLevels, internalFormat, width, height, layers);
            if (data) {
                for (let layer = 0; layer < data.length; layer++) {
                    const levels = data[layer] ?? [];
                    for (let level = 0; level < levels.length; level++) {
                        const levelData = levels[level].subarray(0, levelByteLengths[level]);
                        gl.compressedTexSubImage3D(gl.TEXTURE_2D_ARRAY, level, 0, 0, layer,
                            Math.max(1, width >> level), Math.max(1, height >> level), 1,
                            internalFormat, levelData);
                    }
                }
            }
        } else {
            for (let level = 0; level < mipLevels; level++) {
                const layerBytes = levelByteLengths[level];
                // One buffer with every layer of this level; layers without data stay zero.
                const levelData = new Uint8Array(layerBytes * layers);
                for (let layer = 0; layer < (data?.length ?? 0); layer++) {
                    const layerData = data![layer]?.[level];
                    if (layerData) {
                        levelData.set(layerData.subarray(0, layerBytes), layer * layerBytes);
                    }
                }
                gl.compressedTexImage3D(gl.TEXTURE_2D_ARRAY, level, internalFormat,
                    Math.max(1, width >> level), Math.max(1, height >> level), layers, 0, levelData);
            }
            // Mutable storage: limit sampling to the uploaded levels so the texture stays complete.
            gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_BASE_LEVEL, 0);
            gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAX_LEVEL, mipLevels - 1);
        }

        // Restore the default.
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);

        const error = gl.getError();
        if (error != gl.NO_ERROR) {
            gl.deleteTexture(texture);
            throw new Error(`WebGlTextureUtilities.createCompressedTexture2DArray: WebGL error ${WebGlUtilities.error.errorToStr(error)} while creating '${name}' ` +
                `(${textureFormat}, ${width}x${height}, ${layers} layers, ${mipLevels} mip levels).`);
        }

        return texture;
    }

    /**
     * Copy the texture contents (mip level 0, color) from source to destination with a framebuffer blit. Both textures must be `TEXTURE_2D`.
     * @param gl The WebGL2 context.
     * @param source The source texture.
     * @param destination The destination texture.
     * @param dimensions The texture dimensions [width, height] in pixels.
     */
    public copyTexture(
        gl: WebGL2RenderingContext,
        source: WebGLTexture,
        destination: WebGLTexture,
        dimensions: vec2,
    ): void {

        const width = dimensions[0];
        const height = dimensions[1];

        const readFramebuffer = gl.createFramebuffer()!;
        const drawFramebuffer = gl.createFramebuffer()!;

        // Attach source texture.
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, readFramebuffer);
        gl.framebufferTexture2D(
            gl.READ_FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            source,
            0
        );

        // Attach destination texture.
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, drawFramebuffer);
        gl.framebufferTexture2D(
            gl.DRAW_FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            destination,
            0
        );

        // Copy.
        gl.blitFramebuffer(
            0, 0, width, height,
            0, 0, width, height,
            gl.COLOR_BUFFER_BIT,
            gl.NEAREST
        );

        // Cleanup.
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.deleteFramebuffer(readFramebuffer);
        gl.deleteFramebuffer(drawFramebuffer);
    }
}

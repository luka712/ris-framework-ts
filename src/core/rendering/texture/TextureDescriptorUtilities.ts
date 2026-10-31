import {type ITextureDescriptor, TextureFormat, TextureUsage} from "../../../api/index.ts";

/**
 * A texture descriptor with all defaults applied. Only `data` and `blockSize` stay optional.
 * @internal
 */
export type ResolvedTextureDescriptor =
    Required<Omit<ITextureDescriptor, "data" | "blockSize">> & Pick<ITextureDescriptor, "data" | "blockSize">;

/**
 * Fills in the defaults for every missing field of a texture descriptor.
 * @param desc The descriptor, possibly partial or missing.
 * @returns A new descriptor with the defaults applied.
 * @internal
 */
export function resolveTextureDescriptor(desc?: ITextureDescriptor): ResolvedTextureDescriptor {
    return {
        width: desc?.width ?? 0,
        height: desc?.height ?? 0,
        textureFormat: desc?.textureFormat ?? TextureFormat.UNDEFINED,
        textureUsage: desc?.textureUsage ?? (TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST),
        label: desc?.label ?? null,
        data: desc?.data,
        generateMipmaps: desc?.generateMipmaps ?? false,
        blockSize: desc?.blockSize,
    };
}

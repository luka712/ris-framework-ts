import {
    BufferUsage,
    CullMode,
    FrontFace,
    LoadAction,
    MipMapSamplerFilter,
    PrimitiveTopology,
    SamplerAddressMode,
    SamplerFilter,
    StoreAction,
    TextureFormat,
    TextureUsage,
    VertexStepMode,
    type IVertexBufferLayout,
} from "../../api/index.ts";
import {VertexFormat} from "../../api/geometry/VertexFormat.ts";
import {BlendFactor, BlendOperation} from "../../core/rendering/blending/enums.ts";


/**
 * Converts framework enums to WebGPU values.
 * @internal
 */
export class WebGpuConverter {

    /** Converts buffer usage flags. */
    public static convertBufferUsage(usage: BufferUsage): number {
        let result = 0;
        if (usage & BufferUsage.VERTEX) result |= GPUBufferUsage.VERTEX;
        if (usage & BufferUsage.INDEX) result |= GPUBufferUsage.INDEX;
        if (usage & BufferUsage.UNIFORM) result |= GPUBufferUsage.UNIFORM;
        if (usage & BufferUsage.STORAGE) result |= GPUBufferUsage.STORAGE;
        if (usage & BufferUsage.MAP_READ) result |= GPUBufferUsage.MAP_READ;
        if (usage & BufferUsage.COPY_DST) result |= GPUBufferUsage.COPY_DST;
        return result;
    }

    /** Converts texture usage flags. `TextureUsage.NONE` maps to 0. */
    public static convertTextureUsage(usage: TextureUsage): number {
        let result : number = 0;

        if (usage & TextureUsage.COPY_SRC) result |= GPUTextureUsage.COPY_SRC;
        if (usage & TextureUsage.COPY_DST) result |= GPUTextureUsage.COPY_DST;
        if (usage & TextureUsage.TEXTURE_BINDING) result |= GPUTextureUsage.TEXTURE_BINDING;
        if (usage & TextureUsage.STORAGE_BINDING) result |= GPUTextureUsage.STORAGE_BINDING;
        if (usage & TextureUsage.RENDER_ATTACHMENT) result |= GPUTextureUsage.RENDER_ATTACHMENT;

        return result;
    }

    /** Converts a texture format. Throws for formats the WebGPU backend does not support yet. */
    public static convertTextureFormat(format: TextureFormat): GPUTextureFormat {
        switch (format) {
            case TextureFormat.RGBA8_UNORM:
                return "rgba8unorm";
            case TextureFormat.RGBA8_UNORM_SRGB:
                return "rgba8unorm-srgb";
            case TextureFormat.DEPTH24_PLUS_STENCIL8:
                return "depth24plus-stencil8";
            case TextureFormat.DEPTH32_FLOAT:
                return "depth32float";
            case TextureFormat.R32_FLOAT:
                return "r32float";

            // BC (texture-compression-bc). WebGPU has no BC1 RGB, the RGBA variant decodes the same blocks.
            case TextureFormat.BC1_RGB_UNORM:
                return "bc1-rgba-unorm";
            case TextureFormat.BC1_RGB_UNORM_SRGB:
                return "bc1-rgba-unorm-srgb";
            case TextureFormat.BC3_RGBA_UNORM:
                return "bc3-rgba-unorm";
            case TextureFormat.BC3_RGBA_UNORM_SRGB:
                return "bc3-rgba-unorm-srgb";
            case TextureFormat.BC7_RGBA_UNORM:
                return "bc7-rgba-unorm";
            case TextureFormat.BC7_RGBA_UNORM_SRGB:
                return "bc7-rgba-unorm-srgb";

            // ETC2 (texture-compression-etc2)
            case TextureFormat.ETC2_RGB8_UNORM:
                return "etc2-rgb8unorm";
            case TextureFormat.ETC2_RGB8_UNORM_SRGB:
                return "etc2-rgb8unorm-srgb";
            case TextureFormat.ETC2_RGBA8_UNORM:
                return "etc2-rgba8unorm";
            case TextureFormat.ETC2_RGBA8_UNORM_SRGB:
                return "etc2-rgba8unorm-srgb";

            // ASTC (texture-compression-astc)
            case TextureFormat.ASTC_4X4_UNORM:
                return "astc-4x4-unorm";
            case TextureFormat.ASTC_4X4_UNORM_SRGB:
                return "astc-4x4-unorm-srgb";
            case TextureFormat.ASTC_5X4_UNORM:
                return "astc-5x4-unorm";
            case TextureFormat.ASTC_5X4_UNORM_SRGB:
                return "astc-5x4-unorm-srgb";
            case TextureFormat.ASTC_5X5_UNORM:
                return "astc-5x5-unorm";
            case TextureFormat.ASTC_5X5_UNORM_SRGB:
                return "astc-5x5-unorm-srgb";
            case TextureFormat.ASTC_6X5_UNORM:
                return "astc-6x5-unorm";
            case TextureFormat.ASTC_6X5_UNORM_SRGB:
                return "astc-6x5-unorm-srgb";
            case TextureFormat.ASTC_6X6_UNORM:
                return "astc-6x6-unorm";
            case TextureFormat.ASTC_6X6_UNORM_SRGB:
                return "astc-6x6-unorm-srgb";
            case TextureFormat.ASTC_8X5_UNORM:
                return "astc-8x5-unorm";
            case TextureFormat.ASTC_8X5_UNORM_SRGB:
                return "astc-8x5-unorm-srgb";
            case TextureFormat.ASTC_8X6_UNORM:
                return "astc-8x6-unorm";
            case TextureFormat.ASTC_8X6_UNORM_SRGB:
                return "astc-8x6-unorm-srgb";
            case TextureFormat.ASTC_8X8_UNORM:
                return "astc-8x8-unorm";
            case TextureFormat.ASTC_8X8_UNORM_SRGB:
                return "astc-8x8-unorm-srgb";
            case TextureFormat.ASTC_10X5_UNORM:
                return "astc-10x5-unorm";
            case TextureFormat.ASTC_10X5_UNORM_SRGB:
                return "astc-10x5-unorm-srgb";
            case TextureFormat.ASTC_10X6_UNORM:
                return "astc-10x6-unorm";
            case TextureFormat.ASTC_10X6_UNORM_SRGB:
                return "astc-10x6-unorm-srgb";
            case TextureFormat.ASTC_10X8_UNORM:
                return "astc-10x8-unorm";
            case TextureFormat.ASTC_10X8_UNORM_SRGB:
                return "astc-10x8-unorm-srgb";
            case TextureFormat.ASTC_10X10_UNORM:
                return "astc-10x10-unorm";
            case TextureFormat.ASTC_10X10_UNORM_SRGB:
                return "astc-10x10-unorm-srgb";
            case TextureFormat.ASTC_12X10_UNORM:
                return "astc-12x10-unorm";
            case TextureFormat.ASTC_12X10_UNORM_SRGB:
                return "astc-12x10-unorm-srgb";
            case TextureFormat.ASTC_12X12_UNORM:
                return "astc-12x12-unorm";
            case TextureFormat.ASTC_12X12_UNORM_SRGB:
                return "astc-12x12-unorm-srgb";
            default:
                throw new Error(`WebGpuConverter.convertTextureFormat: texture format ${format} is not implemented for WebGPU.`);
        }
    }

    /**
     * Converts a WebGPU texture format back to the framework format.
     * Returns `TextureFormat.UNDEFINED` for formats the framework has no value for (for example `bgra8unorm`).
     */
    public static convertGpuTextureFormat(format: GPUTextureFormat): TextureFormat {
        switch (format) {
            case "rgba8unorm":
                return TextureFormat.RGBA8_UNORM;
            case "rgba8unorm-srgb":
                return TextureFormat.RGBA8_UNORM_SRGB;
            case "depth24plus-stencil8":
                return TextureFormat.DEPTH24_PLUS_STENCIL8;
            case "depth32float":
                return TextureFormat.DEPTH32_FLOAT;
            case "r32float":
                return TextureFormat.R32_FLOAT;
            default:
                return TextureFormat.UNDEFINED;
        }
    }

    /** Whether the format has a stencil aspect. */
    public static hasStencil(format: TextureFormat): boolean {
        return format === TextureFormat.DEPTH24_PLUS_STENCIL8;
    }

    /** Whether the format is a depth (or depth-stencil) format. */
    public static isDepthFormat(format: TextureFormat): boolean {
        return format === TextureFormat.DEPTH24_PLUS_STENCIL8 || format === TextureFormat.DEPTH32_FLOAT;
    }

    /** Converts a load action. WebGPU has no "don't care", so `UNDEFINED` clears. */
    public static convertLoadAction(action: LoadAction): GPULoadOp {
        return action === LoadAction.LOAD ? "load" : "clear";
    }

    /** Converts a store action. */
    public static convertStoreAction(action: StoreAction): GPUStoreOp {
        return action === StoreAction.DISCARD ? "discard" : "store";
    }

    /** Converts a sampler address mode. WebGPU has no border clamp, so it falls back to clamp to edge. */
    public static convertAddressMode(mode: SamplerAddressMode): GPUAddressMode {
        switch (mode) {
            case SamplerAddressMode.REPEAT:
                return "repeat";
            case SamplerAddressMode.MIRROR_REPEAT:
                return "mirror-repeat";
            default:
                return "clamp-to-edge";
        }
    }

    /** Converts a sampler filter. */
    public static convertFilter(filter: SamplerFilter): GPUFilterMode {
        return filter === SamplerFilter.LINEAR ? "linear" : "nearest";
    }

    /** Converts a mip map filter. `NONE` maps to nearest; the sampler then clamps to mip 0. */
    public static convertMipMapFilter(filter: MipMapSamplerFilter): GPUFilterMode {
        return filter === MipMapSamplerFilter.LINEAR ? "linear" : "nearest";
    }

    /** Converts a blend factor. */
    public static convertBlendFactor(factor: BlendFactor): GPUBlendFactor {
        switch (factor) {
            case BlendFactor.ONE:
                return "one";
            case BlendFactor.SRC_ALPHA:
                return "src-alpha";
            case BlendFactor.ONE_MINUS_SRC_ALPHA:
                return "one-minus-src-alpha";
            default:
                throw new Error(`WebGpuConverter.convertBlendFactor: blend factor ${factor} is not implemented for WebGPU.`);
        }
    }

    /** Converts a blend operation. */
    public static convertBlendOperation(operation: BlendOperation): GPUBlendOperation {
        switch (operation) {
            case BlendOperation.ADD:
                return "add";
            case BlendOperation.SUBTRACT:
                return "subtract";
            case BlendOperation.REVERSE_SUBTRACT:
                return "reverse-subtract";
            case BlendOperation.MIN:
                return "min";
            case BlendOperation.MAX:
                return "max";
            default:
                throw new Error(`WebGpuConverter.convertBlendOperation: blend operation ${operation} is not implemented for WebGPU.`);
        }
    }

    /** Converts a primitive topology. */
    public static convertTopology(topology: PrimitiveTopology): GPUPrimitiveTopology {
        switch (topology) {
            case PrimitiveTopology.LINE_LIST:
                return "line-list";
            case PrimitiveTopology.LINE_STRIP:
                return "line-strip";
            case PrimitiveTopology.POINT_LIST:
                return "point-list";
            case PrimitiveTopology.TRIANGLE_STRIP:
                return "triangle-strip";
            default:
                return "triangle-list";
        }
    }

    /** Converts a cull mode. */
    public static convertCullMode(mode: CullMode): GPUCullMode {
        switch (mode) {
            case CullMode.BACK:
                return "back";
            case CullMode.FRONT:
                return "front";
            default:
                return "none";
        }
    }

    /** Converts a front face. */
    public static convertFrontFace(face: FrontFace): GPUFrontFace {
        return face === FrontFace.CW ? "cw" : "ccw";
    }

    /** Converts a vertex format. */
    public static convertVertexFormat(format: VertexFormat): GPUVertexFormat {
        switch (format) {
            case VertexFormat.FLOAT_32:
                return "float32";
            case VertexFormat.FLOAT_32X2:
                return "float32x2";
            case VertexFormat.FLOAT_32X3:
                return "float32x3";
            case VertexFormat.FLOAT_32X4:
                return "float32x4";
            default:
                throw new Error(`WebGpuConverter.convertVertexFormat: vertex format ${VertexFormat[format]} is not implemented for WebGPU.`);
        }
    }

    /** Converts a vertex buffer layout. */
    public static convertVertexBufferLayout(layout: IVertexBufferLayout): GPUVertexBufferLayout {
        return {
            arrayStride: layout.arrayStride,
            stepMode: layout.stepMode === VertexStepMode.INSTANCE ? "instance" : "vertex",
            attributes: layout.attributes.map(attribute => ({
                format: WebGpuConverter.convertVertexFormat(attribute.format),
                offset: attribute.offset,
                shaderLocation: attribute.shaderLocation,
            })),
        };
    }
}

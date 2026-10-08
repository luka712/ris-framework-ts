import {Culling} from "../../api/rendering/enums.ts";
import {BlendFactor, BlendOperation} from "../../core/rendering/blending/enums";
import {VertexFormat} from "../../api/geometry/VertexFormat.ts";
import {
    BufferUsage,
    CullMode,
    FrontFace,
    MipMapSamplerFilter,
    PrimitiveTopology,
    SamplerAddressMode,
    SamplerFilter,
    TextureFormat
} from "../../api/index.ts";

export class WebGlConverter {

    // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants

    /** BC3 */
    private static GL_COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;

    /** BC7 */
    private static GL_COMPRESSED_RGBA_BPTC_UNORM = 0x8E8C;


    /** ETC2 */
    private static GL_COMPRESSED_RGBA8_ETC2_EAC = 0x9278;

    private static GL_COMPRESSED_RGBA_ASTC_4x4_KHR = 0x93B0;

    /**
     * Converts PrimitiveTopology to WebGL enum.
     * @param topology The PrimitiveTopology.
     * @returns The WebGL enum.
     */
    public static convertPrimitiveType(topology: PrimitiveTopology): number {

        switch (topology) {
            case PrimitiveTopology.TRIANGLE_LIST:
                return WebGL2RenderingContext.TRIANGLES;
            case PrimitiveTopology.LINE_LIST:
                return WebGL2RenderingContext.LINES;
            case PrimitiveTopology.LINE_STRIP:
                return WebGL2RenderingContext.LINE_STRIP;
            case PrimitiveTopology.POINT_LIST:
                return WebGL2RenderingContext.POINTS;
            case PrimitiveTopology.TRIANGLE_STRIP:
                return WebGL2RenderingContext.TRIANGLE_STRIP;
            default:
                throw new Error("Method not implemented.");
        }
    }

    /**
     * Converts CullMode to WebGL enum.
     * @param cullFace The CullMode.
     * @return The WebGL enum.
     */
    public static convertCullFace(cullFace: CullMode): number {

        switch (cullFace) {
            case CullMode.NONE:
                return WebGL2RenderingContext.NONE;
            case CullMode.BACK:
                return WebGL2RenderingContext.BACK;
            case CullMode.FRONT:
                return WebGL2RenderingContext.FRONT;
            default: throw new Error("Method not implemented.");
        }

    }

    /**
     * Converts FrontFace to WebGL enum.
     * @param frontFace The FrontFace.
     * @return The WebGL enum.
     */
    public static convertFrontFace(frontFace: FrontFace): number {
        switch (frontFace) {
            case FrontFace.CW:
                return WebGL2RenderingContext.CW;
            case FrontFace.CCW:
                return WebGL2RenderingContext.CCW;
            default:
                throw new Error("Method not implemented.");
        }
    }

    /**
     * Converts BufferUsage to WebGL enum.
     * @param usage The BufferUsage.
     * @return The WebGL enum.
     */
    public static convertBufferUsage(usage: BufferUsage): GLenum {

        let bufferUsage: number = WebGL2RenderingContext.STATIC_DRAW;

        if((usage & BufferUsage.COPY_DST) == BufferUsage.COPY_DST)
        {
            bufferUsage = WebGL2RenderingContext.DYNAMIC_DRAW;
        }

        return bufferUsage;
    }
    /**
     * Converts BlendOperation to WebGL enum.
     * @param gl The WebGL2RenderingContext.
     * @param blendOperation The BlendOperation.
     * @return The WebGL enum.
     */
    public static convertBlendOperation(
        gl: WebGL2RenderingContext,
        blendOperation: BlendOperation,
    ): GLenum {
        switch (blendOperation) {
            case BlendOperation.ADD:
                return gl.FUNC_ADD;
            case BlendOperation.SUBTRACT:
                return gl.FUNC_SUBTRACT;
            case BlendOperation.REVERSE_SUBTRACT:
                return gl.FUNC_REVERSE_SUBTRACT;
            case BlendOperation.MIN:
                return gl.MIN;
            case BlendOperation.MAX:
                return gl.MAX;
            default:
                throw new Error("NotImplementedException");
        }
    }

    /**
     * Converts BlendFactor to WebGL enum.
     * @param gl The WebGL2RenderingContext.
     * @param blendingFactor The BlendFactor.
     * @returns The WebGL enum.
     */
    public static convertBlendFactor(
        gl: WebGL2RenderingContext,
        blendingFactor: BlendFactor,
    ): number {
        switch (blendingFactor) {
            // case BlendFactor.ZERO:
            //     return gl.ZERO;
            case BlendFactor.ONE:
                return gl.ONE;
            // case BlendFactor.SRC_COLOR:
            //     return gl.SRC_COLOR;
            case BlendFactor.SRC_ALPHA:
                return gl.SRC_ALPHA;
            case BlendFactor.ONE_MINUS_SRC_ALPHA:
                return gl.ONE_MINUS_SRC_ALPHA;
            // case BlendFactor.DST_ALPHA:
            //     return gl.DST_ALPHA;
            // case BlendFactor.ONE_MINUS_DST_ALPHA:
            //     return gl.ONE_MINUS_DST_ALPHA;
            default:
                throw new Error("NotImplementedException");
        }
    }

    /**
     * Converts Culling to WebGL enum.
     * @param gl The WebGL2RenderingContext.
     * @param culling The Culling.
     * @returns The WebGL enum.
     */
    public static convertCulling(gl: WebGL2RenderingContext, culling: Culling): number {
        switch (culling) {
            case Culling.Front:
                return gl.FRONT;
            case Culling.Back:
                return gl.BACK;
            case Culling.None:
                return gl.NONE;
            default:
                throw new Error("NotImplementedException");
        }
    }

    /**
     * Converts TextureFormat to WebGL internal format, format, and type.
     * @param gl The WebGL2RenderingContext.
     * @param textureFormat The TextureFormat.
     * @returns The WebGL internal format.
     */
    public static convertInternalFormat(gl: WebGL2RenderingContext, textureFormat: TextureFormat): number {
        switch (textureFormat) {
            // Same format regardless.
            case TextureFormat.RGBA_8_UNORM:
                return gl.RGBA8;
            case TextureFormat.RGBA_8_UNORM_SRGB:
                return gl.SRGB8_ALPHA8;
            case TextureFormat.DEPTH_32_FLOAT:
                return gl.DEPTH_COMPONENT32F;
            case TextureFormat.DEPTH_24_STENCIL_8:
                return gl.DEPTH24_STENCIL8;
            case TextureFormat.BC3_RGBA_UNORM:
                return WebGlConverter.GL_COMPRESSED_RGBA_S3TC_DXT5_EXT;
            case TextureFormat.ETC2_RGBA8_UNORM:
                return WebGlConverter.GL_COMPRESSED_RGBA8_ETC2_EAC;
            case TextureFormat.BC7_RGBA_UNORM:
                return WebGlConverter.GL_COMPRESSED_RGBA_BPTC_UNORM;
            case TextureFormat.ASTC_4X4_RGBA:
                return WebGlConverter.GL_COMPRESSED_RGBA_ASTC_4x4_KHR;

            default:
                throw new Error("NotImplementedException");
        }
    }

    /**
     * Converts TextureFormat to WebGL format.
     * @param gl The WebGL2RenderingContext.
     * @param textureFormat The TextureFormat.
     * @returns The WebGL format.
     */
    public static convertToPixelFormat(gl: WebGL2RenderingContext, textureFormat: TextureFormat): number {
        switch (textureFormat) {
            case TextureFormat.RGBA_8_UNORM:
            case TextureFormat.RGBA_8_UNORM_SRGB:
                return gl.RGBA;
            case TextureFormat.DEPTH_32_FLOAT:
                return gl.DEPTH_COMPONENT;
            case TextureFormat.DEPTH_24_STENCIL_8:
                return gl.DEPTH_STENCIL;
            default:
                throw new Error("NotImplementedException");
        }
    }

    /**
     * Converts TextureFormat to WebGL texture type.
     * @param gl The WebGL2RenderingContext.
     * @param textureFormat The TextureFormat.
     * @returns The WebGL texture type.
     */
    public static convertToTextureType(gl: WebGL2RenderingContext, textureFormat: TextureFormat): number {
        switch (textureFormat) {
            case TextureFormat.RGBA_8_UNORM:
            case TextureFormat.RGBA_8_UNORM_SRGB:
                return gl.UNSIGNED_BYTE;
            case TextureFormat.DEPTH_32_FLOAT:
                return gl.FLOAT;
            case TextureFormat.DEPTH_24_STENCIL_8:
                return gl.UNSIGNED_INT_24_8;
            default:
                throw new Error("NotImplementedException");
        }
    }

    /**
     * Converts VertexFormat to the number of components for WebGL vertex attribute pointer.
     * @param vertexFormat The VertexFormat.
     * @returns The number of components for WebGL vertex attribute pointer.
     */
    public static convertVertexFormat(vertexFormat: VertexFormat): number {
        switch (vertexFormat) {
            case VertexFormat.FLOAT_32:
                return 1;
            case VertexFormat.FLOAT_32X2:
                return 2;
            case VertexFormat.FLOAT_32X3:
                return 3;
            case VertexFormat.FLOAT_32X4:
                return 4;
            case VertexFormat.FLOAT_32X16:
                return 16;
            default:
                throw new Error("NotImplementedException");
        }
    }

    /**
     * Converts SamplerFilter to WebGL enum.
     * @param gl The WebGL2RenderingContext.
     * @param filter The SamplerFilter.
     * @returns The WebGL enum.
     */
    public static convertMagFilter(gl: WebGL2RenderingContext, filter: SamplerFilter): number {
        switch (filter) {
            case SamplerFilter.NEAREST:
                return gl.NEAREST;
            case SamplerFilter.LINEAR:
                return gl.LINEAR;
            default:
                throw new Error("NotImplementedException");
        }
    }

    /**
     * Converts SamplerFilter and MipmapSamplerFilter to WebGL enum for minification filter.
     * @param gl The WebGL2RenderingContext.
     * @param filter The SamplerFilter.
     * @param mipMapFilter The MipmapSamplerFilter.
     * @returns The WebGL enum.
     */
    public static convertMinFilter(gl: WebGL2RenderingContext, filter: SamplerFilter, mipMapFilter: MipMapSamplerFilter): number {

        if (mipMapFilter == MipMapSamplerFilter.NONE) {
            return this.convertMagFilter(gl, filter);
        }
        switch (filter) {
            case SamplerFilter.NEAREST:
                switch (mipMapFilter) {
                    case MipMapSamplerFilter.NEAREST:
                        return gl.NEAREST_MIPMAP_NEAREST;
                    case MipMapSamplerFilter.LINEAR:
                        return gl.NEAREST_MIPMAP_LINEAR;
                    default:
                        throw new Error("NotImplementedException");
                }
            case SamplerFilter.LINEAR:
                switch (mipMapFilter) {
                    case MipMapSamplerFilter.NEAREST:
                        return gl.LINEAR_MIPMAP_NEAREST;
                    case MipMapSamplerFilter.LINEAR:
                        return gl.LINEAR_MIPMAP_LINEAR;
                    default:
                        throw new Error("NotImplementedException");
                }
            default:
                throw new Error("NotImplementedException");
        }
    }

    /**
     * Converts SamplerAddressMode to WebGL enum.
     * @param gl The WebGL2RenderingContext.
     * @param addressMode The SamplerAddressMode.
     * @returns The WebGL enum.
     */
    public static convertAddressMode(gl: WebGL2RenderingContext, addressMode: SamplerAddressMode): number {
        switch (addressMode) {
            case SamplerAddressMode.CLAMP_TO_EDGE:
                return gl.CLAMP_TO_EDGE;
            case SamplerAddressMode.REPEAT:
                return gl.REPEAT;
            case SamplerAddressMode.MIRROR_REPEAT:
                return gl.MIRRORED_REPEAT;
            case SamplerAddressMode.CLAMP_TO_BORDER:
                // WebGL2 has no clamp-to-border wrap mode. Clamp to edge is the closest match.
                return gl.CLAMP_TO_EDGE;
            default:
                throw new Error("NotImplementedException");
        }
    }

}
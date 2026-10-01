import { WebGLBlendingUtilities } from "./webgl-blending-utilities";
import { WebGlBufferUtilities } from "./WebGlBufferUtilities.ts";
import { WebGLCullingUtilities } from "./webgl-culling-utilities";
import { WebGLFilterAnisotropicUtilities } from "./webgl-filter-anisotropic-utilities";
import { WebGlFrameBufferUtilities } from "./WebGlFrameBufferUtilities.ts";
import { WebGLProgramUtilities } from "./webgl-program-utilities";
import { WebGLRenderbufferUtilities } from "./webgl-renderbuffer-utilities";
import { WebGlSamplerUtilities } from "./WebGlSamplerUtilities.ts";
import { WebGlShaderUtilities } from "./WebGlShaderUtilities.ts";
import { WebGlTextureUtilities } from "./WebGlTextureUtilities.ts";

/**
 * The utility class for WebGL operations.
 */
export class WebGlUtilities {

    /**
     * The WebGL blending utilities.
     */
    public static readonly blending = new WebGLBlendingUtilities();

    /**
     * The WebGL anisotropic filtering utilities.
     */
    public static readonly anisotropy = new WebGLFilterAnisotropicUtilities();

    /**
     * The WebGL culling utilities.
     */
    public static readonly culling = new WebGLCullingUtilities();

    /**
     * The WebGL texture utilities.
     */
    public static readonly texture = new WebGlTextureUtilities();

    /**
     * The WebGL framebuffer utilities.
     */
    public static readonly framebuffer = new WebGlFrameBufferUtilities();

    /**
     * The WebGL render buffer utilities.
     */
    public static readonly renderbuffer = new WebGLRenderbufferUtilities();

    /**
     * The WebGL buffer utilities.
     */
    public static readonly buffer = new WebGlBufferUtilities();

    /**
     * The WebGL render buffer utilities.
     */
    public static readonly renderBuffer = new WebGLRenderbufferUtilities();

    /**
     * The WebGL sampler utilities.
     */
    public static readonly sampler = new WebGlSamplerUtilities();

    /**
     * The WebGL shader utilities.
     */
    public static readonly shader = new WebGlShaderUtilities();

    /**
     * The WebGL program utilities.
     */
    public static readonly program = new WebGLProgramUtilities();
}

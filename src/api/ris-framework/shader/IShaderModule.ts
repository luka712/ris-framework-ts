import {IContent} from "../content/IContent";
import {ShaderStage} from "./ShaderStage";

/**
 * The shader module.
 This is the main interface for shaders.
 It represents a compiled shader that can be used to create shader pipelines.
 */
export interface IShaderModule extends IContent {

    /**
     * The stages of the shader.
     * A shader module can contain multiple shader stages, such as vertex shader and fragment shader.
     */
    readonly stages: ShaderStage[];

    /**
     * The native handle of the shader module.
     * In the case of OpenGL (ES), it is the shader program ID.
      *In the case of WebGPU, it is the shader module.
     */
    readonly nativeHandle?: any;
}

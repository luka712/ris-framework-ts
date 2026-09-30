import {IShaderModule} from "./IShaderModule";

/**
 * The loader for shader modules.
 */
export interface IShaderModuleLoader {

/**
 * Loads a shader module.
 * @param shaderModuleId - The shader module id.
 * @returns The .
 */
  load(shaderModuleId: string): IShaderModule;

}

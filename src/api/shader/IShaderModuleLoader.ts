import type { IShaderModule } from "./IShaderModule.ts";

/**
 * The loader for shader modules.
 */
export interface IShaderModuleLoader {

/**
 * Loads a shader module.
 * @param shaderModuleId - The shader module id.
 * @returns The shader module.
 */
  load(shaderModuleId: string): IShaderModule;

}

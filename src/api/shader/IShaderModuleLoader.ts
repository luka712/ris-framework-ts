import type { IShaderModule } from "./IShaderModule.ts";

/**
 * The loader for shader modules.
 */
export interface IShaderModuleLoader {

/**
 * Loads a shader module.
 * @param shaderModuleId - The shader module id.
 * @param keyValueDictionary - If present, tries to find key in shader such that it replaced ##DIRECTIONAL_LIGHT_COUNT## by given value for key DIRECTIONAL_LIGHST_COUNT.
 * @returns The shader module.
 */
  load(shaderModuleId: string, keyValueDictionary?: {[id:string]: number}): IShaderModule;

}

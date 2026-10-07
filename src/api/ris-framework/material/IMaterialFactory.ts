import {InspectTextureMipsMaterial} from "./InspectTextureMipsMaterial";
import {UnlitMaterial, UnlitMaterialDescriptor} from "./UnlitMaterial";

/**
 * The material factory.
 */
export interface IMaterialFactory {

    /**
     * Creates a material for inspecting texture mips.
     * @returns The Inspect Texture Mips Material.
     */
    createInspectTextureMipsMaterial(): InspectTextureMipsMaterial;

    /**
     * Creates an unlit material.
     * @param config The optional additional configuration options for material, such as rendering options.
     * @returns The Unlit Material.
     */
    createUnlitMaterial(config?: UnlitMaterialDescriptor): UnlitMaterial;
}

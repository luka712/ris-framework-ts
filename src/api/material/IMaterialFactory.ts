import {InspectTextureMipsMaterial} from "./InspectTextureMipsMaterial.ts";
import type {SpriteMaterial, SpriteMaterialDescriptor} from "./SpriteMaterial.ts";
import {UnlitMaterial, UnlitMaterialDescriptor} from "./UnlitMaterial.ts";
import type {ForwardBlinnPhongMaterial, ForwardBlinnPhongMaterialDescriptor} from "./ForwardBlinnPhongMaterial.ts";

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
     * @param descriptor The optional additional configuration options for material, such as rendering options.
     * @returns The Unlit Material.
     */
    createUnlitMaterial(descriptor?: UnlitMaterialDescriptor): UnlitMaterial;

    /**
     * Creates a sprite material.
     * @param descriptor The sprite material descriptor with projection view buffer, texture and sampler.
     * @returns The Sprite Material.
     */
    createSpriteMaterial(descriptor: SpriteMaterialDescriptor): SpriteMaterial;

    /**
     * Creates a Blinn-Phong material with forward calculated lighting.
     * @param descriptor The optional configuration, such as camera and primitive state.
     * @returns The Forward Blinn-Phong Material.
     */
    createForwardBlinnPhongMaterial(descriptor?: ForwardBlinnPhongMaterialDescriptor): ForwardBlinnPhongMaterial;
}

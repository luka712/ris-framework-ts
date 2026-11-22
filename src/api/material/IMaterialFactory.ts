import {InspectTextureMipsMaterial} from "./InspectTextureMipsMaterial.ts";
import {InspectTextureArrayMaterial} from "./InspectTextureArrayMaterial.ts";
import type {SpriteMaterial, SpriteMaterialDescriptor} from "./SpriteMaterial.ts";
import {UnlitMaterial} from "./UnlitMaterial.ts";
import {UnlitTextureArrayMaterial} from "./UnlitTextureArrayMaterial.ts";
import type {IUnlitMaterialDescriptor} from "./IUnlitMaterialDescriptor.ts";
import type {ForwardBlinnPhongMaterial, ForwardBlinnPhongMaterialDescriptor} from "./ForwardBlinnPhongMaterial.ts";

/**
 * The material factory.
 */
export interface IMaterialFactory {

    /**
     * Creates a material for inspecting texture mips. Works on WebGL2 and WebGPU.
     * @returns The Inspect Texture Mips Material.
     */
    createInspectTextureMipsMaterial(): InspectTextureMipsMaterial;

    /**
     * Creates a material for inspecting a 2D texture array.
     * The layer index defaults to 0. Works on WebGL2 and WebGPU.
     * @returns The inspect texture array material.
     */
    createInspectTextureArrayMaterial(): InspectTextureArrayMaterial;

    /**
     * Creates an unlit material.
     * @param descriptor The optional additional configuration options for material, such as rendering options.
     * @returns The Unlit Material.
     */
    createUnlitMaterial(descriptor?: IUnlitMaterialDescriptor): UnlitMaterial;

    /**
     * Creates an unlit material that samples one layer of a 2D texture array. Works on WebGL2 and WebGPU.
     * @param descriptor The optional descriptor (camera, primitive state). By default, no camera and the default primitive state.
     * @returns The unlit texture array material. Its layer defaults to 0.
     */
    createUnlitTextureArrayMaterial(descriptor?: IUnlitMaterialDescriptor): UnlitTextureArrayMaterial;

    /**
     * Creates a sprite material.
     * @param descriptor The sprite material descriptor with projection view buffer, texture and sampler.
     * @returns The Sprite Material.
     */
    createSpriteMaterial(descriptor: SpriteMaterialDescriptor): SpriteMaterial;

    /**
     * Creates a Blinn-Phong material with forward calculated lighting.
     * @param descriptor The configuration: the required projection view and camera position buffers, plus optional lights buffer and primitive state.
     * @throws Error when a required buffer is missing.
     * @returns The Forward Blinn-Phong Material.
     */
    createForwardBlinnPhongMaterial(descriptor: ForwardBlinnPhongMaterialDescriptor): ForwardBlinnPhongMaterial;
}

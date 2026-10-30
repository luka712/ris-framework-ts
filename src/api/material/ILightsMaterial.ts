import type { IMaterial } from "./IMaterial.ts";
import type { AmbientLight } from "../lights/AmbientLight.ts";
import type { DirectionalLight } from "../lights/DirectionalLight.ts";
import type { PointLight } from "../lights/PointLight.ts";

/**
 * A material lit by an ambient light, directional lights and point lights (Blinn-Phong).
 * The material owns its lights buffer and uploads it only when the lights changed.
 * A `Scene` hands each lights material its active ambient light and its own light lists (the same arrays, not copies)
 * in `scene.update()`, so lights added to the scene reach every lit material.
 * @public
 */
export interface ILightsMaterial extends IMaterial {

    /** The ambient light. */
    ambientLight: AmbientLight;

    /** The directional lights. The list is used by reference and may be edited; extra lights beyond the slots are ignored. */
    directionalLights: DirectionalLight[];

    /** The point lights. The list is used by reference and may be edited; extra lights beyond the slots are ignored. */
    pointLights: PointLight[];
}

/**
 * Whether a material is an {@link ILightsMaterial}.
 * @param material The material.
 * @public
 */
export function isLightsMaterial(material: IMaterial | undefined): material is ILightsMaterial {
    return !!material && "directionalLights" in material && "pointLights" in material && "ambientLight" in material;
}

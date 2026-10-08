import {InspectTextureMipsMaterial} from "./InspectTextureMipsMaterial.ts";
import type { IFramework } from "../IFramework.ts";
import type { IMaterialFactory } from "./IMaterialFactory.ts";
import {UnlitMaterial, UnlitMaterialDescriptor} from "./UnlitMaterial.ts";

/**
 * The material factory.
 */
export class MaterialFactory implements IMaterialFactory {

    /**
     * The constructor.
     * @param _framework The framework.
     */
    public constructor(private readonly _framework: IFramework) {
    }

    /** @inheritDoc */
    public createInspectTextureMipsMaterial(): InspectTextureMipsMaterial {
        return new InspectTextureMipsMaterial(this._framework);
    }

    /** @inheritDoc */
    public createUnlitMaterial(descriptor? : UnlitMaterialDescriptor): UnlitMaterial {
        return new UnlitMaterial(this._framework, descriptor );
    }
}

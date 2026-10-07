import {InspectTextureMipsMaterial} from "./InspectTextureMipsMaterial";
import {IFramework} from "../IFramework";
import {IMaterialFactory} from "./IMaterialFactory";
import {UnlitMaterial, UnlitMaterialDescriptor} from "./UnlitMaterial";

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

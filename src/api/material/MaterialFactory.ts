import {InspectTextureMipsMaterial} from "./InspectTextureMipsMaterial.ts";
import type { IFramework } from "../IFramework.ts";
import type { IMaterialFactory } from "./IMaterialFactory.ts";
import {SpriteMaterial, type SpriteMaterialDescriptor} from "./SpriteMaterial.ts";
import {UnlitMaterial} from "./UnlitMaterial.ts";
import type {IUnlitMaterialDescriptor} from "./IUnlitMaterialDescriptor.ts";
import {ForwardBlinnPhongMaterial, type ForwardBlinnPhongMaterialDescriptor} from "./ForwardBlinnPhongMaterial.ts";

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
    public createUnlitMaterial(descriptor?: IUnlitMaterialDescriptor): UnlitMaterial {
        return new UnlitMaterial(this._framework, descriptor);
    }

    /** @inheritDoc */
    public createSpriteMaterial(descriptor: SpriteMaterialDescriptor): SpriteMaterial {
        return new SpriteMaterial(this._framework, descriptor);
    }

    /** @inheritDoc */
    public createForwardBlinnPhongMaterial(descriptor: ForwardBlinnPhongMaterialDescriptor): ForwardBlinnPhongMaterial {
        return new ForwardBlinnPhongMaterial(this._framework, descriptor);
    }
}

import { TextureFormat, TextureUsage } from "../_export";

/** TODO */
export class ValidationUtilities {


    /** TODO */
    public static validateTextureUsageTextureFormat(usage: TextureUsage, format: TextureFormat) : void {

        if(usage & TextureUsage.STORAGE_BINDING) {
            if(format != TextureFormat.RGBA8_UNORM){
                // TODO: make error bit better
                throw new Error("STORAGE_BINDING texture usage must be used with RGBA8_UNORM texture format.");
            }
        }

    }

}
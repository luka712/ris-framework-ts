import {TextureFormat} from "../../api";
import {WebGpuConverter} from "./WebGpuConverter.ts";

/** The context utility class. */
export class WebGpuContextUtilities {

    /**
     * Retrieves and configures the canvas context.
     * @param context The context.
     * @param device The device.
     * @param desiredTextureFormat The desired texture format. If not set, or a canvas cannot use it, the preferred canvas format is used.
     * @param alphaMode The alpha mode. By default, `opaque`.
     * @returns The context, the configuration and the selected texture format.
     */
    public configure(
        context: GPUCanvasContext,
        device: GPUDevice,
        desiredTextureFormat?: TextureFormat,
        alphaMode: GPUCanvasAlphaMode = "opaque") {

        const gpuTextureFormat = desiredTextureFormat ? WebGpuConverter.convertTextureFormat(desiredTextureFormat) : navigator.gpu.getPreferredCanvasFormat();

        const configuration: GPUCanvasConfiguration = {
            device,
            format: gpuTextureFormat,
            alphaMode,
        };
        context.configure(configuration);

        return {
            configuration,
            textureFormat: WebGpuConverter.convertGpuTextureFormat(gpuTextureFormat),
        };
    }

}
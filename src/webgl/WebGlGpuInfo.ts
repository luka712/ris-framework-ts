import {type IGPUInfo, GpuBackend, TextureFormat, TextureUtilities} from "../api/index.ts";
import type {WebGlGraphicsDevice} from "./WebGlGraphicsDevice.ts";

/**
 * WebGL GPU info.
 */
export class WebGlGpuInfo implements IGPUInfo {

    /**
     * The constructor.
     * @param graphicsDevice The graphics device.
     */
    public constructor(graphicsDevice: WebGlGraphicsDevice) {

        var gl = graphicsDevice.gl;

        // Get name of the graphics device.
        const debugExt = gl.getExtension("WEBGL_debug_renderer_info");
        if(debugExt) {
            this.name = gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL);
            this.vendor = gl.getParameter(debugExt.UNMASKED_VENDOR_WEBGL);
        }
        else {
            this.name = gl.getParameter(gl.RENDERER);
            this.vendor = gl.getParameter(gl.VENDOR);
        }

        this.apiVersion = gl.getParameter(gl.VERSION);
        this.api = GpuBackend.WEB_GL;

        // This info is hidden, therefore default.
        this.underlyingBackend = GpuBackend.DEFAULT;

        const supportedCompressedTextureFormats = graphicsDevice.features.supportedTextureFormats
            .filter(f => TextureUtilities.isCompressedTextureFormat(f));

        this.supportedCompressedTextureFormats = supportedCompressedTextureFormats;

    }

    /** @inheritDoc */
    readonly api: GpuBackend;

    /** @inheritDoc */
    readonly apiVersion: string;

    /** @inheritDoc */
    readonly name: string;

    /** @inheritDoc */
    readonly supportedCompressedTextureFormats: TextureFormat[];

    /** @inheritDoc */
    readonly underlyingBackend: GpuBackend;

    /** @inheritDoc */
    readonly vendor: string;

}
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

// The converter and the context utilities import the whole API; only the texture format conversions are needed here.
vi.mock("../src/webgpu/utilities/WebGpuConverter", () => ({
    WebGpuConverter: {
        convertTextureFormat: (f: string) => f === "RGBA8_UNORM" ? "rgba8unorm" : f === "RGBA8_UNORM_SRGB" ? "rgba8unorm-srgb" : "r32float",
        convertGpuTextureFormat: (f: string) => f === "rgba8unorm" ? "RGBA8_UNORM" : f === "bgra8unorm" ? "BGRA_8_UNORM" : "UNDEFINED",
    },
}));
vi.mock("../src/api", () => ({TextureFormat: {}}));

import {WebGpuContextUtilities} from "../src/webgpu/utilities/WebGpuContextUtilities";

describe("WebGpuContextUtilities", () => {
    let utilities: WebGpuContextUtilities;
    let context: { configure: ReturnType<typeof vi.fn> };
    const device = {} as GPUDevice;

    beforeEach(() => {
        vi.stubGlobal("navigator", {gpu: {getPreferredCanvasFormat: () => "bgra8unorm"}});
        utilities = new WebGpuContextUtilities();
        context = {configure: vi.fn()};
    });

    afterEach(() => vi.unstubAllGlobals());

    it("uses the preferred canvas format when none is desired", () => {
        const result = utilities.configure(context as unknown as GPUCanvasContext, device);
        expect(context.configure).toHaveBeenCalledWith({device, format: "bgra8unorm", alphaMode: "opaque"});
        expect(result.textureFormat).toBe("BGRA_8_UNORM");
    });

    it("uses the desired format, view formats and alpha mode", () => {
        const result = utilities.configure(context as unknown as GPUCanvasContext, device, "RGBA8_UNORM" as any, ["RGBA8_UNORM_SRGB" as any], "premultiplied");
        expect(result.configuration).toEqual({device, format: "rgba8unorm", alphaMode: "premultiplied", viewFormats: ["rgba8unorm-srgb"]});
        expect(result.textureFormat).toBe("RGBA8_UNORM");
    });
});

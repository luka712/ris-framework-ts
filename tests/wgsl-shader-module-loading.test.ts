import {afterEach, describe, expect, it, vi} from "vitest";
import type {IFramework} from "../src/api/IFramework.ts";
import {WgslShaderModuleContent} from "../src/api/content/WgslShaderModuleContent.ts";
import {WebGpuShaderModule} from "../src/webgpu/shader/WebGpuShaderModule.ts";
import {WgslShaderContent} from "../src/webgpu/shader/WgslShaderContent.ts";
import {WebGpuUtilities} from "../src/webgpu/utilities/WebGpuUtilities.ts";
import colorConversion from "../shaders/wgsl/modules/color_conversion.wgsl?raw";
import mainFrameBuffer from "../shaders/wgsl/main_frame_buffer.wgsl?raw";
import shaderModuleSource from "../src/webgpu/shader/WebGpuShaderModule.ts?raw";

/**
 * WGSL `#import` splicing. GPUShaderModule creation is stubbed; assertions are on the
 * source passed to it and on errors thrown before that.
 */

const originalIds = Object.keys(WgslShaderModuleContent);
const entryFields = new Set(["path", "shader", "reflection"]);

const framework = {
    renderer: {graphicsDevice: {device: {}}},
} as unknown as IFramework;

let compiled = "";

function installCompilerStub(): void {
    compiled = "";
    vi.spyOn(WebGpuUtilities.shaderModule, "create").mockImplementation((_device, code) => {
        compiled = code;
        return {label: "shader"} as GPUShaderModule;
    });
}

function load(id: string, keys?: {[id: string]: number}): WebGpuShaderModule {
    installCompilerStub();
    return new WebGpuShaderModule(framework, id, keys);
}

function restoreContent(): void {
    for (const id of Object.keys(WgslShaderModuleContent)) {
        if (!originalIds.includes(id)) {
            delete WgslShaderModuleContent[id];
            continue;
        }
        const entry = WgslShaderModuleContent[id] as Record<string, unknown>;
        for (const key of Object.keys(entry)) {
            if (!entryFields.has(key)) {
                delete entry[key];
            }
        }
    }
}

afterEach(() => {
    restoreContent();
    vi.restoreAllMocks();
});

describe("WgslShaderModuleContent", () => {
    it("registers color_conversion by its import path and keeps programs separate", () => {
        const module = WgslShaderModuleContent.color_conversion;
        expect(module.path).toBe("modules/color_conversion.wgsl");
        expect(module.shader).toBe(colorConversion);
        expect(module.shader).toContain("fn linearToSrgbChannel");
        expect(module.shader).toContain("fn linearToSrgb");
        expect(module.shader).toContain("fn linearToGamma");

        expect(mainFrameBuffer).toContain('#import "modules/color_conversion.wgsl"');
        expect(WgslShaderContent.main_frame_buffer).toBe(mainFrameBuffer);
        expect(WgslShaderContent.color_conversion).toBeUndefined();
        expect(Object.keys(WgslShaderContent).sort()).toEqual([
            "forward_blinn_phong_material",
            "inspect_texture_mips",
            "main_frame_buffer",
            "sprite",
            "unlit_material",
        ]);
    });
});

describe("WebGpuShaderModule #import", () => {
    it("splices color_conversion into the main frame buffer shader once", () => {
        load("main_frame_buffer");

        expect(compiled).toContain("fn linearToGamma");
        expect(compiled).toContain("fn linearToSrgbChannel");
        expect(compiled).toContain("linearToGamma(color.rgb, u_fragmentData.gamma)");
        expect(compiled).not.toMatch(/^[ \t]*#import[ \t]+"/m);
        expect(compiled.split("fn linearToGamma").length - 1).toBe(1);
        expect(WebGpuUtilities.shaderModule.create).toHaveBeenCalledOnce();
    });

    it("accepts a leading indent and an optional semicolon", () => {
        WgslShaderModuleContent["indented_import"] = {
            shader: '#version-placeholder\n  #import "modules/color_conversion.wgsl";\nfn main_fs() {}\n',
        };

        load("indented_import");

        expect(compiled).toContain("fn linearToSrgbChannel");
        expect(compiled).not.toMatch(/^[ \t]*#import[ \t]+"/m);
    });

    it("splices each import from that module's own source", () => {
        WgslShaderModuleContent["mod_a"] = {path: "modules/a.wgsl", shader: "fn from_a() -> f32 { return 1.0; }\n"};
        WgslShaderModuleContent["mod_b"] = {path: "modules/b.wgsl", shader: "fn from_b() -> f32 { return 2.0; }\n"};
        WgslShaderModuleContent["two_imports"] = {
            shader: '#import "modules/a.wgsl"\n#import "modules/b.wgsl"\nfn main_fs() {}\n',
        };

        load("two_imports");

        expect(compiled).toContain("fn from_a()");
        expect(compiled).toContain("fn from_b()");
        expect(compiled.split("fn from_a()").length - 1).toBe(1);
        expect(compiled.split("fn from_b()").length - 1).toBe(1);
    });

    it("includes a repeated import path only once", () => {
        WgslShaderModuleContent["twice"] = {
            shader: '#import "modules/color_conversion.wgsl"\n#import "modules/color_conversion.wgsl"\nfn main_fs() {}\n',
        };

        load("twice");

        expect(compiled.split("fn linearToGamma").length - 1).toBe(1);
        expect(compiled).not.toMatch(/^[ \t]*#import[ \t]+"/m);
    });

    it("follows a module that itself imports another module", () => {
        WgslShaderModuleContent["mod_b"] = {path: "modules/b.wgsl", shader: "fn from_b() -> f32 { return 2.0; }\n"};
        WgslShaderModuleContent["mod_a"] = {
            path: "modules/a.wgsl",
            shader: '#import "modules/b.wgsl"\nfn from_a() -> f32 { return 1.0; }\n',
        };
        WgslShaderModuleContent["chained"] = {shader: '#import "modules/a.wgsl"\nfn main_fs() {}\n'};

        load("chained");

        expect(compiled).toContain("fn from_b()");
        expect(compiled).toContain("fn from_a()");
        expect(compiled).not.toMatch(/^[ \t]*#import[ \t]+"/m);
    });

    it("stops an import cycle without duplicating either module", () => {
        WgslShaderModuleContent["mod_a"] = {
            path: "modules/cycle_a.wgsl",
            shader: '#import "modules/cycle_b.wgsl"\nfn from_a() -> f32 { return 1.0; }\n',
        };
        WgslShaderModuleContent["mod_b"] = {
            path: "modules/cycle_b.wgsl",
            shader: '#import "modules/cycle_a.wgsl"\nfn from_b() -> f32 { return 2.0; }\n',
        };
        WgslShaderModuleContent["cycle"] = {shader: '#import "modules/cycle_a.wgsl"\n'};

        load("cycle");

        expect(compiled.split("fn from_a()").length - 1).toBe(1);
        expect(compiled.split("fn from_b()").length - 1).toBe(1);
    });

    it("inserts module source verbatim, including replacement metacharacters", () => {
        WgslShaderModuleContent["mod_dollar"] = {
            path: "modules/dollar.wgsl",
            shader: "fn kept() -> f32 { return 1.0; } // $&\n",
        };
        WgslShaderModuleContent["dollar_user"] = {shader: '#import "modules/dollar.wgsl"\n'};

        load("dollar_user");

        expect(compiled).toContain("fn kept() -> f32 { return 1.0; } // $&");
    });

    it("replaces every ##KEY## after imports, including text that came from a module", () => {
        WgslShaderModuleContent["mod_count"] = {
            path: "modules/count.wgsl",
            shader: "fn count_from_module() -> f32 { return f32(##COUNT##); }\n",
        };
        WgslShaderModuleContent["counted"] = {
            shader: '#import "modules/count.wgsl"\nfn count_from_shader() -> f32 { return f32(##COUNT##); }\nconst extra = ##COUNT##;\n',
        };

        load("counted", {COUNT: 4});

        expect(compiled).toContain("return f32(4);");
        expect(compiled).toContain("const extra = 4;");
        expect(compiled).not.toContain("##COUNT##");
        expect(compiled.split("f32(4)").length - 1).toBe(2);
    });

    it("leaves a single-quoted import line untouched", () => {
        const shader = "#import 'modules/color_conversion.wgsl'\nfn main_fs() {}\n";
        WgslShaderModuleContent["single_quotes"] = {shader};

        load("single_quotes");

        expect(compiled).toBe(shader);
    });

    it("throws when the import path is not registered and does not create a GPU shader module", () => {
        WgslShaderModuleContent["missing_module"] = {
            shader: '#import "modules/does_not_exist.wgsl"\n',
        };

        expect(() => load("missing_module")).toThrow(new Error('Module "modules/does_not_exist.wgsl" not found.'));
        expect(WebGpuUtilities.shaderModule.create).not.toHaveBeenCalled();
    });

    it("does not treat the content id as an import path", () => {
        WgslShaderModuleContent["by_id"] = {shader: '#import "color_conversion"\n'};

        expect(() => load("by_id")).toThrow(new Error('Module "color_conversion" not found.'));
    });

    it("throws the not-implemented error for an unknown id and for the shared module id", () => {
        expect(() => load("not_a_shader")).toThrow(new Error("WGSL shader 'not_a_shader' is not implemented for WebGPU."));
        expect(() => load("color_conversion")).toThrow(new Error("WGSL shader 'color_conversion' is not implemented for WebGPU."));
        expect(WebGpuUtilities.shaderModule.create).not.toHaveBeenCalled();
    });

    it("resolves an import without attaching the module onto other shader entries", () => {
        const before = Object.keys(WgslShaderModuleContent.sprite);
        load("main_frame_buffer");
        expect(Object.keys(WgslShaderModuleContent.sprite)).toEqual(before);
    });

    it("does not keep a debugger breakpoint in the injector", () => {
        const breakpoints = shaderModuleSource.split("\n").filter(line => line.trim() === "debugger;");
        expect(breakpoints).toEqual([]);
    });
});

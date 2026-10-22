import { describe, expect, it } from "vitest";
import type { IFramework, IUniformBuffer } from "../src/api/index.ts";
import { WebGlUnlitRenderPipeline } from "../src/webgl/render-pipelines/material/WebGlUnlitRenderPipeline.ts";
import { WebGlForwardBlinnPhongRenderPipeline } from "../src/webgl/render-pipelines/material/WebGlBlinnPhongRenderPipeline.ts";
import { WebGlInspectTextureMipsRenderPipeline } from "../src/webgl/render-pipelines/inspect/WebGlInspectTextureMipsRenderPipeline.ts";
import { WebGlRenderPipelineFactory } from "../src/webgl/render-pipelines/WebGlRenderPipelineFactory.ts";

// The constructors validate before touching WebGL, so no context is needed.
const framework = {} as IFramework;
const buffer = {} as IUniformBuffer;
const none = undefined as unknown as IUniformBuffer;

describe("WebGL pipelines require a model buffer", () => {
    it("WebGlUnlitRenderPipeline throws, naming itself", () => {
        expect(() => new WebGlUnlitRenderPipeline(framework, buffer, none, buffer))
            .toThrow("WebGlUnlitRenderPipeline: modelBuffer is required");
    });

    it("WebGlForwardBlinnPhongRenderPipeline throws, naming itself", () => {
        expect(() => new WebGlForwardBlinnPhongRenderPipeline(framework, buffer, none, buffer, undefined, buffer))
            .toThrow("WebGlForwardBlinnPhongRenderPipeline: modelBuffer is required");
    });

    it("WebGlInspectTextureMipsRenderPipeline throws, naming itself", () => {
        expect(() => new WebGlInspectTextureMipsRenderPipeline(framework, buffer, none, buffer))
            .toThrow("WebGlInspectTextureMipsRenderPipeline: modelBuffer is required");
    });

    it("the factory methods throw for a missing model buffer (JS callers)", () => {
        const factory = new WebGlRenderPipelineFactory(framework);
        expect(() => factory.createUnlitRenderPipeline(buffer, none, buffer)).toThrow("WebGlUnlitRenderPipeline: modelBuffer is required");
        expect(() => factory.createForwardBlinnPhongRenderPipeline({
            projectionViewBuffer: buffer, modelBuffer: none, materialBuffer: buffer, cameraPositionBuffer: buffer,
        })).toThrow("WebGlForwardBlinnPhongRenderPipeline: modelBuffer is required");
        expect(() => factory.createInspectTextureMipsRenderPipeline(buffer, none, buffer)).toThrow("WebGlInspectTextureMipsRenderPipeline: modelBuffer is required");
    });

    it("the modelBuffer setter rejects a missing buffer", () => {
        const proto = WebGlUnlitRenderPipeline.prototype as unknown as { modelBuffer: IUniformBuffer };
        const setter = Object.getOwnPropertyDescriptor(proto, "modelBuffer")!.set!;
        expect(() => setter.call({}, none)).toThrow("WebGlUnlitRenderPipeline: modelBuffer is required");
    });
});

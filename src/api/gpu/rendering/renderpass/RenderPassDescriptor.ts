import {RenderPassDepthStencilAttachment} from "./RenderPassDepthStencilAttachment.ts";
import {RenderPassColorAttachment} from "./RenderPassColorAttachment.ts";
import type { IGpuCommandEncoder } from "../../IGpuCommandEncoder.ts";

/** The render pass. */
export interface IRenderPassDescriptor {


    /** The command encoder to use. If not passed in, main command encoder is used. */
    commandEncoder?: IGpuCommandEncoder;

    /** The color attachments of the render pass. */
    colorAttachments?: RenderPassColorAttachment[];

    /** The depth-stencil attachment of the render pass. */
    depthStencilAttachment?: RenderPassDepthStencilAttachment;

    /**
     * The label of the render pass.
     * This is used for debugging purposes and can be set to any string that helps identify the render pass in graphics debuggers or profiling tools.
     * It does not affect the functionality of the render pass and can be left empty if not needed.
     */
    label?: string;

}

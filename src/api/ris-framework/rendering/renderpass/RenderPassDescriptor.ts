import {RenderPassDepthStencilAttachment} from "./RenderPassDepthStencilAttachment";
import {RenderPassColorAttachment} from "./RenderPassColorAttachment";

/**
 * The render pass.
 */
export class RenderPassDescriptor {

/**
 * The color attachments of the render pass.
 */
  public colorAttachments?: RenderPassColorAttachment[];

/**
 * The depth-stencil attachment of the render pass.
 */
  public  depthStencilAttachment?: RenderPassDepthStencilAttachment;

/**
 * The label of the render pass.
 * This is used for debugging purposes and can be set to any string that helps identify the render pass in graphics debuggers or profiling tools.
 * It does not affect the functionality of the render pass and can be left empty if not needed.
 */
  public label?: string;

}

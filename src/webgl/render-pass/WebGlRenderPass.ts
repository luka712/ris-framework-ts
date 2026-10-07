import type { IRenderPass } from "../../core/rendering/render-pass/render-pass-interface";
import { asWebGLTexture2D } from "../cast/cast";
import { WebGlUtilities } from "../utilities/WebGlUtilities.ts";
import type { WebGlGraphicsDevice } from "../WebGlGraphicsDevice.ts";
import {
    Color,
    LoadAction,
    RenderPassColorAttachment, RenderPassDepthStencilAttachment,
    RenderPassDescriptor,
    StoreAction,
    TextureFormat
} from "../../api/index.ts"

/**
 * The WeGL implementation of the IRenderPass interface. 
 */
export class WebGlRenderPass implements IRenderPass {

    private readonly _gl: WebGL2RenderingContext;

    private _colorAttachmentsCount = 0;
    private _clearColors: Color[] = [];
    private _frameBuffer: WebGLFramebuffer | null = null;
    private _depthStencilRenderBuffer: WebGLRenderbuffer | null = null;
    private _clearBufferMask: GLbitfield = 0;
    private _enableDepthTest = false;
    private _enableStencilTest = false;
    private _clearDepth = 0;
    private _clearStencil = 0;
    private _discardAttachments: GLenum[] = [];

    /**
     * The constructor.
     * @param graphicsDevice The graphics device.
     * @param descriptor The render pass descriptor.
     */
    public constructor(graphicsDevice: WebGlGraphicsDevice, descriptor: RenderPassDescriptor) {
        this._gl = graphicsDevice.gl;

        this._setupFrameBuffer(descriptor.colorAttachments ?? []);
        if (descriptor.depthStencilAttachment) {
            this._setupDepthStencilAttachment(descriptor.depthStencilAttachment, descriptor.colorAttachments);
        }
    }

    private _setupFrameBuffer(colorAttachments: RenderPassColorAttachment[]): void {
        this._colorAttachmentsCount = colorAttachments.length;
        this._clearColors = [];

        for (let i = 0; i < this._colorAttachmentsCount; i++) {
            const colorAttachment = colorAttachments[i];
            this._clearColors.push(colorAttachment.clearColor);
            if (colorAttachment.loadAction == LoadAction.CLEAR) {
                this._clearBufferMask |= this._gl.COLOR_BUFFER_BIT;
            }
            if (colorAttachment.storeAction == StoreAction.DISCARD) {
                this._discardAttachments.push(this._gl.COLOR_ATTACHMENT0 + i);
            }

            // If the color attachment is a swapchain, we don't need to create a framebuffer,
            // as we'll be rendering directly to the default framebuffer.
            if (colorAttachment.swapChain) {
                this._frameBuffer = null; // Default framebuffer
                return;
            }
        }

        var glColorAttachments = []
        for (let i = 0; i < this._colorAttachmentsCount; i++) {
            var colorAttachment = colorAttachments[i];
            var texture = asWebGLTexture2D(colorAttachment.texture!);
            if (!texture) {
                throw new Error("Texture must be provided for non-swapchain color attachments.");
            }

            glColorAttachments[i] = texture.glTexture;
        }

        // TODO : pass label
        this._frameBuffer = WebGlUtilities.framebuffer.create(this._gl, glColorAttachments)
    }

    private _setupDepthStencilAttachment(depthStencilAttachment?: RenderPassDepthStencilAttachment, colorAttachments: RenderPassColorAttachment[] = []): void {

        if (!depthStencilAttachment) {
            return;
        }

        // DEPTH
        this._clearDepth = depthStencilAttachment.depthClearValue;
        if (depthStencilAttachment.depthLoadAction == LoadAction.CLEAR) {
            this._clearBufferMask |= this._gl.DEPTH_BUFFER_BIT;
            this._enableDepthTest = true;
        }
        if (depthStencilAttachment.depthStoreAction == StoreAction.DISCARD) {
            this._discardAttachments.push(this._gl.DEPTH_ATTACHMENT);
        }

        // STENCIL
        this._clearStencil = depthStencilAttachment.stencilClearValue;
        if (depthStencilAttachment.stencilLoadAction == LoadAction.CLEAR) {
            this._clearBufferMask |= this._gl.STENCIL_BUFFER_BIT;
            this._enableStencilTest = true;
        }
        if (depthStencilAttachment.stencilStoreAction == StoreAction.DISCARD) {
            this._discardAttachments.push(this._gl.STENCIL_ATTACHMENT);
        }

        var texture = depthStencilAttachment.texture;

        // We do allow depth-stencil attachment to be null, in which case the framebuffer will be created with renderbuffers instead of textures.
        // This is useful for intermediate render passes that don't need to sample from the depth-stencil attachment.
        if (!texture) {
            if (this._enableDepthTest || this._enableStencilTest) {
                var format = TextureFormat.DEPTH_24_STENCIL_8;

                if (!this._enableDepthTest) {
                    // TODO: Implement this.
                    throw new Error("Not implemented");
                }
                else if (!this._enableStencilTest) {
                    format = TextureFormat.DEPTH_32_FLOAT;
                }
                var colorTex = colorAttachments[0].texture!;
                this._depthStencilRenderBuffer = WebGlUtilities.renderBuffer.create(this._gl, format, colorTex.width, colorTex.height, null);
                WebGlUtilities.framebuffer.attachDepthStencilRenderBuffer(this._gl, this._frameBuffer!, this._depthStencilRenderBuffer, format);
            }
        }
        // Otherwise, we attach the provided depth-stencil texture to the framebuffer.
        else {
            var glTexture = asWebGLTexture2D(texture);
            WebGlUtilities.framebuffer.attachDepthStencilTexture(this._gl, this._frameBuffer!, glTexture.glTexture, glTexture.textureFormat);
        }
    }

    /** @inheritdoc */
    public beginPass(): void {
        const gl = this._gl;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
        
        // COLOR
        gl.clear(this._clearBufferMask);

        if (this._enableDepthTest) {
            gl.enable(gl.DEPTH_TEST);
            gl.clearDepth(this._clearDepth);
            gl.depthFunc(gl.LEQUAL);
        } else {
            gl.disable(gl.DEPTH_TEST);
        }

        if (this._enableStencilTest) {
            gl.enable(gl.STENCIL_TEST);
            gl.clearStencil(this._clearStencil);
            gl.stencilFunc(gl.ALWAYS, 0, 0xFF);
        } else {
            gl.disable(gl.STENCIL_TEST);
        }

        for (let i = 0; i < this._colorAttachmentsCount; i++) {
            gl.clearBufferfv(gl.COLOR, i, this._clearColors[i]);
        }
    }

    /** @inheritdoc */
    public endPass(): void {

        const gl = this._gl;
        if (this._discardAttachments.length > 0) {
            gl.invalidateFramebuffer(gl.FRAMEBUFFER, this._discardAttachments);
        }
    }

    /** @inheritdoc */
    public dispose(): void {
        if (this._frameBuffer) {
            this._gl.deleteFramebuffer(this._frameBuffer);
            this._frameBuffer = null!;
        }
        if (this._depthStencilRenderBuffer) {
            this._gl.deleteRenderbuffer(this._depthStencilRenderBuffer);
            this._depthStencilRenderBuffer = null;
        }
    }
}
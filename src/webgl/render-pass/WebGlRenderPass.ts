import { asWebGLTexture2D } from "../cast/cast";
import { WebGlUtilities } from "../utilities/WebGlUtilities.ts";
import type { WebGlGraphicsDevice } from "../WebGlGraphicsDevice.ts";
import {
    Color,
    type IRenderPass,
    LoadAction,
    RenderPassColorAttachment, RenderPassDepthStencilAttachment,
    RenderPassDescriptor,
    StoreAction,
    TextureFormat
} from "../../api"

/**
 * The WebGL implementation of the IRenderPass interface.
 */
export class WebGlRenderPass implements IRenderPass {

    private readonly _gl: WebGL2RenderingContext;

    private _colorAttachmentsCount = 0;
    private _colorAttachments: RenderPassColorAttachment[] = [];
    private _clearColors: Color[] = [];
    private _clearColorAttachment: boolean[] = [];
    private _frameBuffer: WebGLFramebuffer | null = null;
    private _depthStencilRenderBuffer: WebGLRenderbuffer | null = null;
    private _clearBufferMask: GLbitfield = 0;
    private _enableDepthTest = false;
    private _enableStencilTest = false;
    private _clearDepth = 0;
    private _clearStencil = 0;
    private _colorDiscardAttachments: GLenum[] = [];
    private _depthStencilDiscardAttachments: GLenum[] = [];
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

    /**
     * Replaces the color attachment at the index and re-attaches its texture to the framebuffer.
     * WebGL2 does not support texture views: `value.view` must be undefined (use `value.texture`).
     * Not supported for swap chain (default framebuffer) passes.
     * @inheritDoc
     */
    public setColorAttachment(index: number, value: RenderPassColorAttachment): void {
        if (index < 0 || index >= this._colorAttachmentsCount) {
            throw new Error(`WebGlRenderPass: color attachment index ${index} is out of range [0, ${this._colorAttachmentsCount - 1}].`);
        }
        if (!this._frameBuffer || value.swapChain) {
            throw new Error("WebGlRenderPass: setColorAttachment is not supported for swap chain (default framebuffer) attachments.");
        }

        const gl = this._gl;
        const glTexture = this._getGlTexture(value);

        this._colorAttachments[index] = value;
        this._updateColorState();

        // Keep the current binding, in case this is called in the middle of a pass.
        const previous = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
        WebGlUtilities.framebuffer.setColorAttachment(gl, this._frameBuffer, index, glTexture);
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        gl.bindFramebuffer(gl.FRAMEBUFFER, previous);
        if (status != gl.FRAMEBUFFER_COMPLETE) {
            throw new Error("WebGlRenderPass: framebuffer is not complete after setColorAttachment. WebGL status: " + status);
        }
    }

    /**
     * The WebGL texture to attach. Views are not supported on WebGL2 (`supportsTextureView` is false).
     */
    private _getGlTexture(colorAttachment: RenderPassColorAttachment): WebGLTexture {
        if (colorAttachment.view) {
            throw new Error(
                "WebGlRenderPass: texture views are not supported on WebGL2 " +
                "(graphicsDevice.features.supportsTextureView is false). Set RenderPassColorAttachment.texture instead."
            );
        }
        if (!colorAttachment.texture) {
            throw new Error("WebGlRenderPass: a texture must be provided for non-swapchain color attachments.");
        }
        return asWebGLTexture2D(colorAttachment.texture).glTexture;
    }

    /** Rebuilds clear colors, clear flags and color discards from the color attachments. */
    private _updateColorState(): void {
        this._clearColors = [];
        this._clearColorAttachment = [];
        this._colorDiscardAttachments = [];
        this._clearBufferMask &= ~this._gl.COLOR_BUFFER_BIT;

        for (let i = 0; i < this._colorAttachmentsCount; i++) {
            const colorAttachment = this._colorAttachments[i];
            this._clearColors.push(colorAttachment.clearColor);
            const clear = colorAttachment.loadAction == LoadAction.CLEAR;
            this._clearColorAttachment.push(clear);
            if (clear) {
                this._clearBufferMask |= this._gl.COLOR_BUFFER_BIT;
            }
            if (colorAttachment.storeAction == StoreAction.DISCARD) {
                this._colorDiscardAttachments.push(this._gl.COLOR_ATTACHMENT0 + i);
            }
        }
        this._discardAttachments = [...this._colorDiscardAttachments, ...this._depthStencilDiscardAttachments];
    }

    private _setupFrameBuffer(colorAttachments: RenderPassColorAttachment[]): void {
        this._colorAttachmentsCount = colorAttachments.length;
        this._colorAttachments = colorAttachments.slice();
        this._updateColorState();

        // If the color attachment is a swapchain, we don't need to create a framebuffer,
        // as we'll be rendering directly to the default framebuffer.
        if (colorAttachments.some(colorAttachment => colorAttachment.swapChain)) {
            this._frameBuffer = null; // Default framebuffer
            return;
        }

        const glColorAttachments = [];
        for (let i = 0; i < this._colorAttachmentsCount; i++) {
            glColorAttachments[i] = this._getGlTexture(colorAttachments[i]);
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
            this._depthStencilDiscardAttachments.push(this._gl.DEPTH_ATTACHMENT);
        }

        // STENCIL
        this._clearStencil = depthStencilAttachment.stencilClearValue;
        if (depthStencilAttachment.stencilLoadAction == LoadAction.CLEAR) {
            this._clearBufferMask |= this._gl.STENCIL_BUFFER_BIT;
            this._enableStencilTest = true;
        }
        if (depthStencilAttachment.stencilStoreAction == StoreAction.DISCARD) {
            this._depthStencilDiscardAttachments.push(this._gl.STENCIL_ATTACHMENT);
        }
        this._discardAttachments = [...this._colorDiscardAttachments, ...this._depthStencilDiscardAttachments];

        var texture = depthStencilAttachment.texture;

        // We do allow depth-stencil attachment to be null, in which case the framebuffer will be created with renderbuffers instead of textures.
        // This is useful for intermediate render passes that don't need to sample from the depth-stencil attachment.
        if (!texture) {
            if (this._enableDepthTest || this._enableStencilTest) {
                var format = TextureFormat.DEPTH24_PLUS_STENCIL8;

                if (!this._enableDepthTest) {
                    // TODO: Implement this.
                    throw new Error("Not implemented");
                }
                else if (!this._enableStencilTest) {
                    format = TextureFormat.DEPTH32_FLOAT;
                }
                var colorTex = colorAttachments[0].texture!;
                this._depthStencilRenderBuffer = WebGlUtilities.renderBuffer.create(this._gl, format, colorTex.nativeSize[0], colorTex.nativeSize[1], null);
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

        // Clear after clearDepth and clearStencil are set, so gl.clear uses this pass's values.
        if (this._clearBufferMask !== 0) {
            gl.clear(this._clearBufferMask);
        }

        // COLOR. Attachments with LoadAction.LOAD keep their contents.
        for (let i = 0; i < this._colorAttachmentsCount; i++) {
            if (this._clearColorAttachment[i]) {
                gl.clearBufferfv(gl.COLOR, i, this._clearColors[i]);
            }
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
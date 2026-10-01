import {TextureFormat} from "ris-framework-api";


/**
 * This file defines the WebGLFrameBufferUtilities class, which provides utility functions for working with WebGL framebuffers.
 * The WebGLFrameBufferUtilities class includes methods for creating framebuffers with specific configurations, such as attaching textures as color and depth attachments.
 * These utilities simplify the process of setting up framebuffers for rendering to textures, which is a common technique in graphics programming for effects like render-to-texture, post-processing, and off-screen rendering.
 */
export class WebGlFrameBufferUtilities {


    /**
     * Creates a framebuffer and attaches the provided texture(s) as color attachments. 
     * This method is useful for setting up a framebuffer for rendering to one or more textures.
     * @param gl The WebGL2 rendering context.
     * @param textureIds The texture(s) to be attached as color attachments.
     * @param framebufferLabel An optional label for the framebuffer, which can be used for debugging purposes.
     * @returns The created framebuffer.
     */
    public create(gl: WebGL2RenderingContext, textureIds: WebGLTexture[] | WebGLTexture, framebufferLabel: string | null = null): WebGLFramebuffer {
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        // -- LABEL FRAMEBUFFER
        if (framebufferLabel) {
            // @ts-ignore
            framebuffer.__SPECTOR_Metadata = {
                name: framebufferLabel,
            };
        }

        var textureIdsArray = [];
        if (textureIds instanceof WebGLTexture) {
            textureIdsArray.push(textureIds);
        } else {
            textureIdsArray = textureIds;
        }

        for (let i = 0; i < textureIdsArray.length; i++) {
            const textureId = textureIdsArray[i];

            if(textureId == null) {
                throw new Error("Cannot bind texture to the frame buffer. Texture id not specified");
            }

            // Bind the texture to the framebuffer, so we can render to it.
            gl.bindTexture(gl.TEXTURE_2D, textureId);

            // Connect the texture to the framebuffer.
            gl.framebufferTexture2D(gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0 + i,
                gl.TEXTURE_2D,
                textureId,
                0);
        }

        // Check if the framebuffer is complete.
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
            var error = gl.getError();
            throw new Error("Framebuffer is not complete." + " WebGL error code: " + error);
        }

        return framebuffer;
    }

    /**
     * Creates a framebuffer with texture being attached as color attachment 0 and depth render buffer.
     * @param gl The WebGL2 rendering context.
     * @param textureAttachment0 The texture to be attached as color attachment 0.
     * @param depthAttachmentType The type of the depth attachment, which can be DepthAttachment, DepthStencilAttachment or StencilAttachment.
     * @param depthStencilRenderBuffer The render buffer to be attached as the depth/stencil attachment.
     * @param label An optional label for the framebuffer, which can be used for debugging purposes.
     * @return The created framebuffer.
     */
    public createWithRenderBufferAsDepthBuffer(gl: WebGL2RenderingContext,
        textureAttachment0: WebGLTexture,
        depthAttachmentType: GLenum,
        depthStencilRenderBuffer: WebGLRenderbuffer, label: string | null | undefined): WebGLFramebuffer {

        if (depthAttachmentType != gl.DEPTH_ATTACHMENT
            && depthAttachmentType != gl.DEPTH_STENCIL_ATTACHMENT
            && depthAttachmentType != gl.STENCIL_ATTACHMENT) {
            const msg = "Invalid depth attachment type + " + depthAttachmentType;
            throw new Error(msg);
        }

        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        // Connect the texture to the framebuffer.
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            textureAttachment0,
            0);

        // Connect the render buffer to the framebuffer.
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER,
            depthAttachmentType,
            gl.RENDERBUFFER,
            depthStencilRenderBuffer);

        // Check if the framebuffer is complete.
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
            const msg = "Framebuffer is not complete.";
            throw new Error(msg);
        }

        if (label) {
            // @ts-ignore
            framebuffer.__SPECTOR_Metadata = {
                name: label,
            };
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return framebuffer;
    }

    /**
     * Creates a framebuffer with texture being attached as color attachment 0 and depth render buffer.
     * @param gl The WebGL2 rendering context.
     * @param textureAttachment0 The texture to be attached as color attachment 0.
     * @param depthAttachmentType The type of the depth attachment, which can be DepthAttachment, DepthStencilAttachment or StencilAttachment.
     * @param depthStencilTexture The texture to be attached as the depth/stencil attachment.
     * @param label An optional label for the framebuffer, which can be used for debugging purposes.
     * @returns The created framebuffer.
     */
    public createWithRenderTextureAsDepthBuffer(gl: WebGL2RenderingContext,
        textureAttachment0: WebGLTexture,
        depthAttachmentType: GLenum,
        depthStencilTexture: WebGLTexture,
        label?: string): WebGLFramebuffer {
        if (depthAttachmentType != gl.DEPTH_ATTACHMENT
            && depthAttachmentType != gl.DEPTH_STENCIL_ATTACHMENT
            && depthAttachmentType != gl.STENCIL_ATTACHMENT) {
            const msg = "Invalid depth attachment type.";
            throw new Error(msg);
        }

        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        // Connect the texture to the framebuffer.
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            textureAttachment0,
            0);

        // Connect the render buffer to the framebuffer.
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
            depthAttachmentType,
            gl.TEXTURE_2D,
            depthStencilTexture,
            0);

        // Check if the framebuffer is complete.
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
            const msg = "Framebuffer is not complete.";
            throw new Error(msg);
        }

        if (label) {

            // @ts-ignore
            framebuffer.__SPECTOR_Metadata = {
                name: label,
            };
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return framebuffer;
    }

    /**
     * Attaches a depth/stencil render buffer to the framebuffer.
     * @param gl The WebGL2 rendering context.
     * @param frameBuffer The framebuffer to which the depth/stencil render buffer will be attached.
     * @param depthStencilRenderBuffer The depth/stencil render buffer to be attached.
     * @param format The format of the depth/stencil render buffer, which determines the type of attachment (depth, stencil, or depth-stencil).
     */
    public attachDepthStencilRenderBuffer(
        gl: WebGL2RenderingContext,
        frameBuffer: WebGLFramebuffer,
        depthStencilRenderBuffer: WebGLRenderbuffer,
        format: TextureFormat): void {

        var depthStencilAttachmentType = null;
        switch (format) {
            case TextureFormat.DEPTH_32_FLOAT:
                depthStencilAttachmentType = gl.DEPTH_ATTACHMENT;
                break;
            case TextureFormat.DEPTH_24_STENCIL_8:
                depthStencilAttachmentType = gl.DEPTH_STENCIL_ATTACHMENT;
                break;
            default:
                throw new Error(`Unsupported depth/stencil texture format.`);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        // Connect the render buffer to the framebuffer.
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER,
            depthStencilAttachmentType,
            gl.RENDERBUFFER,
            depthStencilRenderBuffer);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }


    /**
     * Attaches a depth/stencil texture to the framebuffer.
     * @param gl The WebGL2 rendering context.
     * @param frameBuffer The framebuffer to which the depth/stencil texture will be attached.
     * @param depthStencilTexture The depth/stencil texture to be attached.
     * @param textureFormat The format of the depth/stencil texture, which determines the type of attachment (depth, stencil, or depth-stencil).
     */
    public attachDepthStencilTexture(
        gl: WebGL2RenderingContext,
        frameBuffer: WebGLFramebuffer,
        depthStencilTexture: WebGLTexture,
        textureFormat: TextureFormat): void {
        var depthStencilAttachmentType = null;
        switch (textureFormat) {
            case TextureFormat.DEPTH_32_FLOAT:
                depthStencilAttachmentType = gl.DEPTH_ATTACHMENT;
                break;
            case TextureFormat.DEPTH_24_STENCIL_8:
                depthStencilAttachmentType = gl.DEPTH_STENCIL_ATTACHMENT;
                break;
            default:
                throw new Error(`Unsupported depth/stencil texture format.`);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, depthStencilAttachmentType, gl.TEXTURE_2D, depthStencilTexture, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}

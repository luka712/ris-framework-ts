import type {IRenderableMesh} from "../meshes/IRenderableMesh.ts";
import type {ITexture2D} from "../rendering/texture/ITexture2D.ts";
import type {ISampler} from "../rendering/sampler/ISampler.ts";
import {GeometryFormat} from "../geometry/GeometryFormat.ts";
import type {IUniformBuffer} from "../rendering/buffers/IUniformBuffer.ts";
import type {IIndexBuffer} from "../rendering/buffers/IIndexBuffer.ts";
import type {IVertexBuffer} from "../rendering/buffers/IVertexBuffer.ts";
import type {IFramework} from "../IFramework.ts";
import {BufferUsage} from "../rendering/buffers/BufferUsage.ts";
import {Color} from "../data/Color.ts";
import type {IPrimitiveState} from "../rendering/primitive/IPrimitiveState.ts";
import type {ICamera} from "../camera/ICamera.ts";
import type {LightsBuffer} from "../lights/LightsBuffer.ts";
import type {AmbientLight} from "../lights/AmbientLight.ts";
import type {DirectionalLight} from "../lights/DirectionalLight.ts";
import type {PointLight} from "../lights/PointLight.ts";
import type {IMaterial} from "./IMaterial.ts";
import type {ILightsMaterial} from "./ILightsMaterial.ts";
import type {IForwardBlinnPhongRenderPipeline} from "../rendering/render-pipelines/IForwardBlinnPhongRenderPipeline.ts";

/**
 * The additional material config options.
 * @public
 **/
export class ForwardBlinnPhongMaterialDescriptor {

    /** The primitive state. */
    public primitiveState?: IPrimitiveState;

    /** The projection view buffer. */
    public projectionViewBuffer!: IUniformBuffer;

    /** The camera position buffer. */
    public cameraPositionBuffer!: IUniformBuffer;
}


/**
 * The Blinn-Phong material with forward calculated lighting.
 * @public
 */
export class ForwardBlinnPhongMaterial implements IMaterial, ILightsMaterial {

    /** The directional light slots of the material's lights buffer and shader. */
    public static readonly MAX_DIRECTIONAL_LIGHTS = 3;

    /** The point light slots of the material's lights buffer and shader. */
    public static readonly MAX_POINT_LIGHTS = 5;

    private readonly _framework: IFramework;

    private readonly _lightsBuffer: LightsBuffer;
    private _diffuseColorCache: Color;
    private _ambientColorCache: Color;
    private _specularColorCache: Color;
    private _shininessCache: number;

    // std140: each vec3 starts on a 16-byte boundary, so pad each colour to 4 floats.
    private _materialData = [
        0.1, 0.1, 0.1, 0, // Ambient
        0.8, 0.8, 0.8, 0, // Diffuse
        0.5, 0.5, 0.5, 32, // Specular, shininess (the float fills the vec3's padding)
    ];

    /** Created when the model buffer is assigned (the pipeline requires one). */
    private _pipeline?: IForwardBlinnPhongRenderPipeline;
    private readonly _primitiveState?: IPrimitiveState;
    /** Texture and sampler set before the pipeline exists; applied when it is created. */
    private _pendingTexture?: ITexture2D;
    private _pendingSampler?: ISampler;
    private _samplerSet = false;
    private _projectionViewBuffer: IUniformBuffer;
    private _camera?: ICamera;
    private _cameraPositionBuffer: IUniformBuffer;
    private _materialBuffer: IUniformBuffer;
    private _modelBuffer?: IUniformBuffer;

    /**
     * The constructor.
     * @param framework The framework.
     * @param descriptor The material descriptor. Its projection view and camera position buffers are shared and are not disposed by this material.
     * @throws Error when `descriptor`, `descriptor.projectionViewBuffer` or `descriptor.cameraPositionBuffer` is missing.
     */
    public constructor(framework: IFramework, descriptor: ForwardBlinnPhongMaterialDescriptor) {

        // Runtime check: JavaScript callers can omit the required buffers.
        const missing = [
            descriptor?.projectionViewBuffer ? undefined : "descriptor.projectionViewBuffer",
            descriptor?.cameraPositionBuffer ? undefined : "descriptor.cameraPositionBuffer",
        ].filter(x => x !== undefined);
        if (missing.length > 0) {
            throw new Error(`ForwardBlinnPhongMaterial: ${missing.join(" and ")} ${missing.length > 1 ? "are" : "is"} required (e.g. camera.projectionViewBuffer and camera.positionBuffer).`);
        }

        this._framework = framework;
        const usage = BufferUsage.UNIFORM | BufferUsage.COPY_DST;
        this._diffuseColorCache = this.diffuseColor.copy();
        this._ambientColorCache = this.ambientColor.copy();
        this._specularColorCache = this.specularColor.copy();
        this._shininessCache = this.shininess;
        this._projectionViewBuffer = descriptor.projectionViewBuffer;
        this._cameraPositionBuffer = descriptor.cameraPositionBuffer;
        this._materialBuffer = framework.bufferFactory.createUniformBuffer(this._materialData, usage);
        this._primitiveState = descriptor.primitiveState;
        // Owned by the material, like C#: 3 directional + 5 point slots (88 floats), uploaded only when the lights changed.
        this._lightsBuffer = framework.lightsFactory.__createLightsBuffer({
            maxDirectionalLights: ForwardBlinnPhongMaterial.MAX_DIRECTIONAL_LIGHTS,
            maxPointLights: ForwardBlinnPhongMaterial.MAX_POINT_LIGHTS,
        });
        // The pipeline is created once a model buffer is assigned (see modelBuffer).
    }

    /** Creates the pipeline with the current bindings. */
    private _createPipeline(modelBuffer: IUniformBuffer): IForwardBlinnPhongRenderPipeline {
        const pipeline = this._framework.renderPipelineFactory.createForwardBlinnPhongRenderPipeline({
            projectionViewBuffer: this._projectionViewBuffer,
            modelBuffer,
            materialBuffer: this._materialBuffer,
            cameraPositionBuffer: this._cameraPositionBuffer,
            lightsBuffer: this._lightsBuffer.buffer,
            maxDirectionalLights: this._lightsBuffer.maxDirectionalLights,
            maxPointLights: this._lightsBuffer.maxPointLights,
            primitiveState: this._primitiveState,
        });
        if (this._pendingTexture) {
            pipeline.diffuseTexture = this._pendingTexture;
        }
        if (this._samplerSet) {
            pipeline.diffuseTextureSampler = this._pendingSampler;
        }
        this._pipeline = pipeline;
        return pipeline;
    }

    /**
     * The ambient color of this material.
     * Alpha is ignored. By default, it is (0.1,0.1,0.1).
     */
    public ambientColor: Color = new Color(0.1, 0.1, 0.1);

    /**
     * The diffuse color of this material.
     * Alpha is ignored. By default, it is (0.8,0.8,0.8).
     */
    public diffuseColor: Color = new Color(0.8, 0.8, 0.8);

    /**
     * The specular color of this material (MTL `Ks`).
     * Alpha is ignored. By default, it is (0.5,0.5,0.5).
     */
    public specularColor: Color = new Color(0.5, 0.5, 0.5);

    /**
     * The specular exponent (MTL `Ns`). Higher values give smaller, sharper highlights. By default, it is 32.
     */
    public shininess = 32;

    /**
     * The camera. Setting it binds the camera's projection view and position buffers to the pipeline
     * (used by the scene when its camera changes). Setting undefined keeps the last bound buffers.
     * Undefined until set: the constructor only takes the buffers.
     */
    public get camera(): ICamera | undefined {
        return this._camera;
    }

    /** @inheritDoc */
    public set camera(camera: ICamera | undefined) {
        if (camera === this._camera) {
            return;
        }
        this._camera = camera;
        if (!camera) {
            return;
        }
        if (this._projectionViewBuffer !== camera.projectionViewBuffer) {
            this._projectionViewBuffer = camera.projectionViewBuffer;
            if (this._pipeline) {
                this._pipeline.projectionViewBuffer = this._projectionViewBuffer;
            }
        }
        if (this._cameraPositionBuffer !== camera.positionBuffer) {
            this._cameraPositionBuffer = camera.positionBuffer;
            if (this._pipeline) {
                this._pipeline.cameraPositionBuffer = this._cameraPositionBuffer;
            }
        }
    }

    /** @inheritDoc Defaults to a black ambient light; a `Scene` assigns its active ambient light. */
    public get ambientLight(): AmbientLight {
        return this._lightsBuffer.ambientLight;
    }

    public set ambientLight(value: AmbientLight) {
        this._lightsBuffer.ambientLight = value;
    }

    /** @inheritDoc Only the first 3 are used. A `Scene` assigns its own list. */
    public get directionalLights(): DirectionalLight[] {
        return this._lightsBuffer.directionalLights;
    }

    public set directionalLights(value: DirectionalLight[]) {
        this._lightsBuffer.directionalLights = value;
    }

    /** @inheritDoc Only the first 5 are used. A `Scene` assigns its own list. */
    public get pointLights(): PointLight[] {
        return this._lightsBuffer.pointLights;
    }

    public set pointLights(value: PointLight[]) {
        this._lightsBuffer.pointLights = value;
    }

    /**
     * The texture to inspect.
     */
    public get diffuseTexture(): ITexture2D {
        return this._pipeline?.diffuseTexture ?? this._pendingTexture!;
    }

    /**
     * The texture to inspect.
     */
    public set diffuseTexture(value: ITexture2D) {
        this._pendingTexture = value;
        if (this._pipeline) {
            this._pipeline.diffuseTexture = value;
        }
    }

    /**
     * The texture sampler.
     */
    public get diffuseTextureSampler(): ISampler | undefined {
        return this._pipeline ? this._pipeline.diffuseTextureSampler : this._pendingSampler;
    }

    /**
     * The texture sampler.
     */
    public set diffuseTextureSampler(value: ISampler | undefined) {
        this._pendingSampler = value;
        this._samplerSet = true;
        if (this._pipeline) {
            this._pipeline.diffuseTextureSampler = value;
        }
    }

    /**
     * The model buffer (std140 `mat4`). Owned by the mesh, which assigns it before drawing; never disposed by this material.
     * Undefined until assigned: rendering without one throws.
     */
    public get modelBuffer(): IUniformBuffer | undefined {
        return this._modelBuffer;
    }

    /** Binds the model buffer to the pipeline. */
    public set modelBuffer(value: IUniformBuffer | undefined) {
        if (value === this._modelBuffer) {
            return;
        }
        this._modelBuffer = value;
        if (!value) {
            return;
        }
        if (this._pipeline) {
            this._pipeline.modelBuffer = value;
        } else {
            this._createPipeline(value);
        }
    }

    /**
     * The geometry format.
     */
    public readonly geometryFormat = GeometryFormat.POS3_COLOR4_TEXTURECOORDS2_NORMAL3;

    /** @inheritDoc */
    public beforeRender(): void {
        this._lightsBuffer.update();


        if (!this._diffuseColorCache.equals(this.diffuseColor)
            || !this._ambientColorCache.equals(this.ambientColor)
            || !this._specularColorCache.equals(this.specularColor)
            || this._shininessCache !== this.shininess) {
            this._ambientColorCache.set(this.ambientColor);
            this._diffuseColorCache.set(this.diffuseColor);
            this._specularColorCache.set(this.specularColor);
            this._shininessCache = this.shininess;
            this._materialData[0] = this._ambientColorCache.r;
            this._materialData[1] = this._ambientColorCache.g;
            this._materialData[2] = this._ambientColorCache.b;
            this._materialData[4] = this._diffuseColorCache.r;
            this._materialData[5] = this._diffuseColorCache.g;
            this._materialData[6] = this._diffuseColorCache.b;
            this._materialData[8] = this._specularColorCache.r;
            this._materialData[9] = this._specularColorCache.g;
            this._materialData[10] = this._specularColorCache.b;
            this._materialData[11] = this._shininessCache;
            this._materialBuffer.update(this._materialData);
        }
    }

    /** @inheritDoc */
    public renderMesh(mesh: IRenderableMesh): void {
        this.render(mesh.vertexBuffer!, mesh.indexBuffer!, mesh.indexCount ?? -1, mesh.indexStart ?? 0);
    }

    /** @inheritDoc */
    public render(vertexBuffer: IVertexBuffer, indexBuffer: IIndexBuffer, indicesCount?: number, indicesOffset?: number): void {
        if (!this._modelBuffer) {
            throw new Error("ForwardBlinnPhongMaterial: no modelBuffer. Render it through a mesh (the mesh assigns its model buffer) or set material.modelBuffer.");
        }
        (this._pipeline ?? this._createPipeline(this._modelBuffer)).render(vertexBuffer, indexBuffer, indicesCount, indicesOffset);
    }

    /** @inheritDoc */
    public dispose(): void {
        this._pipeline?.dispose();
        this._pipeline = undefined;
        this._materialBuffer.dispose();
        this._lightsBuffer.dispose();
    }
}

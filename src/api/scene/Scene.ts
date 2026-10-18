import {AmbientLight} from "../lights/AmbientLight.ts";
import {DirectionalLight} from "../lights/DirectionalLight.ts";
import {PointLight} from "../lights/PointLight.ts";
import type {IDisposable} from "../core/IDisposable.ts";
import type {LightsBuffer} from "../lights/LightsBuffer.ts";
import type {IFramework} from "../IFramework.ts";
import type {IMesh} from "../meshes/IMesh.ts";
import type {GameTime} from "../time/GameTime.ts";
import type {ICamera} from "../camera/ICamera.ts";
import type {IMaterial} from "../material/IMaterial.ts";

/** Anything a scene can hold: a mesh, a light (ambient, directional, point) or a camera. */
export type SceneItem = IMesh | AmbientLight | DirectionalLight | PointLight | ICamera;

/**
 * The scene. Meshes, lights and cameras given a scene in their constructor add themselves through {@link add};
 * meshes remove themselves when disposed. Call {@link update} once per frame and {@link render} in the render listener.
 */
export class Scene implements IDisposable {

    private readonly _meshes: IMesh[] = [];
    private _activeAmbientLight: AmbientLight;
    private _disposed = false;
    private _activeCamera?: ICamera;

    /**
     * The camera the scene renders with; undefined until one is set or added.
     * Setting it assigns it to the materials of every mesh (and submesh) whose camera differs;
     * {@link update} also assigns it to meshes and submeshes added later.
     */
    public get camera(): ICamera | undefined {
        return this._activeCamera;
    }

    public set camera(value: ICamera | undefined) {
        this._activeCamera = value;
        if (!value) {
            return;
        }
        for (const mesh of this._meshes) {
            Scene._assignCameraToMesh(mesh, value);
        }
    }

    /** The ambient lights registered with this scene. */
    public readonly ambientLights: AmbientLight[] = [];

    /**
     * The constructor.
     * @param framework The framework.
     */
    public constructor(framework: IFramework) {

        // Assigned through add() by the ambient light constructor; set here for the type checker.
        this._activeAmbientLight = framework.lightsFactory.createAmbientLight(undefined, this);

        this.__forwardLightsBuffer = framework.lightsFactory.__createLightsBuffer({
            ambientLight: this._activeAmbientLight,
            maxDirectionalLights: 3,
            maxPointLights: 5
        });

    }

    /**
     * The lights buffer used for forward shading.
     * @internal
     */
    __forwardLightsBuffer: LightsBuffer;

    /** The meshes in this scene, in the order they were added. */
    public get meshes(): readonly IMesh[] {
        return this._meshes;
    }

    /** The directional lights in this scene. */
    public get directionalLights(): readonly DirectionalLight[] {
        return this.__forwardLightsBuffer.directionalLights;
    }

    /** The point lights in this scene. */
    public get pointLights(): readonly PointLight[] {
        return this.__forwardLightsBuffer.pointLights;
    }

    /**
     * Gets the active ambient light.
     */
    public get activeAmbientLight(): AmbientLight {
        return this._activeAmbientLight;
    }

    /** Sets the active ambient light; it is added to {@link ambientLights} if needed. */
    public set activeAmbientLight(value: AmbientLight) {
        this._addAmbientLight(value);
        this._activeAmbientLight = value;
        this.__forwardLightsBuffer.ambientLight = value;
    }

    /**
     * Adds a mesh, a light or a camera. Adding an item that is already in the scene does nothing.
     * - Mesh: drawn by {@link render}; gets the scene camera.
     * - Ambient light: added to {@link ambientLights} (use {@link activeAmbientLight} to make it the lit one).
     * - Directional / point light: added to the lights buffer.
     * - Camera: becomes the scene {@link camera}.
     * Constructors given a scene (meshes, lights, the perspective camera) call this themselves.
     * @param item The item to add.
     * @throws Error when all slots for a light kind are in use (3 directional, 5 point), or for an unsupported item.
     */
    public add(item: SceneItem): void {
        if (item instanceof AmbientLight) {
            this._addAmbientLight(item);
        } else if (item instanceof DirectionalLight || item instanceof PointLight) {
            this.__forwardLightsBuffer.add(item);
        } else if (Scene._isCamera(item)) {
            this.camera = item;
        } else if (Scene._isMesh(item)) {
            if (!this._meshes.includes(item)) {
                this._meshes.push(item);
                if (this._activeCamera) {
                    Scene._assignCameraToMesh(item, this._activeCamera);
                }
            }
        } else {
            throw new Error("Scene.add: expected a mesh, an AmbientLight, DirectionalLight, PointLight or a camera.");
        }
    }

    /**
     * Removes a mesh, a light or a camera. The mesh is not disposed.
     * Removing the active camera clears {@link camera}.
     * @param item The item to remove.
     * @returns True when the item was in the scene (for a camera: was the active camera).
     * @throws Error when removing the active ambient light (set another {@link activeAmbientLight} first), or for an unsupported item.
     */
    public remove(item: SceneItem): boolean {
        if (item instanceof AmbientLight) {
            if (item === this._activeAmbientLight) {
                throw new Error("Scene.remove: cannot remove the active ambient light; set scene.activeAmbientLight to another light first.");
            }
            return Scene._removeFrom(this.ambientLights, item);
        }
        if (item instanceof DirectionalLight || item instanceof PointLight) {
            return this.__forwardLightsBuffer.remove(item);
        }
        if (Scene._isCamera(item)) {
            if (item !== this._activeCamera) {
                return false;
            }
            this._activeCamera = undefined;
            return true;
        }
        if (Scene._isMesh(item)) {
            return Scene._removeFrom(this._meshes, item);
        }
        throw new Error("Scene.remove: expected a mesh, an AmbientLight, DirectionalLight, PointLight or a camera.");
    }

    /**
     * Adds a directional or point light.
     * @deprecated Use {@link add}.
     * @throws Error when all slots for that kind are in use (3 directional, 5 point).
     */
    public addLight(light: DirectionalLight | PointLight): void {
        this.add(light);
    }

    /**
     * Removes a directional or point light.
     * @deprecated Use {@link remove}.
     * @returns True when the light was in the scene.
     */
    public removeLight(light: DirectionalLight | PointLight): boolean {
        return this.remove(light);
    }

    private _addAmbientLight(ambientLight: AmbientLight): void {
        if (!this.ambientLights.includes(ambientLight)) {
            this.ambientLights.push(ambientLight);
        }
    }

    private static _removeFrom<T>(list: T[], item: T): boolean {
        const index = list.indexOf(item);
        if (index < 0) {
            return false;
        }
        list.splice(index, 1);
        return true;
    }

    /** Cameras have the camera buffers and updateBuffers(); meshes and lights do not. */
    private static _isCamera(item: unknown): item is ICamera {
        const camera = item as Partial<ICamera> | null;
        return typeof camera === "object" && camera !== null
            && "projectionViewBuffer" in camera && "viewMatrix" in camera && typeof camera.updateBuffers === "function";
    }

    /** Meshes have render() and a material slot or submeshes. */
    private static _isMesh(item: unknown): item is IMesh {
        const mesh = item as Partial<IMesh> | null;
        return typeof mesh === "object" && mesh !== null && typeof mesh.render === "function"
            && ("material" in mesh || "subMeshes" in mesh);
    }

    /**
     * Updates the scene: assigns {@link camera} to the mesh materials that don't have it yet, and uploads changed lights.
     * @param _time The game time.
     * @public
     */
    update(_time: GameTime): void {
        // Also covers meshes whose submeshes were added after the mesh registered itself.
        if (this._activeCamera) {
            for (const mesh of this._meshes) {
                Scene._assignCameraToMesh(mesh, this._activeCamera);
            }
        }
        this.__forwardLightsBuffer.update();
    }

    private static _assignCameraToMesh(mesh: IMesh, camera: ICamera): void {
        Scene._assignCamera(mesh.material, camera);
        for (const subMesh of mesh.subMeshes ?? []) {
            Scene._assignCamera(subMesh.material, camera);
        }
    }

    private static _assignCamera(material: IMaterial | undefined, camera: ICamera): void {
        // Only materials that have a camera property; the setter rebinds buffers, so skip when unchanged.
        // A camera that is not initialized yet (e.g. added from its constructor) has no buffers;
        // it is assigned by the next update() once initialize() created them.
        if (!camera.projectionViewBuffer || !camera.positionBuffer) {
            return;
        }
        if (material && "camera" in material && material.camera !== camera) {
            material.camera = camera;
        }
    }

    /**
     * Renders the meshes.
     */
    render(): void {

        for (const mesh of this._meshes) {
            mesh.render();
        }

    }

    /** Disposes the meshes still in the scene and the lights buffer. Calling it twice does nothing. */
    public dispose(): void {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        // Each mesh removes itself, so iterate a copy.
        for (const mesh of this._meshes.slice()) {
            mesh.dispose();
        }
        this._meshes.length = 0;
        this.__forwardLightsBuffer.dispose();
    }
}

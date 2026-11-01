import {AmbientLight} from "../lights/AmbientLight.ts";
import {DirectionalLight} from "../lights/DirectionalLight.ts";
import {PointLight} from "../lights/PointLight.ts";
import type {IDisposable} from "../core/IDisposable.ts";
import type {IFramework} from "../IFramework.ts";
import type {IRenderableMesh} from "../meshes/IRenderableMesh.ts";
import {SceneMesh} from "./SceneMesh.ts";
import {isLightsMaterial} from "../material/ILightsMaterial.ts";
import type {GameTime} from "../time/GameTime.ts";
import type {ICamera} from "../camera/ICamera.ts";
import type {ISceneObject} from "./ISceneObject.ts";
import {TransformNode} from "./node/TransformNode.ts";

/** Anything a scene can hold: a mesh, a scene object, a light (ambient, directional, point) or a camera. */
export type SceneItem = IRenderableMesh | SceneMesh | ISceneObject | AmbientLight | DirectionalLight | PointLight | ICamera;

/**
 * The scene. Lights and cameras given a scene in their constructor add themselves through {@link add};
 * meshes are added with `scene.add(mesh)` (wrapped in a {@link SceneMesh}, which owns the mesh's materials).
 * Like C#, the scene keeps the light lists and hands its active ambient light and the lists themselves (not copies)
 * to every lights material in {@link update}; each material owns and uploads its own lights buffer. Call {@link update} once per frame and {@link render} in the render listener.
 */
export class Scene implements IDisposable {

    private readonly _sceneMeshes: SceneMesh[] = [];
    private readonly _nodes: ISceneObject[] = [];
    private readonly _directionalLights: DirectionalLight[] = [];
    private readonly _pointLights: PointLight[] = [];

    /** The directional light slots (matches the Blinn-Phong material). */
    public static readonly MAX_DIRECTIONAL_LIGHTS = 3;

    /** The point light slots (matches the Blinn-Phong material). */
    public static readonly MAX_POINT_LIGHTS = 5;
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
        for (const sceneMesh of this._sceneMeshes) {
            Scene._assignCamera(sceneMesh, value);
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
    }

    /** The scene meshes, in the order they were added. */
    public get sceneMeshes(): readonly SceneMesh[] {
        return this._sceneMeshes;
    }

    /** The scene objects (anything with a transform, including root meshes), in the order they were added. */
    public get nodes(): readonly ISceneObject[] {
        return this._nodes;
    }

    /** The root meshes in this scene, in the order they were added. */
    public get meshes(): readonly IRenderableMesh[] {
        return this._sceneMeshes.map(s => s.mesh);
    }

    /** The directional lights in this scene. */
    public get directionalLights(): readonly DirectionalLight[] {
        return this._directionalLights;
    }

    /** The point lights in this scene. */
    public get pointLights(): readonly PointLight[] {
        return this._pointLights;
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
    }

    /**
     * Adds a mesh, a light or a camera. Adding an item that is already in the scene does nothing.
     * - Renderable mesh or {@link SceneMesh}: drawn by {@link render}; its materials get the scene camera and lights.
     *   A mesh is wrapped in a `SceneMesh`, so {@link dispose} also disposes its materials.
     *   The mesh is also added to {@link nodes}.
     * - {@link ISceneObject} (anything with a `transform`): added to {@link nodes}; {@link update} updates its transform.
     * - Lights are also added to {@link nodes} (they are scene objects).
 * - Ambient light: added to {@link ambientLights} (use {@link activeAmbientLight} to make it the lit one).
     * - Directional / point light: added to {@link directionalLights} / {@link pointLights}.
     * - Camera: becomes the scene {@link camera} and is added to {@link nodes} (cameras are scene objects).
     *   Checked before the generic scene object case.
     * Constructors given a scene (lights, the perspective camera) call this themselves.
     * @param item The item to add.
     * @throws Error when all slots for a light kind are in use (3 directional, 5 point), or for an unsupported item.
     */
    public add(item: SceneItem): void {
        if (item instanceof AmbientLight) {
            this._addAmbientLight(item);
            this._addNode(item);
        } else if (item instanceof DirectionalLight || item instanceof PointLight) {
            this._addLight(item);
            this._addNode(item);
        } else if (Scene._isCamera(item)) {
            this.camera = item;
            if (Scene._isSceneObject(item)) {
                this._addNode(item);
            }
        } else if (item instanceof SceneMesh || Scene._isMesh(item)) {
            const mesh = item instanceof SceneMesh ? item.mesh : item;
            if (!this._sceneMeshes.some(s => s.mesh === mesh)) {
                const sceneMesh = item instanceof SceneMesh ? item : new SceneMesh(item);
                this._sceneMeshes.push(sceneMesh);
                this._bind(sceneMesh);
            }
            this._addNode(mesh);
        } else if (Scene._isSceneObject(item)) {
            this._addNode(item);
        } else {
            throw new Error("Scene.add: expected a mesh, a scene object, an AmbientLight, DirectionalLight, PointLight or a camera.");
        }
    }

    /**
     * Removes a mesh (or scene mesh), a light or a camera. The mesh and its materials are not disposed.
     * Removing the active camera clears {@link camera}.
     * @param item The item to remove.
     * @returns True when the item was in the scene.
     * @throws Error when removing the active ambient light (set another {@link activeAmbientLight} first), or for an unsupported item.
     */
    public remove(item: SceneItem): boolean {
        if (item instanceof AmbientLight) {
            if (item === this._activeAmbientLight) {
                throw new Error("Scene.remove: cannot remove the active ambient light; set scene.activeAmbientLight to another light first.");
            }
            Scene._removeFrom(this._nodes, item);
            return Scene._removeFrom(this.ambientLights, item);
        }
        if (item instanceof DirectionalLight || item instanceof PointLight) {
            Scene._removeFrom(this._nodes, item);
            return item instanceof DirectionalLight
                ? Scene._removeFrom(this._directionalLights, item)
                : Scene._removeFrom(this._pointLights, item);
        }
        if (Scene._isCamera(item)) {
            const wasNode = Scene._removeFrom(this._nodes, item);
            if (item !== this._activeCamera) {
                return wasNode;
            }
            this._activeCamera = undefined;
            return true;
        }
        if (item instanceof SceneMesh || Scene._isMesh(item)) {
            const mesh = item instanceof SceneMesh ? item.mesh : item;
            const index = this._sceneMeshes.findIndex(s => s.mesh === mesh);
            Scene._removeFrom(this._nodes, mesh);
            if (index < 0) {
                return false;
            }
            this._sceneMeshes.splice(index, 1);
            return true;
        }
        if (Scene._isSceneObject(item)) {
            return Scene._removeFrom(this._nodes, item);
        }
        throw new Error("Scene.remove: expected a mesh, a scene object, an AmbientLight, DirectionalLight, PointLight or a camera.");
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

    private _addLight(light: DirectionalLight | PointLight): void {
        const [list, max, kind] = light instanceof DirectionalLight
            ? [this._directionalLights as (DirectionalLight | PointLight)[], Scene.MAX_DIRECTIONAL_LIGHTS, "directional"]
            : [this._pointLights as (DirectionalLight | PointLight)[], Scene.MAX_POINT_LIGHTS, "point"];
        if (list.includes(light)) {
            return;
        }
        if (list.length >= max) {
            throw new Error(`Scene: cannot add ${kind} light ${light.id}; all ${max} ${kind} light slots are in use.`);
        }
        list.push(light);
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

    /** Scene objects have a TransformNode as transform. */
    private static _isSceneObject(item: unknown): item is ISceneObject {
        return typeof item === "object" && item !== null && (item as Partial<ISceneObject>).transform instanceof TransformNode;
    }

    private _addNode(node: ISceneObject): void {
        if (!this._nodes.includes(node)) {
            this._nodes.push(node);
        }
    }

    /** Renderable meshes have render() and sub meshes. */
    private static _isMesh(item: unknown): item is IRenderableMesh {
        const mesh = item as Partial<IRenderableMesh> | null;
        return typeof mesh === "object" && mesh !== null && typeof mesh.render === "function" && "subMeshes" in mesh;
    }

    /**
     * Updates the scene: updates the transforms of {@link nodes}, assigns {@link camera}, the active ambient light and the light lists to the mesh materials.
     * Each lights material uploads its lights buffer when drawn, only if the lights changed.
     * @param _time The game time.
     * @public
     */
    update(_time: GameTime): void {
        for (const node of this._nodes) {
            node.transform.update(_time);
        }
        for (const sceneMesh of this._sceneMeshes) {
            this._bind(sceneMesh);
        }
    }

    /** Assigns the camera (when set) and the lights to the scene mesh's materials. */
    private _bind(sceneMesh: SceneMesh): void {
        if (this._activeCamera) {
            Scene._assignCamera(sceneMesh, this._activeCamera);
        }
        for (const material of sceneMesh.materials) {
            if (isLightsMaterial(material)) {
                if (material.ambientLight !== this._activeAmbientLight) {
                    material.ambientLight = this._activeAmbientLight;
                }
                if (material.directionalLights !== this._directionalLights) {
                    material.directionalLights = this._directionalLights;
                }
                if (material.pointLights !== this._pointLights) {
                    material.pointLights = this._pointLights;
                }
            }
        }
    }

    private static _assignCamera(sceneMesh: SceneMesh, camera: ICamera): void {
        // A camera that is not initialized yet (e.g. added from its constructor) has no buffers;
        // it is assigned by the next update() once initialize() created them.
        if (!camera.projectionViewBuffer || !camera.positionBuffer) {
            return;
        }
        for (const material of sceneMesh.materials) {
            // The setter rebinds buffers, so skip when unchanged.
            if (material.camera !== camera) {
                material.camera = camera;
            }
        }
    }

    /**
     * Renders the meshes.
     */
    render(): void {

        for (const sceneMesh of this._sceneMeshes) {
            sceneMesh.render();
        }

    }

    /** Disposes the scene meshes still in the scene: their meshes and materials. Calling it twice does nothing. */
    public dispose(): void {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        for (const sceneMesh of this._sceneMeshes) {
            sceneMesh.dispose();
        }
        this._sceneMeshes.length = 0;
        this._nodes.length = 0;
    }
}

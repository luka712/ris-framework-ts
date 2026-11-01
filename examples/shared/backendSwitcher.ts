import {RenderingBackend, type IFramework} from "../../src";

/** What an example's setup receives for one run. */
export interface ExampleContext {
    /** A fresh canvas for this run (a canvas cannot switch between WebGL and WebGPU contexts). */
    readonly canvas: HTMLCanvasElement;
    /** The requested backend. Pass it as `renderingBackend` to the framework configuration. */
    readonly backend: RenderingBackend;
    /** False once the user switched backends; async work of an old run should stop touching the page. */
    isCurrent(): boolean;
}

/** What an example's setup returns. */
export interface ExampleRun {
    /** The framework, with its listeners added but not initialized yet. */
    framework: IFramework;
    /** Called after the framework is initialized (for example, to set the clear colour). */
    afterInitialize?(): void;
    /** Disposes example-owned resources (scenes, ...). Called before the framework is disposed. */
    dispose?(): void;
}

const QUERY_KEY = "backend";

function readBackend(): RenderingBackend {
    return new URLSearchParams(location.search).get(QUERY_KEY) === "webgpu" ? RenderingBackend.WEB_GPU : RenderingBackend.WEB_GL;
}

function writeBackend(backend: RenderingBackend): void {
    const url = new URL(location.href);
    if (backend === RenderingBackend.WEB_GPU) {
        url.searchParams.set(QUERY_KEY, "webgpu");
    } else {
        url.searchParams.delete(QUERY_KEY);
    }
    history.replaceState(null, "", url);
}

const backendName = (backend: RenderingBackend) => backend === RenderingBackend.WEB_GPU ? "WebGPU" : "WebGL";

/**
 * Runs an example with the backend from `?backend=webgpu` (WebGL otherwise) and adds a button that switches backends.
 * Switching disposes the example and its framework (stopping the render loop and input listeners),
 * replaces the canvas with a fresh one, and runs the setup again with the other backend.
 * @param canvasSelector The canvas of the page.
 * @param setup Creates the framework (with `context.backend`), its content and listeners.
 */
export function runWithBackendSwitcher(canvasSelector: string, setup: (context: ExampleContext) => ExampleRun): void {
    let canvas = document.querySelector<HTMLCanvasElement>(canvasSelector)!;
    let backend = readBackend();
    let current: ExampleRun | undefined;
    let generation = 0;

    const bar = document.createElement("p");
    const button = document.createElement("button");
    button.type = "button";
    const label = document.createElement("span");
    label.style.marginLeft = "8px";
    bar.append(button, label);
    canvas.before(bar);

    const updateUi = (active?: RenderingBackend) => {
        const other = backend === RenderingBackend.WEB_GPU ? RenderingBackend.WEB_GL : RenderingBackend.WEB_GPU;
        button.textContent = `Switch to ${backendName(other)}`;
        label.textContent = active === undefined
            ? `Starting ${backendName(backend)}…`
            : active === backend
                ? `Backend: ${backendName(active)}`
                : `Backend: ${backendName(active)} (${backendName(backend)} unavailable, fell back)`;
    };

    const start = async () => {
        const run = ++generation;
        updateUi();
        current = setup({canvas, backend, isCurrent: () => run === generation});
        const framework = current.framework;
        if (backend === RenderingBackend.WEB_GPU) {
            await framework.initializeAsync();
        } else {
            framework.initialize();
        }
        if (run !== generation) {
            return;
        }
        current.afterInitialize?.();
        updateUi(framework.renderingBackend);
    };

    const stop = () => {
        generation++;
        if (!current) {
            return;
        }
        current.dispose?.();
        current.framework.dispose();
        current = undefined;
        // A canvas keeps its first context type, so the next backend needs a new canvas.
        const fresh = canvas.cloneNode(false) as HTMLCanvasElement;
        canvas.replaceWith(fresh);
        canvas = fresh;
    };

    button.addEventListener("click", () => {
        button.disabled = true;
        stop();
        backend = backend === RenderingBackend.WEB_GPU ? RenderingBackend.WEB_GL : RenderingBackend.WEB_GPU;
        writeBackend(backend);
        start()
            .catch(error => {
                label.textContent = error instanceof Error ? error.message : String(error);
            })
            .finally(() => {
                button.disabled = false;
            });
    });

    start().catch(error => {
        label.textContent = error instanceof Error ? error.message : String(error);
    });
}

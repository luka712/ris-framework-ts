import type { IContent } from "./IContent.ts";

/**
 * The content module.
 * This is the main interface for loading various types of content, such as textures, shaders, and audio.
 */
export interface IContentModule {

    /**
     * The type of content that should be loaded and returned.
     */
    readonly contentTypes: string[];

    /**
     * The content path.
     * This is the path where the content is located.
     * It can be a file path, a URL, or any other identifier that can be used to load the content.
     */
    contentPath?: string;

    /**
     * Adds a listener that notifies the content manager that a content bundle has been loaded.
     * @param event The listener. Receives the bundle name and the loaded bundle object.
     */
    addOnBundleLoadedListener(event: (bundleName: string, bundle: any) => void): void;

    /**
     * Removes a listener added with {@link addOnBundleLoadedListener}.
     * @param event The listener to remove.
     */
    removeOnBundleLoadedListener(event: (bundleName: string, bundle: any) => void): void;

    /**
     * Load the content with the specified ID.
     * The ID is a unique identifier for the content, and it is used to retrieve the content from the content manager.
     * @param id - The unique identifier for the content.
     * @param options - The optional options for loading the content.
     * @returns The loaded content.
     */
    load(id: string, options?: any): IContent;

    /**
     * Load the content with the specified ID asynchronously.
     * The ID is a unique identifier for the content, and it is used to retrieve the content from the content manager.
     * @param id - The unique identifier for the content.
     * @param options - The optional options for loading the content.
     * @returns A promise of the loaded content.
     */
    loadAsync(id: string, options?: any): Promise<IContent>;

    /**
     * Load the content bundle with the specified name.
     * A content bundle is a collection of related content items that can be loaded together.
     * @param bundleName - The bundle name.
     * @param options - The optional options for loading the bundle.
     */
    loadBundle(bundleName: string, options?: any): void;

    /**
     * Load the content bundle with the specified name asynchronously.
     * A content bundle is a collection of related content items that can be loaded together.
     * @param bundleName - The bundle name.
     * @param options - The optional options for loading the bundle.
     * @returns A promise that resolves once the bundle is loaded.
     */
    loadBundleAsync(bundleName: string, options?: any): Promise<void>;

}

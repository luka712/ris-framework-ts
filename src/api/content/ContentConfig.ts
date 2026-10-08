/**
 * The configuration to provide when loading content with the content manager.
 */
export class ContentConfig {

    /**
     * Should data be kept in memory?
     * This allows fast loading of content on repeated loads, for example, when texture needs to be reloaded.
     */
    public keepDataCached = false;
}

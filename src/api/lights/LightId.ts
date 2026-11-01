let nextLightId = 1;

/**
 * Returns a new unique light id. Light constructors call this when no id is given.
 * @internal
 */
export function createLightId(): number {
    return nextLightId++;
}

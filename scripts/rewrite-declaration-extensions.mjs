import {readdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";

const dist = path.resolve("dist");

// `rewriteRelativeImportExtensions` rewrites `.ts` specifiers in JavaScript emit.
// Declaration emit keeps the `.ts` specifier. Consumers resolve `.js` to the `.d.ts`.
const relativeTsSpecifier = /(from\s+|import\s*\(\s*)(["'])(\.[^"']+?)\.ts\2/g;

async function declarationFiles(directory) {
    const entries = await readdir(directory, {withFileTypes: true});
    const files = [];
    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...await declarationFiles(fullPath));
        } else if (entry.name.endsWith(".d.ts")) {
            files.push(fullPath);
        }
    }
    return files;
}

let rewritten = 0;
for (const file of await declarationFiles(dist)) {
    const original = await readFile(file, "utf8");
    const updated = original.replace(relativeTsSpecifier, (_match, prefix, quote, specifier) => {
        rewritten += 1;
        return `${prefix}${quote}${specifier}.js${quote}`;
    });
    if (updated !== original) {
        await writeFile(file, updated);
    }
}

if (rewritten === 0) {
    console.error("No relative .ts declaration specifiers were rewritten. Check the TypeScript emit.");
    process.exit(1);
}

console.log(`Rewrote ${rewritten} declaration import specifiers from .ts to .js.`);

import { BaseGeometry } from "../geometry/BaseGeometry";
import type { IGeometry } from "../index";

/** The ObjLoader class is used to load .obj models from text or file path. */
export class ObjLoader {

    /**
     * Loads .obj model from text.
     * @param text The text to load the model from.
     * @return The geometry.
     */
    public fromText(text: string): IGeometry {
        const lines = text.split(/\n/);

        const vertices = [];
        const indices = [];
        const normals = [];
        const textureCoords = []

        for (const line of lines) {

            const data = line.split(' ');
            const identifier = data[0].trim();

            switch (identifier) {
                // Typically value as 'v 0.0 1.0 2.0'
                case 'v':
                    for (let i = 1; i < data.length; ++i) {
                        vertices.push(parseFloat(data[i].trim()));
                    }
                    break;
                case 'vt':
                    for (let i = 1; i < data.length; ++i) {
                        textureCoords.push(parseFloat(data[i].trim()));
                    }
                    break;
                case 'vn':
                    for (let i = 1; i < data.length; ++i) {
                        normals.push(parseFloat(data[i].trim()));
                    }
                    break;
                case 'f':
                    for (let i = 1; i < data.length; ++i) {
                        let faceData = data[i].split('/');
                        indices.push(parseInt(faceData[0].trim()) - 1);
                        indices.push(parseInt(faceData[1].trim()) - 1);
                        indices.push(parseInt(faceData[2].trim()) - 1);

                    }
                    break;
            }
        }

        return new BaseGeometry(vertices, indices, normals, textureCoords);
    }



    /**
     * Loads .obj model from file path.
     * @param filePath
     * @return The geometry.
     */
    public async loadAsync(filePath: string): Promise<IGeometry> {
        const response = await fetch(filePath);
        const text = await response.text();
        return this.fromText(text);
    }
}
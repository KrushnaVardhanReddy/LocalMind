import { expose } from 'comlink';
import { initOpenCascade } from 'opencascade.js';

export interface CADMetadata {
    entityCount: number;
    boundingBox: { min: [number, number, number]; max: [number, number, number] };
    volumeCm3?: number;
}

export interface CADWorkerContract {
    init(): Promise<void>;
    loadModel(fileBuffer: ArrayBuffer, fileName: string): Promise<CADMetadata>;
    convertToSTL(): Promise<ArrayBuffer>;
    convertToOBJ(): Promise<ArrayBuffer>;
}

export class CADService implements CADWorkerContract {
    private oc: any = null;
    private loadedShape: any = null;

    async init(): Promise<void> {
        if (this.oc) return;
        this.oc = await initOpenCascade();
    }

    async loadModel(fileBuffer: ArrayBuffer, fileName: string): Promise<CADMetadata> {
        if (!this.oc) throw new Error("CAD Service not initialized");

        // Clean up previously loaded shape
        if (this.loadedShape) {
            this.loadedShape.delete();
            this.loadedShape = null;
        }

        const FS = this.oc.FS;
        const ext = fileName.split('.').pop()?.toLowerCase() || '';

        const tempPath = `/temp_file.${ext}`;
        FS.writeFile(tempPath, new Uint8Array(fileBuffer));

        let shape: any = null;
        let reader: any = null;
        let readerType = '';

        if (['step', 'stp'].includes(ext)) {
            reader = new this.oc.STEPControl_Reader_1();
            readerType = 'step';
        } else if (['iges', 'igs'].includes(ext)) {
            reader = new this.oc.IGESControl_Reader_1();
            readerType = 'iges';
        } else {
            FS.unlink(tempPath);
            throw new Error(`Unsupported CAD format: ${ext}`);
        }

        const readStatus = reader.ReadFile(tempPath);
        if (readStatus !== 1) { // 1 == IFSelect_RetDone
            reader.delete();
            FS.unlink(tempPath);
            throw new Error(`Failed to read ${readerType} file: ${fileName}`);
        }

        reader.TransferRoots();
        shape = reader.OneShape();
        reader.delete();
        FS.unlink(tempPath);

        this.loadedShape = shape;

        // Count entities (Faces)
        let entityCount = 0;
        const explorer = new this.oc.TopExp_Explorer_2(shape, this.oc.TopAbs_ShapeEnum.TopAbs_FACE, this.oc.TopAbs_ShapeEnum.TopAbs_SHAPE);
        while (explorer.More()) {
            entityCount++;
            explorer.Next();
        }
        explorer.delete();

        // Bounding Box
        const bndBox = new this.oc.Bnd_Box_1();
        this.oc.BRepBndLib.Add(shape, bndBox, false);


        // Use CornerMin and CornerMax (JS-friendly alternative to C++ reference-based Get())
        const cMin = bndBox.CornerMin();
        const cMax = bndBox.CornerMax();
        const boundingBox = {
            min: [cMin.X(), cMin.Y(), cMin.Z()] as [number, number, number],
            max: [cMax.X(), cMax.Y(), cMax.Z()] as [number, number, number]
        };
        cMin.delete();
        cMax.delete();
        bndBox.delete();

        // Volume
        const props = new this.oc.GProp_GProps_1();
        this.oc.BRepGProp.VolumeProperties_1(shape, props, false, false, false);
        const volumeCm3 = props.Mass() / 1000; // Convert mm3 to cm3 usually, assuming mm units
        props.delete();

        return {
            entityCount,
            boundingBox,
            volumeCm3
        };
    }

    async convertToSTL(): Promise<ArrayBuffer> {
        if (!this.oc || !this.loadedShape) throw new Error("No model loaded");



        try {
            const mesh = new this.oc.BRepMesh_IncrementalMesh_2(this.loadedShape, 0.1, false, 0.5, false);
            mesh.delete();
        } catch(e) {
            console.warn("Mesh generation skipped or failed:", e);
        }
        const stlWriter = new this.oc.StlAPI_Writer();
        stlWriter.ASCIIMode = false; // Binary

        const tempPath = '/out.stl';
        const writeResult = stlWriter.Write(this.loadedShape, tempPath);
        stlWriter.delete();

        if (!writeResult) {
            throw new Error("Failed to write STL");
        }

        const FS = this.oc.FS;
        const fileData = FS.readFile(tempPath);
        FS.unlink(tempPath);

        // Make a copy of the underlying buffer to return safely
        return fileData.slice().buffer;
    }

    async convertToOBJ(): Promise<ArrayBuffer> {
        // Since RWObj_Writer isn't available, generate binary STL and parse to OBJ manually
        const stlBuffer = await this.convertToSTL();
        const dataView = new DataView(stlBuffer);

        // Binary STL format: 80 byte header, 4 byte uint32 num_triangles, then 50 byte per triangle
        let objStr = "";
        const numTriangles = dataView.getUint32(80, true);
        let offset = 84;

        const vertices: string[] = [];
        const faces: string[] = [];
        let vertexCount = 0;

        for (let i = 0; i < numTriangles; i++) {
            // Normal (12 bytes)
            const nx = dataView.getFloat32(offset, true);
            const ny = dataView.getFloat32(offset+4, true);
            const nz = dataView.getFloat32(offset+8, true);
            offset += 12;

            // 3 Vertices (36 bytes)
            for (let j = 0; j < 3; j++) {
                const vx = dataView.getFloat32(offset, true);
                const vy = dataView.getFloat32(offset+4, true);
                const vz = dataView.getFloat32(offset+8, true);
                offset += 12;
                vertices.push(`v ${vx} ${vy} ${vz}`);
                vertexCount++;
            }

            // Attribute byte count (2 bytes)
            offset += 2;

            const vIndex = vertexCount - 2;
            faces.push(`f ${vIndex} ${vIndex+1} ${vIndex+2}`);
        }

        objStr = vertices.join("\n") + "\n" + faces.join("\n") + "\n";
        return new TextEncoder().encode(objStr).buffer;
    }
}


if (typeof self !== 'undefined' && typeof window === 'undefined') {
    expose(new CADService());
}

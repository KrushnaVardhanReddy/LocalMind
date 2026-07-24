import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CADService } from './cad.worker';

// Avoid ReferenceError by using vi.hoisted for variables accessed inside vi.mock factory
const { mockOC, mockReader, mockFS, mockShape, mockStlWriter } = vi.hoisted(() => {
    const mShape = { delete: vi.fn() };
    const mReader = {
        ReadFile: vi.fn().mockReturnValue(1),
        TransferRoots: vi.fn(),
        OneShape: vi.fn().mockReturnValue(mShape),
        delete: vi.fn()
    };
    const mExplorer = {
        More: vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false),
        Next: vi.fn(),
        delete: vi.fn()
    };
    const mCorner = {
        X: vi.fn().mockReturnValue(1.0),
        Y: vi.fn().mockReturnValue(2.0),
        Z: vi.fn().mockReturnValue(3.0),
        delete: vi.fn()
    };
    const mBndBox = {
        Get: vi.fn(),
        CornerMin: vi.fn().mockReturnValue(mCorner),
        CornerMax: vi.fn().mockReturnValue(mCorner),
        delete: vi.fn()
    };
    const mProps = {
        Mass: vi.fn().mockReturnValue(1000),
        delete: vi.fn()
    };
    const mMesh = { delete: vi.fn() };
    const mStlWriter = {
        ASCIIMode: false,
        Write: vi.fn().mockReturnValue(true),
        delete: vi.fn()
    };
    const mFS = {
        writeFile: vi.fn(),
        readFile: vi.fn().mockImplementation(() => new Uint8Array(new ArrayBuffer(90))),
        unlink: vi.fn()
    };
    return {
        mockShape: mShape,
        mockReader: mReader,
        mockFS: mFS,
        mockStlWriter: mStlWriter,
        mockOC: {
            FS: mFS,
            STEPControl_Reader_1: vi.fn().mockImplementation(function() { return mReader; }),
            IGESControl_Reader_1: vi.fn().mockImplementation(function() { return mReader; }),
            TopExp_Explorer_2: vi.fn().mockImplementation(function() { return mExplorer; }),
            TopAbs_ShapeEnum: { TopAbs_FACE: 1, TopAbs_SHAPE: 2 },
            Bnd_Box_1: vi.fn().mockImplementation(function() { return mBndBox; }),
            BRepBndLib: { Add: vi.fn() },
            GProp_GProps_1: vi.fn().mockImplementation(function() { return mProps; }),
            BRepGProp: { VolumeProperties_1: vi.fn() },
            BRepMesh_IncrementalMesh_2: vi.fn().mockImplementation(function() { return mMesh; }),
            StlAPI_Writer: vi.fn().mockImplementation(function() { return mStlWriter; })
        }
    };
});

vi.mock('opencascade.js', () => ({
    initOpenCascade: vi.fn().mockResolvedValue(mockOC)
}));

vi.mock('comlink', () => ({
    expose: vi.fn()
}));

describe('CAD Worker', () => {
    let cadService: CADService;

    beforeEach(() => {
        vi.clearAllMocks();
        cadService = new CADService();
    });

    it('should initialize correctly', async () => {
        await cadService.init();
        expect(cadService['oc']).toBeDefined();
    });

    it('should load a STEP model and return metadata', async () => {
        await cadService.init();

        const fileBuffer = new ArrayBuffer(10);
        const metadata = await cadService.loadModel(fileBuffer, 'test.step');

        expect(mockOC.STEPControl_Reader_1).toHaveBeenCalled();
        expect(mockReader.ReadFile).toHaveBeenCalledWith('/temp_file.step');
        expect(mockFS.writeFile).toHaveBeenCalled();
        expect(metadata.entityCount).toBe(1);
        expect(metadata.volumeCm3).toBe(1);
        expect(metadata.boundingBox.min).toEqual([1.0, 2.0, 3.0]);
    });

    it('should convert to STL', async () => {
        await cadService.init();
        await cadService.loadModel(new ArrayBuffer(10), 'test.step');

        const result = await cadService.convertToSTL();

        expect(mockOC.StlAPI_Writer).toHaveBeenCalled();
        expect(mockStlWriter.Write).toHaveBeenCalledWith(mockShape, '/out.stl');
    });

    it('should convert to OBJ', async () => {
        await cadService.init();
        await cadService.loadModel(new ArrayBuffer(10), 'test.step');

        // modify FS to return a properly formatted STL buffer to parse
        const buffer = new ArrayBuffer(84 + 50); // header + 1 triangle
        const view = new DataView(buffer);
        view.setUint32(80, 1, true); // 1 triangle
        // set some vertex values
        view.setFloat32(84 + 12, 1.0, true);

        mockFS.readFile.mockReturnValueOnce(new Uint8Array(buffer)); // Node ArrayBuffer vs browser

        const result = await cadService.convertToOBJ();

        const text = new TextDecoder().decode(result);
        expect(text).toContain('v 1 0 0'); // little endian float32 1.0
        expect(text).toContain('f 1 2 3');
    });
});

import { expose } from 'comlink';
import initGdal from 'gdal3.js';

export interface GeoFileMetadata {
    crs?: string;
    extent?: { minX: number; minY: number; maxX: number; maxY: number };
    featureCount?: number;
    geometryType?: string;
    raw?: any;
}

export interface GeoWorkerContract {
    init(): Promise<void>;
    inspect(fileBuffer: ArrayBuffer, fileName: string): Promise<GeoFileMetadata>;
    convert(fileBuffer: ArrayBuffer, fileName: string, targetFormat: 'geojson' | 'kml'): Promise<ArrayBuffer>;
    reproject(fileBuffer: ArrayBuffer, fileName: string, fromEPSG: number, toEPSG: number): Promise<ArrayBuffer>;
}

class GeoService implements GeoWorkerContract {
    private initialized = false;
    private initPromise: Promise<void> | null = null;
    private gdal: any = null;

    async init(): Promise<void> {
        if (this.initialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            this.gdal = await initGdal({
                paths: {
                    wasm: '/gdal3.js/gdal3WebAssembly.wasm',
                    data: '/gdal3.js/gdal3WebAssembly.data'
                }
            });
            this.initialized = true;
        })();
        return this.initPromise;
    }

    async inspect(fileBuffer: ArrayBuffer, fileName: string): Promise<GeoFileMetadata> {
        await this.init();

        const fileObj = new File([fileBuffer], fileName);

        const dataset = await this.gdal.open(fileObj);

        try {
            const infoJson = await this.gdal.gdalinfo(dataset, ['-json']);
            const info = JSON.parse(infoJson as string);

            let crs, extent, featureCount, geometryType;

            if (info.stLayers && info.stLayers.length > 0) {
                const layer = info.stLayers[0];
                crs = layer.crs?.name || layer.crs?.wkt;
                featureCount = layer.featureCount;
                geometryType = layer.geometryType;

                if (layer.extent) {
                    extent = {
                        minX: layer.extent[0],
                        minY: layer.extent[1],
                        maxX: layer.extent[2],
                        maxY: layer.extent[3]
                    };
                }
            } else if (info.bands && info.bands.length > 0) {
                crs = info.coordinateSystem?.wkt;
                if (info.cornerCoordinates) {
                    extent = {
                        minX: Math.min(info.cornerCoordinates.lowerLeft[0], info.cornerCoordinates.upperLeft[0]),
                        minY: Math.min(info.cornerCoordinates.lowerLeft[1], info.cornerCoordinates.lowerRight[1]),
                        maxX: Math.max(info.cornerCoordinates.lowerRight[0], info.cornerCoordinates.upperRight[0]),
                        maxY: Math.max(info.cornerCoordinates.upperLeft[1], info.cornerCoordinates.upperRight[1])
                    };
                }
            }

            return {
                crs,
                extent,
                featureCount,
                geometryType,
                raw: info
            };
        } finally {
            if (typeof this.gdal.close === 'function') {
                await this.gdal.close(dataset);
            }
        }
    }

    async convert(fileBuffer: ArrayBuffer, fileName: string, targetFormat: 'geojson' | 'kml'): Promise<ArrayBuffer> {
        await this.init();

        const outFormat = targetFormat === 'geojson' ? 'GeoJSON' : 'KML';
        const fileObj = new File([fileBuffer], fileName);

        const dataset = await this.gdal.open(fileObj);

        try {
            const outDs = await this.gdal.ogr2ogr(dataset.datasets[0], ['-f', outFormat]);

            if (!outDs) {
                throw new Error("Conversion failed to return dataset");
            }

            const fileBytes = await this.gdal.getFileBytes(outDs.path);

            if (typeof this.gdal.close === 'function') {
                await this.gdal.close(outDs);
            }

            return fileBytes.buffer;
        } finally {
            if (typeof this.gdal.close === 'function') {
                await this.gdal.close(dataset);
            }
        }
    }

    async reproject(fileBuffer: ArrayBuffer, fileName: string, fromEPSG: number, toEPSG: number): Promise<ArrayBuffer> {
        await this.init();

        const fileObj = new File([fileBuffer], fileName);

        const dataset = await this.gdal.open(fileObj);

        try {
            const outDs = await this.gdal.ogr2ogr(dataset.datasets[0], [
                '-t_srs', `EPSG:${toEPSG}`,
                '-s_srs', `EPSG:${fromEPSG}`,
                '-f', 'GeoJSON'
            ]);

            if (!outDs) {
                throw new Error("Reprojection failed to return dataset");
            }

            const fileBytes = await this.gdal.getFileBytes(outDs.path);

            if (typeof this.gdal.close === 'function') {
                await this.gdal.close(outDs);
            }

            return fileBytes.buffer;
        } finally {
            if (typeof this.gdal.close === 'function') {
                await this.gdal.close(dataset);
            }
        }
    }
}

expose(new GeoService());

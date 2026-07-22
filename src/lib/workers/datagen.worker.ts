import { faker } from '@faker-js/faker';
import * as comlink from 'comlink';


export class DataGenService {
    private currentData: any[] = [];

    public async generateFromJsonSchema(schema: any, rowCount: number, seed?: number): Promise<object[]> {
        if (seed !== undefined) {
            faker.seed(seed);
        }

        const results: object[] = [];
        for (let i = 0; i < rowCount; i++) {
            results.push(this.generateObject(schema));
        }

        this.currentData = results;
        return results.slice(0, 50); // Only return preview to avoid main thread freeze
    }

    private generateObject(schema: any): any {
        if (!schema) return null;

        if (schema.type === 'object' && schema.properties) {
            const obj: any = {};
            for (const key of Object.keys(schema.properties)) {
                obj[key] = this.generateProperty(key, schema.properties[key]);
            }
            return obj;
        } else if (schema.type === 'array' && schema.items) {
            const arr: any[] = [];
            const count = faker.number.int({ min: 1, max: 5 });
            for (let i = 0; i < count; i++) {
                arr.push(this.generateObject(schema.items));
            }
            return arr;
        }

        return this.generateProperty('root', schema);
    }

    private generateProperty(key: string, schema: any): any {
        if (schema.example !== undefined) {
            return schema.example;
        }

        if (schema.type === 'string') {
            if (schema.format === 'email' || key.toLowerCase().includes('email')) return faker.internet.email();
            if (schema.format === 'date' || schema.format === 'date-time') return faker.date.recent().toISOString();
            if (key.toLowerCase().includes('firstname') || key.toLowerCase() === 'first_name') return faker.person.firstName();
            if (key.toLowerCase().includes('lastname') || key.toLowerCase() === 'last_name') return faker.person.lastName();
            if (key.toLowerCase() === 'name') return faker.person.fullName();
            if (key.toLowerCase().includes('phone')) return faker.phone.number();
            if (key.toLowerCase().includes('address')) return faker.location.streetAddress();

            return faker.lorem.word();
        }

        if (schema.type === 'integer' || schema.type === 'number') {
            const min = schema.minimum !== undefined ? schema.minimum : 0;
            const max = schema.maximum !== undefined ? schema.maximum : 1000;
            if (schema.type === 'integer') {
                return faker.number.int({ min, max });
            }
            return faker.number.float({ min, max });
        }

        if (schema.type === 'boolean') {
            return faker.datatype.boolean();
        }

        return faker.lorem.word(); // fallback
    }

    public async generateFromSqlDDL(ddl: string, rowCount: number, seed?: number): Promise<object[]> {
        if (seed !== undefined) {
            faker.seed(seed);
        }

        // Parse DDL - allow optional semicolon
        const tableMatch = ddl.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?['"`]?(\w+)['"`]?\s*\(([\s\S]+?)\)\s*;/i);
        if (!tableMatch) {
            throw new Error("Could not parse CREATE TABLE statement.");
        }

        const columnsStr = tableMatch[2];
        // Split by comma first to handle single line schemas, then deal with newlines/cleaning
        const colDefinitions = columnsStr.split(',').map(l => l.trim()).filter(l => l && !l.startsWith('--'));
        const columns = [];

        for (const def of colDefinitions) {
            // Clean up possible trailing artifacts or newlines within the definition
            const cleanDef = def.replace(/\n/g, ' ').trim();
            if (!cleanDef || cleanDef.toUpperCase().startsWith('PRIMARY KEY') || cleanDef.toUpperCase().startsWith('FOREIGN KEY')) continue;

            const parts = cleanDef.split(/\s+/);
            if (parts.length >= 2) {
                columns.push({ name: parts[0], type: parts[1].toLowerCase() });
            }
        }

        const results: object[] = [];
        for (let i = 0; i < rowCount; i++) {
            const row: any = {};
            for (const col of columns) {
                row[col.name] = this.generateFromSqlType(col.name, col.type);
            }
            results.push(row);
        }

        this.currentData = results;
        return results.slice(0, 50); // Only return preview
    }

    private generateFromSqlType(name: string, type: string): any {
        const lowerName = name.toLowerCase();

        // Smart field hints
        if (lowerName.includes('email')) return faker.internet.email();
        if (lowerName.includes('firstname') || lowerName === 'first_name') return faker.person.firstName();
        if (lowerName.includes('lastname') || lowerName === 'last_name') return faker.person.lastName();
        if (lowerName === 'name') return faker.person.fullName();
        if (lowerName.includes('phone')) return faker.phone.number();
        if (lowerName.includes('address')) return faker.location.streetAddress();

        // Type matching
        if (type.includes('int')) {
            return faker.number.int({ min: 1, max: 10000 });
        }
        if (type.includes('float') || type.includes('double') || type.includes('decimal') || type.includes('numeric')) {
            return faker.number.float({ min: 0, max: 10000 });
        }
        if (type.includes('bool')) {
            return faker.datatype.boolean();
        }
        if (type.includes('date') || type.includes('timestamp') || type.includes('time')) {
            return faker.date.recent().toISOString();
        }
        if (type.includes('uuid')) {
            return faker.string.uuid();
        }

        // Fallback for varchar, text, etc.
        return faker.lorem.word();
    }

    public async generateCsv(): Promise<string> {
        if (!this.currentData || this.currentData.length === 0) return '';

        const columns = Object.keys(this.currentData[0]);
        const header = columns.join(',');

        const rows = this.currentData.map(obj =>
            columns.map(col => {
                let val = obj[col];
                if (val === null || val === undefined) return '';
                if (typeof val === 'string') {
                    return `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            }).join(',')
        );

        return [header, ...rows].join('\n');
    }

    public async generateJsonString(): Promise<string> {
        return JSON.stringify(this.currentData, null, 2);
    }
}

if (typeof self !== 'undefined' && typeof window === 'undefined') {
    comlink.expose(new DataGenService());
}

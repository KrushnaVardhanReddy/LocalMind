import { faker } from '@faker-js/faker';
import * as comlink from 'comlink';


export class DataGenService {
    public async generateFromJsonSchema(schema: any, rowCount: number, seed?: number): Promise<object[]> {
        if (seed !== undefined) {
            faker.seed(seed);
        }

        const results: object[] = [];
        for (let i = 0; i < rowCount; i++) {
            results.push(this.generateObject(schema));
        }
        return results;
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
        throw new Error("generateFromSqlDDL not fully implemented in simplified task 5.8 mock.");
    }
}

if (typeof self !== 'undefined' && typeof window === 'undefined') {
    comlink.expose(new DataGenService());
}

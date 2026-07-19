import { writable } from 'svelte/store';

export type ColumnSchema = {
    cid: number;
    name: string;
    type: string;
    notnull: boolean;
    dflt_value: any;
    pk: boolean;
};

export type TableSchema = {
    tableName: string;
    rowCount: number;
    columns: ColumnSchema[];
};

export const activeTableSchema = writable<TableSchema | null>(null);

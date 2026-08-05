declare module 'jq-web' {
    const jq: {
        json(json: any, query: string): any;
        raw(json: string, query: string): Promise<string>;
    };
    export default jq;
}

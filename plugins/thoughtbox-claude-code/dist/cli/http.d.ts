type FetchLike = typeof fetch;
export interface CliValidateResponse {
    ok: boolean;
    workspaceId: string;
    setupStatus: string;
}
export declare function validateApiKey(args: {
    fetchImpl: FetchLike;
    baseUrl: string;
    apiKey: string;
}): Promise<CliValidateResponse>;
export {};

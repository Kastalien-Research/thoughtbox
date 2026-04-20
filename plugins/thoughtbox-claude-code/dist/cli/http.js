import { normalizeBaseUrl } from './config.js';
async function parseJsonResponse(response) {
    const text = await response.text();
    if (!text)
        return {};
    try {
        return JSON.parse(text);
    }
    catch {
        return { raw: text };
    }
}
export async function validateApiKey(args) {
    const response = await args.fetchImpl(`${normalizeBaseUrl(args.baseUrl)}/cli/validate`, {
        headers: {
            Authorization: `Bearer ${args.apiKey}`,
        },
        signal: AbortSignal.timeout(10_000),
    });
    const payload = await parseJsonResponse(response);
    if (!response.ok) {
        const message = payload.error ?? response.statusText;
        throw new Error(message);
    }
    return payload;
}

import type { DocumentStore } from "./DocumentStore.js";

// Subset of the API Gateway HTTP API (payload format 2.0) event
export interface HttpApiEvent {
    requestContext: { http: { method: string } };
    rawPath: string;
    pathParameters?: Record<string, string | undefined>;
    body?: string;
    isBase64Encoded?: boolean;
}

export interface HttpApiResponse {
    statusCode: number;
    headers?: Record<string, string>;
    body?: string;
}

const json = (statusCode: number, payload: unknown): HttpApiResponse => ({
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
});

export function createHandler(store: DocumentStore) {
    return async (event: HttpApiEvent): Promise<HttpApiResponse> => {
        const method = event.requestContext.http.method;
        const id = event.pathParameters?.id;

        if (!id?.trim()) return json(400, { error: "Missing document id" });

        try {
            if (method === "GET") {
                const content = await store.load(id);
                if (content === undefined) return json(404, { error: "Not found" });
                return json(200, { id, content });
            }

            if (method === "PUT") {
                const raw = event.isBase64Encoded
                    ? Buffer.from(event.body ?? "", "base64").toString("utf8")
                    : (event.body ?? "");
                await store.save(id, raw);
                return json(204, {}); // 204 must not carry a body; see note below
            }

            return json(405, { error: `Method ${method} not allowed` });
        } catch (err) {
            console.error("Unhandled error", err);
            return json(500, { error: "Internal server error" });
        }
    };
}
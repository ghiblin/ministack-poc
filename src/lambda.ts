import { buildDocumentStore } from "./composition.js";
import { createHandler } from "./handler.js";

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing environment variable ${name}`);
    return value;
}

const store = buildDocumentStore(
    {
        endpoint: process.env.S3_ENDPOINT, // unset in AWS, set for local testing
        region: process.env.AWS_REGION ?? "us-east-1", // AWS_REGION is set by Lambda
    },
    requireEnv("BUCKET_NAME"),
);

export const handler = createHandler(store);
import { randomUUID } from "node:crypto";
import { CreateBucketCommand } from "@aws-sdk/client-s3";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createS3Client } from "../src/config.js";
import { buildDocumentStore } from "../src/composition.js";
import { startMiniStack, type RunningMiniStack } from "./support/ministack.js";

describe("DocumentStore against MiniStack (S3)", () => {
    let mini: RunningMiniStack;
    let bucket: string;
    let store: ReturnType<typeof buildDocumentStore>;

    beforeAll(async () => {
        mini = await startMiniStack();
        bucket = `poc-${randomUUID()}`;

        // Create the bucket with the same client config the app uses.
        const s3 = createS3Client(mini.config);
        await s3.send(new CreateBucketCommand({ Bucket: bucket }));

        store = buildDocumentStore(mini.config, bucket);
    }, 120_000);

    afterAll(async () => {
        await mini?.container.stop();
    });

    it("saves and loads a document", async () => {
        await store.save("doc-1", "hello from MiniStack");

        expect(await store.load("doc-1")).toBe("hello from MiniStack");
    });

    it("returns undefined for a missing document", async () => {
        expect(await store.load("does-not-exist")).toBeUndefined();
    });

    it("rejects an empty id", async () => {
        await expect(store.save("  ", "x")).rejects.toThrow("Document id is required");
    });
});
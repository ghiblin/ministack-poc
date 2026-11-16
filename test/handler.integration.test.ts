import { randomUUID } from "node:crypto";
import { CreateBucketCommand } from "@aws-sdk/client-s3";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createS3Client } from "../src/config.js";
import { buildDocumentStore } from "../src/composition.js";
import { createHandler, type HttpApiEvent } from "../src/handler.js";
import { startMiniStack, type RunningMiniStack } from "./support/ministack.js";

const event = (method: string, id: string, body?: string): HttpApiEvent => ({
  requestContext: { http: { method } },
  rawPath: `/documents/${id}`,
  pathParameters: { id },
  body,
  isBase64Encoded: false,
});

describe("Lambda handler against MiniStack", () => {
  let mini: RunningMiniStack;
  let handle: ReturnType<typeof createHandler>;

  beforeAll(async () => {
    mini = await startMiniStack();
    const bucket = `poc-${randomUUID()}`;
    await createS3Client(mini.config).send(new CreateBucketCommand({ Bucket: bucket }));
    handle = createHandler(buildDocumentStore(mini.config, bucket));
  }, 120_000);

  afterAll(async () => {
    await mini?.container.stop();
  });

  it("PUT then GET returns the stored document", async () => {
    const put = await handle(event("PUT", "doc-1", "hello"));
    expect(put.statusCode).toBe(204);

    const get = await handle(event("GET", "doc-1"));
    expect(get.statusCode).toBe(200);
    expect(JSON.parse(get.body!)).toEqual({ id: "doc-1", content: "hello" });
  });

  it("GET on a missing document returns 404", async () => {
    const res = await handle(event("GET", "nope"));
    expect(res.statusCode).toBe(404);
  });

  it("rejects a blank id with 400", async () => {
    const res = await handle(event("GET", "   "));
    expect(res.statusCode).toBe(400);
  });

  it("returns 405 for unsupported methods", async () => {
    const res = await handle(event("DELETE", "doc-1"));
    expect(res.statusCode).toBe(405);
  });
});
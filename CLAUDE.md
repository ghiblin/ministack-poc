# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A proof of concept: an AWS Lambda (API Gateway HTTP API, payload v2.0) that stores and loads text documents in S3 (`GET`/`PUT` on a path with an `id` parameter). It is tested locally against [MiniStack](https://hub.docker.com/r/ministackorg/ministack), an S3-compatible local AWS emulator, run through Testcontainers.

## Commands

- `npm test` runs all tests (`vitest run`). `npm run test:integration` currently runs the same thing: every test is an integration test.
- Single file: `npx vitest run test/DocumentStore.integration.test.ts`. Single test: add `-t "<test name>"`.
- Tests need a running Docker daemon. They start `ministackorg/ministack:latest`, and the first run pulls the image, hence the long timeouts in `vitest.config.ts`.
- `npm run build` bundles `src/lambda.ts` with esbuild to `dist/lambda.mjs` (ESM, node22, `@aws-sdk/*` external because the Lambda runtime provides it).
- `npm run package` builds and then zips to `function.zip` for deployment.
- There is no lint script. Type-check with `npx tsc --noEmit`.

## Architecture

The code is layered so that each layer depends only on the one below it, and the S3 details stay out of the business logic:

- `src/handler.ts` is the HTTP layer. `createHandler(store)` returns the Lambda function. It maps the HTTP method to `DocumentStore.load` or `save` and returns 400, 404, 405 or 500 as appropriate.
- `src/DocumentStore.ts` is the business logic. It maps a document id to the S3 key `documents/<id>.txt` and depends only on the `StorageService` interface.
- `src/storage/StorageService.ts` is the storage interface. `S3StorageService.ts` implements it with the AWS SDK, and `getText` returns `undefined` on `NoSuchKey`.
- `src/config.ts` builds the `S3Client`. When `endpoint` is set it enables `forcePathStyle`, which local S3-compatible servers need. Without an endpoint it uses the real AWS defaults.
- `src/composition.ts` is the composition root. `buildDocumentStore(cfg, bucket)` wires the client, the storage service and the store together. Production and tests both use it.
- `src/lambda.ts` is the deployed entry point. It reads `BUCKET_NAME` (required), `S3_ENDPOINT` (optional, only for local runs) and `AWS_REGION`, then exports `handler`.

## Testing

- Both tests in `test/*.integration.test.ts` start a MiniStack container in `beforeAll`, create a uniquely named bucket, and exercise the real code path. One goes through `createHandler`, the other through `DocumentStore`. There are no mocks.
- `test/support/ministack.ts` (`startMiniStack`) returns the container and an `S3Config` pointing at it, with dummy credentials.

## Conventions

- The project is ESM (`module: nodenext`), so relative imports in `src/` use `.js` extensions even though the files are `.ts`.

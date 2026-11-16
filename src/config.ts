import { S3Client } from "@aws-sdk/client-s3";

export interface S3Config {
    endpoint?: string; // set for MiniStack/MinIO, unset in AWS
    region: string;
    credentials?: { accessKeyId: string; secretAccessKey: string };
}

export function createS3Client(cfg: S3Config): S3Client {
    return new S3Client({
        endpoint: cfg.endpoint,
        region: cfg.region,
        forcePathStyle: Boolean(cfg.endpoint), // needed for local S3-compatible servers
        credentials: cfg.credentials, // undefined -> default credential chain
    });
}
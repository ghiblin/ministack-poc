import {
    GetObjectCommand,
    NoSuchKey,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import type { StorageService } from "./StorageService.js";

export class S3StorageService implements StorageService {
    constructor(private readonly s3: S3Client) { }

    async putText(bucket: string, key: string, text: string): Promise<void> {
        await this.s3.send(
            new PutObjectCommand({ Bucket: bucket, Key: key, Body: text, ContentType: "text/plain" }),
        );
    }

    async getText(bucket: string, key: string): Promise<string | undefined> {
        try {
            const res = await this.s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
            return res.Body?.transformToString();
        } catch (err) {
            if (err instanceof NoSuchKey) return undefined;
            throw err;
        }
    }
}
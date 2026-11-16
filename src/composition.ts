import { createS3Client, S3Config } from "./config";
import { DocumentStore } from "./DocumentStore";
import { S3StorageService } from "./storage/S3StorageService";

export function buildDocumentStore(cfg: S3Config, bucket: string): DocumentStore {
    const s3 = createS3Client(cfg);
    const storage = new S3StorageService(s3);
    return new DocumentStore(storage, bucket);
}
import type { StorageService } from "./storage/StorageService.js";

// Business logic. It knows nothing about S3, only the StorageService interface.
export class DocumentStore {
    constructor(
        private readonly storage: StorageService,
        private readonly bucket: string,
    ) { }

    async save(id: string, content: string): Promise<void> {
        if (!id.trim()) throw new Error("Document id is required");
        await this.storage.putText(this.bucket, `documents/${id}.txt`, content);
    }

    async load(id: string): Promise<string | undefined> {
        return this.storage.getText(this.bucket, `documents/${id}.txt`);
    }
}
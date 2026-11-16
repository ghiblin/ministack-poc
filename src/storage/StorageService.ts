export interface StorageService {
    putText(bucket: string, key: string, text: string): Promise<void>;
    getText(bucket: string, key: string): Promise<string | undefined>;
}
import { Injectable } from '@nestjs/common';
import { unlink } from 'node:fs/promises';

@Injectable()
export class StorageService {
    async deleteFile(filePath: string): Promise<void> {
        try {
            await unlink(filePath);
        } catch {
            // File may already be deleted
        }
    }
}

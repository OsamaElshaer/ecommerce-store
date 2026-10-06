import { Injectable } from '@nestjs/common';
import { unlink } from 'node:fs/promises';

@Injectable()
export class StorageService {
    async deleteFile(filePath: string): Promise<void> {
        try {
            await unlink(filePath);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return;
            }

            console.error('Failed to delete file:', filePath, error);
            throw error;
        }
    }
}

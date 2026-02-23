import fs from 'fs/promises';
import { existsSync } from 'fs';

const isVercel = process.env.VERCEL === '1';

/**
 * WriteQueue - Serialises concurrent writes to the same file.
 */
class WriteQueue {
    private queues: Map<string, Promise<void>> = new Map();

    async enqueue(filePath: string, task: () => Promise<void>): Promise<void> {
        const current = this.queues.get(filePath) ?? Promise.resolve();
        const next = current.then(() => task()).catch(() => task());
        this.queues.set(filePath, next);
        return next;
    }
}

const writeQueue = new WriteQueue();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * atomicWrite - Writes data safely. Skips write on Vercel to avoid deployment errors.
 * Includes retry logic for Windows file locks.
 */
export async function atomicWrite(filePath: string, data: any) {
    if (isVercel) {
        console.warn('Vercel environment detected: Persistence is disabled for JSON files. Data will be temporary.');
        return;
    }

    return writeQueue.enqueue(filePath, async () => {
        let retries = 5;
        while (retries > 0) {
            try {
                const tempPath = `${filePath}.${process.pid}.tmp`;
                const content = JSON.stringify(data, null, 2);
                await fs.writeFile(tempPath, content, 'utf8');
                await fs.rename(tempPath, filePath);
                return; // Success
            } catch (error: any) {
                retries--;
                if (retries === 0 || !['EBUSY', 'EPERM', 'EACCES'].includes(error.code)) {
                    console.error(`Failed to write to ${filePath}:`, error);
                    break;
                }
                await delay(100); // Wait before retry
            }
        }
    });
}

export async function safeRead(filePath: string, fallback: any = []) {
    let retries = 5;
    while (retries > 0) {
        try {
            if (!existsSync(filePath)) {
                return fallback;
            }
            const content = await fs.readFile(filePath, 'utf8');
            return JSON.parse(content);
        } catch (error: any) {
            retries--;
            if (retries === 0 || !['EBUSY', 'EPERM', 'EACCES'].includes(error.code)) {
                // If it's a JSON parse error, return fallback
                if (error instanceof SyntaxError) return fallback;
                return fallback;
            }
            await delay(100);
        }
    }
    return fallback;
}

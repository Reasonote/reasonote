export class Mutex {
    private locked = false;
    private waitingResolvers: (() => void)[] = [];

    async acquire(): Promise<void> {
        if (!this.locked) {
            this.locked = true;
            return;
        }

        return new Promise<void>(resolve => {
            this.waitingResolvers.push(resolve);
        });
    }

    release(): void {
        if (this.waitingResolvers.length > 0) {
            const resolve = this.waitingResolvers.shift()!;
            resolve();
        } else {
            this.locked = false;
        }
    }
} 
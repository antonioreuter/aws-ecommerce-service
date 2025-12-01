export interface ProcessedEventsRepository {
    isProcessed(orderId: string): Promise<boolean>;
    markProcessed(orderId: string, ttlSeconds?: number): Promise<void>;
}

import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../utils/dynamodb-client";
import { ProcessedEventsRepository } from "../core/processed-events";

export class DynamoDBProcessedEventsRepository implements ProcessedEventsRepository {
    private tableName: string;

    constructor(tableName: string) {
        this.tableName = tableName;
    }

    async isProcessed(orderId: string): Promise<boolean> {
        const result = await docClient.send(new GetCommand({
            TableName: this.tableName,
            Key: { order_id: orderId }
        }));
        return !!result.Item;
    }

    async markProcessed(orderId: string, ttlSeconds: number = 3600): Promise<void> {
        const now = Math.floor(Date.now() / 1000);
        await docClient.send(new PutCommand({
            TableName: this.tableName,
            Item: {
                order_id: orderId,
                ttl: now + ttlSeconds,
                created_at: new Date().toISOString()
            }
        }));
    }
}

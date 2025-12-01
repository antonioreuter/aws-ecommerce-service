import { PutCommand, GetCommand, UpdateCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { Inventory, InventoryRepository } from "../core/inventory";
import { docClient } from "../utils/dynamodb-client";

export class DynamoDBInventoryRepository implements InventoryRepository {
    private tableName: string;

    constructor(tableName: string) {
        this.tableName = tableName;
    }

    async createInventory(inventory: Inventory): Promise<void> {
        const now = new Date().toISOString();
        const item = {
            ...inventory,
            updatedAt: now
        };

        await docClient.send(new PutCommand({
            TableName: this.tableName,
            Item: item
        }));
    }

    async getInventory(sku: string): Promise<Inventory | null> {
        const result = await docClient.send(new GetCommand({
            TableName: this.tableName,
            Key: { sku }
        }));

        return (result.Item as Inventory) || null;
    }

    async updateInventory(sku: string, quantityChange: number): Promise<void> {
        const now = new Date().toISOString();
        await docClient.send(new UpdateCommand({
            TableName: this.tableName,
            Key: { sku },
            UpdateExpression: "SET quantity = quantity + :q, updatedAt = :u",
            ExpressionAttributeValues: {
                ":q": quantityChange,
                ":u": now
            }
        }));
    }

    async reserveItems(items: { sku: string; quantity: number }[]): Promise<boolean> {
        const transactItems = items.map(item => ({
            Update: {
                TableName: this.tableName,
                Key: { sku: item.sku },
                UpdateExpression: "SET quantity = quantity - :q, updatedAt = :u",
                ConditionExpression: "quantity >= :q",
                ExpressionAttributeValues: {
                    ":q": item.quantity,
                    ":u": new Date().toISOString()
                }
            }
        }));

        try {
            await docClient.send(new TransactWriteCommand({
                TransactItems: transactItems
            }));
            return true;
        } catch (error: any) {
            if (error.name === 'TransactionCanceledException') {
                return false;
            }
            throw error;
        }
    }
}

import { PutCommand, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Product, ProductRepository } from "../core/product";
import { docClient } from "../utils/dynamodb-client";

export class DynamoDBProductRepository implements ProductRepository {
    private tableName: string;

    constructor(tableName: string) {
        this.tableName = tableName;
    }

    async createProduct(product: Product): Promise<void> {
        const now = new Date().toISOString();
        const item = {
            ...product,
            createdAt: now,
            updatedAt: now
        };

        await docClient.send(new PutCommand({
            TableName: this.tableName,
            Item: item
        }));
    }

    async getProduct(sku: string): Promise<Product | null> {
        const result = await docClient.send(new GetCommand({
            TableName: this.tableName,
            Key: { sku }
        }));

        return (result.Item as Product) || null;
    }

    async listProducts(limit: number = 10, nextToken?: string): Promise<{ products: Product[], nextToken?: string }> {
        const result = await docClient.send(new ScanCommand({
            TableName: this.tableName,
            Limit: limit,
            ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString('utf-8')) : undefined
        }));

        const products = (result.Items as Product[]) || [];
        const newNextToken = result.LastEvaluatedKey ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : undefined;

        return { products, nextToken: newNextToken };
    }
}

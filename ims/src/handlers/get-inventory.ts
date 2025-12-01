import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBInventoryRepository } from '../adapters/dynamodb-inventory-repository';
import { DynamoDBProcessedEventsRepository } from '../adapters/dynamodb-processed-events-repository';
import { SqsEventPublisher } from '../adapters/sqs-event-publisher';
import { InventoryService } from '../core/services/inventory-service';
import { createApiMiddleware } from '../utils/middleware';
import { getInventorySchema } from '../utils/validation-schemas';

const inventoryRepo = new DynamoDBInventoryRepository(process.env.INVENTORY_TABLE_NAME || '');
const processedEventsRepo = new DynamoDBProcessedEventsRepository(process.env.PROCESSED_EVENTS_TABLE_NAME || '');
const eventPublisher = new SqsEventPublisher(process.env.OMS_EVENTS_QUEUE_URL || '');
const inventoryService = new InventoryService(inventoryRepo, processedEventsRepo, eventPublisher);

const baseHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const sku = event.pathParameters!.sku!; // Validated by middleware

    const inventory = await inventoryService.getInventory(sku);
    if (!inventory) {
        return { statusCode: 404, body: JSON.stringify({ message: 'Inventory not found' }) };
    }

    return {
        statusCode: 200,
        body: JSON.stringify(inventory),
    };
};

export const handler = createApiMiddleware(getInventorySchema).handler(baseHandler);

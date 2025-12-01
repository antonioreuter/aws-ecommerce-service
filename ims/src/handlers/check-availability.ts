import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBInventoryRepository } from '../adapters/dynamodb-inventory-repository';
import { DynamoDBProcessedEventsRepository } from '../adapters/dynamodb-processed-events-repository';
import { SqsEventPublisher } from '../adapters/sqs-event-publisher';
import { InventoryService } from '../core/services/inventory-service';
import { createApiMiddleware } from '../utils/middleware';
import { checkAvailabilitySchema } from '../utils/validation-schemas';

const inventoryRepo = new DynamoDBInventoryRepository(process.env.INVENTORY_TABLE_NAME || '');
const processedEventsRepo = new DynamoDBProcessedEventsRepository(process.env.PROCESSED_EVENTS_TABLE_NAME || '');
const eventPublisher = new SqsEventPublisher(process.env.OMS_EVENTS_QUEUE_URL || '');
const inventoryService = new InventoryService(inventoryRepo, processedEventsRepo, eventPublisher);

const baseHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const body = event.body as any; // Already parsed and validated by middleware
    const items = body.items;

    const availability = await inventoryService.checkAvailability(items);

    return {
        statusCode: 200,
        body: JSON.stringify(availability),
    };
};

export const handler = createApiMiddleware(checkAvailabilitySchema).handler(baseHandler);

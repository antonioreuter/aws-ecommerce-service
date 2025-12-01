import { SQSHandler, SQSRecord } from 'aws-lambda';
import { DynamoDBInventoryRepository } from '../adapters/dynamodb-inventory-repository';
import { DynamoDBProcessedEventsRepository } from '../adapters/dynamodb-processed-events-repository';
import { SqsEventPublisher } from '../adapters/sqs-event-publisher';
import { InventoryService } from '../core/services/inventory-service';

const inventoryRepo = new DynamoDBInventoryRepository(process.env.INVENTORY_TABLE_NAME || '');
const processedEventsRepo = new DynamoDBProcessedEventsRepository(process.env.PROCESSED_EVENTS_TABLE_NAME || '');
const eventPublisher = new SqsEventPublisher(process.env.OMS_EVENTS_QUEUE_URL || '');
const inventoryService = new InventoryService(inventoryRepo, processedEventsRepo, eventPublisher);

interface ReserveInventoryEvent {
    type: 'ReserveInventory';
    order_id: string;
    items: { sku: string; quantity: number }[];
}

export const handler: SQSHandler = async (event) => {
    const batchItemFailures: { itemIdentifier: string }[] = [];

    for (const record of event.Records) {
        try {
            await processRecord(record);
        } catch (error) {
            console.error(`Error processing record ${record.messageId}:`, error);
            batchItemFailures.push({ itemIdentifier: record.messageId });
        }
    }

    return { batchItemFailures };
};

async function processRecord(record: SQSRecord) {
    const body: ReserveInventoryEvent = JSON.parse(record.body);

    if (body.type !== 'ReserveInventory') {
        console.warn(`Ignoring unknown event type: ${body.type}`);
        return;
    }

    const { order_id, items } = body;

    await inventoryService.reserveInventory(order_id, items);
}

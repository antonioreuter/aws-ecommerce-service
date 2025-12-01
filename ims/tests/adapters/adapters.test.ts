import { describe, it, expect } from 'vitest';

describe('Adapter Layer', () => {
    describe('DynamoDBProductRepository', () => {
        it('should be importable', async () => {
            const { DynamoDBProductRepository } = await import('../../src/adapters/dynamodb-product-repository');
            expect(DynamoDBProductRepository).toBeDefined();
            
            const repo = new DynamoDBProductRepository('test-table');
            expect(repo).toBeDefined();
            expect(repo.createProduct).toBeDefined();
            expect(repo.getProduct).toBeDefined();
            expect(repo.listProducts).toBeDefined();
        });
    });

    describe('DynamoDBInventoryRepository', () => {
        it('should be importable', async () => {
            const { DynamoDBInventoryRepository } = await import('../../src/adapters/dynamodb-inventory-repository');
            expect(DynamoDBInventoryRepository).toBeDefined();
            
            const repo = new DynamoDBInventoryRepository('test-table');
            expect(repo).toBeDefined();
            expect(repo.createInventory).toBeDefined();
            expect(repo.getInventory).toBeDefined();
            expect(repo.updateInventory).toBeDefined();
            expect(repo.reserveItems).toBeDefined();
        });
    });

    describe('DynamoDBProcessedEventsRepository', () => {
        it('should be importable', async () => {
            const { DynamoDBProcessedEventsRepository } = await import('../../src/adapters/dynamodb-processed-events-repository');
            expect(DynamoDBProcessedEventsRepository).toBeDefined();
            
            const repo = new DynamoDBProcessedEventsRepository('test-table');
            expect(repo).toBeDefined();
            expect(repo.isProcessed).toBeDefined();
            expect(repo.markProcessed).toBeDefined();
        });
    });

    describe('SqsEventPublisher', () => {
        it('should be importable', async () => {
            const { SqsEventPublisher } = await import('../../src/adapters/sqs-event-publisher');
            expect(SqsEventPublisher).toBeDefined();
            
            const publisher = new SqsEventPublisher('https://sqs.test.com/queue');
            expect(publisher).toBeDefined();
            expect(publisher.publish).toBeDefined();
        });
    });
});


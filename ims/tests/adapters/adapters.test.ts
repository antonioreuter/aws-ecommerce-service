import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('DynamoDB Adapters', () => {
    let mockSend: any;
    let DynamoDBProductRepository: any;
    let DynamoDBInventoryRepository: any;
    let DynamoDBProcessedEventsRepository: any;

    beforeEach(async () => {
        // Reset modules to ensure clean state
        vi.resetModules();
        
        // Create mock
        mockSend = vi.fn();

        // Mock AWS SDK
        vi.doMock('@aws-sdk/lib-dynamodb', () => ({
            DynamoDBDocumentClient: {
                from: vi.fn(() => ({ send: mockSend }))
            },
            PutCommand: class PutCommand {
                constructor(public input: any) {}
            },
            GetCommand: class GetCommand {
                constructor(public input: any) {}
            },
            ScanCommand: class ScanCommand {
                constructor(public input: any) {}
            },
            UpdateCommand: class UpdateCommand {
                constructor(public input: any) {}
            },
            TransactWriteCommand: class TransactWriteCommand {
                constructor(public input: any) {}
            }
        }));

        vi.doMock('@aws-sdk/client-dynamodb', () => ({
            DynamoDBClient: class DynamoDBClient {}
        }));

        // Import after mocking
        const productRepo = await import('../../src/adapters/dynamodb-product-repository');
        const inventoryRepo = await import('../../src/adapters/dynamodb-inventory-repository');
        const eventsRepo = await import('../../src/adapters/dynamodb-processed-events-repository');
        
        DynamoDBProductRepository = productRepo.DynamoDBProductRepository;
        DynamoDBInventoryRepository = inventoryRepo.DynamoDBInventoryRepository;
        DynamoDBProcessedEventsRepository = eventsRepo.DynamoDBProcessedEventsRepository;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('DynamoDBProductRepository', () => {
        it('should create product with timestamps', async () => {
            mockSend.mockResolvedValue({});
            const repo = new DynamoDBProductRepository('test-table');

            const product = {
                sku: 'TEST-001',
                name: 'Test Product',
                description: 'A test product',
                price: 99.99
            };

            await repo.createProduct(product);

            expect(mockSend).toHaveBeenCalledTimes(1);
            const command = mockSend.mock.calls[0][0];
            expect(command.input.TableName).toBe('test-table');
            expect(command.input.Item.sku).toBe('TEST-001');
            expect(command.input.Item.name).toBe('Test Product');
            expect(command.input.Item.price).toBe(99.99);
            expect(command.input.Item.createdAt).toBeDefined();
            expect(command.input.Item.updatedAt).toBeDefined();
        });

        it('should get product by SKU', async () => {
            const mockProduct = {
                sku: 'TEST-001',
                name: 'Test Product',
                price: 99.99
            };
            mockSend.mockResolvedValue({ Item: mockProduct });
            const repo = new DynamoDBProductRepository('test-table');

            const result = await repo.getProduct('TEST-001');

            expect(mockSend).toHaveBeenCalledTimes(1);
            const command = mockSend.mock.calls[0][0];
            expect(command.input.TableName).toBe('test-table');
            expect(command.input.Key).toEqual({ sku: 'TEST-001' });
            expect(result).toEqual(mockProduct);
        });

        it('should return null when product not found', async () => {
            mockSend.mockResolvedValue({});
            const repo = new DynamoDBProductRepository('test-table');

            const result = await repo.getProduct('NOT-FOUND');

            expect(result).toBeNull();
        });

        it('should list products with pagination', async () => {
            const mockProducts = [
                { sku: 'P1', name: 'Product 1', price: 10 },
                { sku: 'P2', name: 'Product 2', price: 20 }
            ];
            mockSend.mockResolvedValue({
                Items: mockProducts,
                LastEvaluatedKey: { sku: 'P2' }
            });
            const repo = new DynamoDBProductRepository('test-table');

            const result = await repo.listProducts(10);

            expect(mockSend).toHaveBeenCalledTimes(1);
            const command = mockSend.mock.calls[0][0];
            expect(command.input.TableName).toBe('test-table');
            expect(command.input.Limit).toBe(10);
            expect(result.products).toEqual(mockProducts);
            expect(result.nextToken).toBeDefined();
        });

        it('should handle pagination token', async () => {
            mockSend.mockResolvedValue({ Items: [] });
            const repo = new DynamoDBProductRepository('test-table');

            // Use a valid base64 encoded JSON
            const validToken = Buffer.from(JSON.stringify({ sku: 'TEST' })).toString('base64');
            await repo.listProducts(10, validToken);

            const command = mockSend.mock.calls[0][0];
            expect(command.input.ExclusiveStartKey).toBeDefined();
            expect(command.input.ExclusiveStartKey.sku).toBe('TEST');
        });
    });

    describe('DynamoDBInventoryRepository', () => {
        it('should create inventory with timestamp', async () => {
            mockSend.mockResolvedValue({});
            const repo = new DynamoDBInventoryRepository('test-table');

            await repo.createInventory({ sku: 'TEST-001', quantity: 100 });

            expect(mockSend).toHaveBeenCalledTimes(1);
            const command = mockSend.mock.calls[0][0];
            expect(command.input.TableName).toBe('test-table');
            expect(command.input.Item.sku).toBe('TEST-001');
            expect(command.input.Item.quantity).toBe(100);
            expect(command.input.Item.updatedAt).toBeDefined();
        });

        it('should get inventory by SKU', async () => {
            const mockInventory = { sku: 'TEST-001', quantity: 50 };
            mockSend.mockResolvedValue({ Item: mockInventory });
            const repo = new DynamoDBInventoryRepository('test-table');

            const result = await repo.getInventory('TEST-001');

            expect(mockSend).toHaveBeenCalledTimes(1);
            const command = mockSend.mock.calls[0][0];
            expect(command.input.Key).toEqual({ sku: 'TEST-001' });
            expect(result).toEqual(mockInventory);
        });

        it('should update inventory quantity', async () => {
            mockSend.mockResolvedValue({});
            const repo = new DynamoDBInventoryRepository('test-table');

            await repo.updateInventory('TEST-001', 75);

            expect(mockSend).toHaveBeenCalledTimes(1);
            const command = mockSend.mock.calls[0][0];
            expect(command.input.TableName).toBe('test-table');
            expect(command.input.Key).toEqual({ sku: 'TEST-001' });
            expect(command.input.UpdateExpression).toContain('quantity + :q');
            expect(command.input.ExpressionAttributeValues[':q']).toBe(75);
        });

        it('should reserve items using transaction', async () => {
            mockSend.mockResolvedValue({});
            const repo = new DynamoDBInventoryRepository('test-table');

            const items = [
                { sku: 'SKU1', quantity: 5 },
                { sku: 'SKU2', quantity: 3 }
            ];

            const result = await repo.reserveItems(items);

            expect(result).toBe(true);
            expect(mockSend).toHaveBeenCalledTimes(1);
            const command = mockSend.mock.calls[0][0];
            expect(command.input.TransactItems).toHaveLength(2);
            
            // Verify first item transaction
            const firstUpdate = command.input.TransactItems[0].Update;
            expect(firstUpdate.Key).toEqual({ sku: 'SKU1' });
            expect(firstUpdate.UpdateExpression).toContain('quantity - :q');
            expect(firstUpdate.ExpressionAttributeValues[':q']).toBe(5);
            expect(firstUpdate.ConditionExpression).toContain('quantity >= :q');
        });

        it('should return false when transaction fails', async () => {
            const error = new Error('Transaction cancelled');
            error.name = 'TransactionCanceledException';
            mockSend.mockRejectedValue(error);
            const repo = new DynamoDBInventoryRepository('test-table');

            const result = await repo.reserveItems([{ sku: 'SKU1', quantity: 5 }]);

            expect(result).toBe(false);
        });
    });

    describe('DynamoDBProcessedEventsRepository', () => {
        it('should check if event is processed', async () => {
            mockSend.mockResolvedValue({ Item: { order_id: 'evt-123' } });
            const repo = new DynamoDBProcessedEventsRepository('test-table');

            const result = await repo.isProcessed('evt-123');

            expect(result).toBe(true);
            expect(mockSend).toHaveBeenCalledTimes(1);
            const command = mockSend.mock.calls[0][0];
            expect(command.input.Key).toEqual({ order_id: 'evt-123' });
        });

        it('should return false when event not found', async () => {
            mockSend.mockResolvedValue({});
            const repo = new DynamoDBProcessedEventsRepository('test-table');

            const result = await repo.isProcessed('evt-123');

            expect(result).toBe(false);
        });

        it('should mark event as processed with TTL', async () => {
            mockSend.mockResolvedValue({});
            const repo = new DynamoDBProcessedEventsRepository('test-table');

            await repo.markProcessed('evt-123');

            expect(mockSend).toHaveBeenCalledTimes(1);
            const command = mockSend.mock.calls[0][0];
            expect(command.input.Item.order_id).toBe('evt-123');
            expect(command.input.Item.ttl).toBeDefined();
            expect(command.input.Item.ttl).toBeGreaterThan(Date.now() / 1000);
        });
    });
});

describe('SQS Adapter', () => {
    let mockSend: any;
    let SqsEventPublisher: any;

    beforeEach(async () => {
        vi.resetModules();
        mockSend = vi.fn();

        vi.doMock('@aws-sdk/client-sqs', () => ({
            SQSClient: class SQSClient {
                send = mockSend;
            },
            SendMessageCommand: class SendMessageCommand {
                constructor(public input: any) {}
            }
        }));

        const publisher = await import('../../src/adapters/sqs-event-publisher');
        SqsEventPublisher = publisher.SqsEventPublisher;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should publish event to SQS queue', async () => {
        mockSend.mockResolvedValue({ MessageId: 'msg-123' });
        const publisher = new SqsEventPublisher('https://sqs.us-east-1.amazonaws.com/123/queue');

        const event = {
            type: 'InventoryReserved',
            order_id: 'order-123',
            timestamp: new Date().toISOString()
        };

        await publisher.publish(event);

        expect(mockSend).toHaveBeenCalledTimes(1);
        const command = mockSend.mock.calls[0][0];
        expect(command.input.QueueUrl).toBe('https://sqs.us-east-1.amazonaws.com/123/queue');
        
        const messageBody = JSON.parse(command.input.MessageBody);
        expect(messageBody).toEqual(event);
    });

    it('should handle SQS errors', async () => {
        mockSend.mockRejectedValue(new Error('SQS Error'));
        const publisher = new SqsEventPublisher('https://sqs.test.com/queue');

        await expect(publisher.publish({ type: 'Test' })).rejects.toThrow('SQS Error');
    });
});

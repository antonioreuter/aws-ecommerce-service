import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryService } from '../../../src/core/services/inventory-service';
import { InventoryRepository } from '../../../src/core/inventory';
import { ProcessedEventsRepository } from '../../../src/core/processed-events';
import { EventPublisher } from '../../../src/core/event-publisher';

describe('InventoryService', () => {
    let inventoryService: InventoryService;
    let mockInventoryRepo: InventoryRepository;
    let mockProcessedEventsRepo: ProcessedEventsRepository;
    let mockEventPublisher: EventPublisher;

    beforeEach(() => {
        mockInventoryRepo = {
            createInventory: vi.fn(),
            getInventory: vi.fn(),
            updateInventory: vi.fn(),
            reserveItems: vi.fn(),
        };
        mockProcessedEventsRepo = {
            isProcessed: vi.fn(),
            markProcessed: vi.fn(),
        };
        mockEventPublisher = {
            publish: vi.fn(),
        };
        inventoryService = new InventoryService(
            mockInventoryRepo,
            mockProcessedEventsRepo,
            mockEventPublisher
        );
    });

    describe('checkAvailability', () => {
        it('should return availability map', async () => {
            const items = [
                { sku: 'SKU1', quantity: 5 },
                { sku: 'SKU2', quantity: 10 }
            ];

            vi.mocked(mockInventoryRepo.getInventory)
                .mockResolvedValueOnce({ sku: 'SKU1', quantity: 10 }) // Sufficient
                .mockResolvedValueOnce({ sku: 'SKU2', quantity: 5 }); // Insufficient

            const result = await inventoryService.checkAvailability(items);

            expect(result).toEqual({
                'SKU1': true,
                'SKU2': false
            });
        });
        
        it('should handle missing inventory records as unavailable', async () => {
             const items = [{ sku: 'SKU1', quantity: 5 }];
             vi.mocked(mockInventoryRepo.getInventory).mockResolvedValue(null);

             const result = await inventoryService.checkAvailability(items);

             expect(result).toEqual({ 'SKU1': false });
        });
    });

    describe('reserveInventory', () => {
        const orderId = 'order-123';
        const items = [{ sku: 'SKU1', quantity: 1 }];

        it('should skip if order already processed', async () => {
            vi.mocked(mockProcessedEventsRepo.isProcessed).mockResolvedValue(true);

            await inventoryService.reserveInventory(orderId, items);

            expect(mockInventoryRepo.reserveItems).not.toHaveBeenCalled();
            expect(mockEventPublisher.publish).not.toHaveBeenCalled();
        });

        it('should reserve items and publish success event', async () => {
            vi.mocked(mockProcessedEventsRepo.isProcessed).mockResolvedValue(false);
            vi.mocked(mockInventoryRepo.reserveItems).mockResolvedValue(true);

            await inventoryService.reserveInventory(orderId, items);

            expect(mockInventoryRepo.reserveItems).toHaveBeenCalledWith(items);
            expect(mockEventPublisher.publish).toHaveBeenCalledWith({
                type: 'InventoryReserved',
                order_id: orderId
            });
            expect(mockProcessedEventsRepo.markProcessed).toHaveBeenCalledWith(orderId);
        });

        it('should publish failure event if reservation fails', async () => {
            vi.mocked(mockProcessedEventsRepo.isProcessed).mockResolvedValue(false);
            vi.mocked(mockInventoryRepo.reserveItems).mockResolvedValue(false);

            await inventoryService.reserveInventory(orderId, items);

            expect(mockEventPublisher.publish).toHaveBeenCalledWith({
                type: 'InventoryReservationFailed',
                order_id: orderId,
                reason: 'Insufficient inventory'
            });
            expect(mockProcessedEventsRepo.markProcessed).toHaveBeenCalledWith(orderId);
        });
    });
    
    describe('getInventory', () => {
        it('should return inventory', async () => {
            const inventory = { sku: 'SKU1', quantity: 10 };
            vi.mocked(mockInventoryRepo.getInventory).mockResolvedValue(inventory);
            
            const result = await inventoryService.getInventory('SKU1');
            
            expect(result).toEqual(inventory);
        });
    });
});

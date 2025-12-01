import { InventoryRepository } from "../inventory";
import { ProcessedEventsRepository } from "../processed-events";
import { EventPublisher } from "../event-publisher";

export class InventoryService {
    constructor(
        private inventoryRepo: InventoryRepository,
        private processedEventsRepo: ProcessedEventsRepository,
        private eventPublisher: EventPublisher
    ) {}

    async checkAvailability(items: { sku: string; quantity: number }[]): Promise<Record<string, boolean>> {
        const availability: Record<string, boolean> = {};

        for (const item of items) {
            const inventory = await this.inventoryRepo.getInventory(item.sku);
            if (inventory && inventory.quantity >= item.quantity) {
                availability[item.sku] = true;
            } else {
                availability[item.sku] = false;
            }
        }

        return availability;
    }

    async reserveInventory(orderId: string, items: { sku: string; quantity: number }[]): Promise<void> {
        // Idempotency check
        if (await this.processedEventsRepo.isProcessed(orderId)) {
            console.info(`Order ${orderId} already processed. Skipping.`);
            return;
        }

        // Attempt reservation
        const success = await this.inventoryRepo.reserveItems(items);

        if (success) {
            await this.eventPublisher.publish({
                type: 'InventoryReserved',
                order_id: orderId
            });
            await this.processedEventsRepo.markProcessed(orderId);
            console.info(`Inventory reserved for order ${orderId}`);
        } else {
            await this.eventPublisher.publish({
                type: 'InventoryReservationFailed',
                order_id: orderId,
                reason: 'Insufficient inventory'
            });
            // Mark as processed to prevent infinite retries for logic failures
            await this.processedEventsRepo.markProcessed(orderId);
            console.info(`Inventory reservation failed for order ${orderId}`);
        }
    }
    async getInventory(sku: string): Promise<{ sku: string; quantity: number } | null> {
        return this.inventoryRepo.getInventory(sku);
    }
}

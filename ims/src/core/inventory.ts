export interface Inventory {
    sku: string;
    quantity: number;
    updatedAt?: string;
}

export interface InventoryRepository {
    createInventory(inventory: Inventory): Promise<void>;
    getInventory(sku: string): Promise<Inventory | null>;
    updateInventory(sku: string, quantityChange: number): Promise<void>;
    reserveItems(items: { sku: string; quantity: number }[]): Promise<boolean>;
}

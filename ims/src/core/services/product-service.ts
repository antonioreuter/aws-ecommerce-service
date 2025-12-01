import { Product, ProductRepository } from "../product";
import { InventoryRepository } from "../inventory";

export class ProductService {
    constructor(
        private productRepo: ProductRepository,
        private inventoryRepo: InventoryRepository
    ) {}

    async createProduct(product: Product): Promise<void> {
        await this.productRepo.createProduct(product);
        await this.inventoryRepo.createInventory({ sku: product.sku, quantity: 0 });
    }

    async getProduct(sku: string): Promise<Product & { quantity: number } | null> {
        const product = await this.productRepo.getProduct(sku);
        if (!product) {
            return null;
        }

        const inventory = await this.inventoryRepo.getInventory(sku);
        return {
            ...product,
            quantity: inventory ? inventory.quantity : 0
        };
    }
    async listProducts(limit?: number, nextToken?: string): Promise<{ products: Product[], nextToken?: string }> {
        return this.productRepo.listProducts(limit, nextToken);
    }
}

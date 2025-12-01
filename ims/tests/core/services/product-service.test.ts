import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductService } from '../../../src/core/services/product-service';
import { ProductRepository } from '../../../src/core/product';
import { InventoryRepository } from '../../../src/core/inventory';

describe('ProductService', () => {
    let productService: ProductService;
    let mockProductRepo: ProductRepository;
    let mockInventoryRepo: InventoryRepository;

    beforeEach(() => {
        mockProductRepo = {
            createProduct: vi.fn(),
            getProduct: vi.fn(),
            listProducts: vi.fn(),
        };
        mockInventoryRepo = {
            createInventory: vi.fn(),
            getInventory: vi.fn(),
            updateInventory: vi.fn(),
            reserveItems: vi.fn(),
        };
        productService = new ProductService(mockProductRepo, mockInventoryRepo);
    });

    describe('createProduct', () => {
        it('should create product and initialize inventory', async () => {
            const product = {
                sku: 'SKU123',
                name: 'Test Product',
                description: 'Description',
                price: 100
            };

            await productService.createProduct(product);

            expect(mockProductRepo.createProduct).toHaveBeenCalledWith(product);
            expect(mockInventoryRepo.createInventory).toHaveBeenCalledWith({
                sku: 'SKU123',
                quantity: 0
            });
        });
    });

    describe('getProduct', () => {
        it('should return product with quantity if product exists', async () => {
            const product = {
                sku: 'SKU123',
                name: 'Test Product',
                description: 'Description',
                price: 100
            };
            const inventory = {
                sku: 'SKU123',
                quantity: 50
            };

            vi.mocked(mockProductRepo.getProduct).mockResolvedValue(product);
            vi.mocked(mockInventoryRepo.getInventory).mockResolvedValue(inventory);

            const result = await productService.getProduct('SKU123');

            expect(result).toEqual({
                ...product,
                quantity: 50
            });
        });

        it('should return null if product does not exist', async () => {
            vi.mocked(mockProductRepo.getProduct).mockResolvedValue(null);

            const result = await productService.getProduct('SKU123');

            expect(result).toBeNull();
            expect(mockInventoryRepo.getInventory).not.toHaveBeenCalled();
        });

        it('should return product with 0 quantity if inventory record is missing', async () => {
             const product = {
                sku: 'SKU123',
                name: 'Test Product',
                description: 'Description',
                price: 100
            };

            vi.mocked(mockProductRepo.getProduct).mockResolvedValue(product);
            vi.mocked(mockInventoryRepo.getInventory).mockResolvedValue(null);

            const result = await productService.getProduct('SKU123');

             expect(result).toEqual({
                ...product,
                quantity: 0
            });
        });
    });

    describe('listProducts', () => {
        it('should return list of products', async () => {
            const products = [
                { sku: '1', name: 'P1', description: 'D1', price: 10 },
                { sku: '2', name: 'P2', description: 'D2', price: 20 }
            ];
            const response = { products, nextToken: 'token' };

            vi.mocked(mockProductRepo.listProducts).mockResolvedValue(response);

            const result = await productService.listProducts(10, 'prevToken');

            expect(mockProductRepo.listProducts).toHaveBeenCalledWith(10, 'prevToken');
            expect(result).toEqual(response);
        });
    });
});

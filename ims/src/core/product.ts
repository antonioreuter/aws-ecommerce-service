export interface Product {
    sku: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProductRepository {
    createProduct(product: Product): Promise<void>;
    getProduct(sku: string): Promise<Product | null>;
    listProducts(limit?: number, nextToken?: string): Promise<{ products: Product[], nextToken?: string }>;
}

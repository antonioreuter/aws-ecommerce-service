import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBProductRepository } from '../adapters/dynamodb-product-repository';
import { DynamoDBInventoryRepository } from '../adapters/dynamodb-inventory-repository';
import { ProductService } from '../core/services/product-service';
import { Product } from '../core/product';
import { createApiMiddleware } from '../utils/middleware';
import { createProductSchema } from '../utils/validation-schemas';

const productRepo = new DynamoDBProductRepository(process.env.PRODUCT_TABLE_NAME || '');
const inventoryRepo = new DynamoDBInventoryRepository(process.env.INVENTORY_TABLE_NAME || '');
const productService = new ProductService(productRepo, inventoryRepo);

const baseHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const product: Product = event.body as any; // Body is already parsed by middleware

    await productService.createProduct(product);

    return {
        statusCode: 201,
        body: JSON.stringify({ message: 'Product created successfully', sku: product.sku }),
    };
};

export const handler = createApiMiddleware(createProductSchema).handler(baseHandler);

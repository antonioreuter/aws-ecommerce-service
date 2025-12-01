import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBProductRepository } from '../adapters/dynamodb-product-repository';
import { DynamoDBInventoryRepository } from '../adapters/dynamodb-inventory-repository';
import { ProductService } from '../core/services/product-service';
import { createApiMiddleware } from '../utils/middleware';
import { getProductSchema } from '../utils/validation-schemas';

const productRepo = new DynamoDBProductRepository(process.env.PRODUCT_TABLE_NAME || '');
const inventoryRepo = new DynamoDBInventoryRepository(process.env.INVENTORY_TABLE_NAME || '');
const productService = new ProductService(productRepo, inventoryRepo);

const baseHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const sku = event.pathParameters!.sku!; // Validated by middleware

    const result = await productService.getProduct(sku);
    if (!result) {
        return { statusCode: 404, body: JSON.stringify({ message: 'Product not found' }) };
    }

    return {
        statusCode: 200,
        body: JSON.stringify(result),
    };
};

export const handler = createApiMiddleware(getProductSchema).handler(baseHandler);

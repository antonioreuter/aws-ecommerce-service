import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBProductRepository } from '../adapters/dynamodb-product-repository';
import { DynamoDBInventoryRepository } from '../adapters/dynamodb-inventory-repository';
import { ProductService } from '../core/services/product-service';
import { createApiMiddleware } from '../utils/middleware';
import { listProductsSchema } from '../utils/validation-schemas';

const productRepo = new DynamoDBProductRepository(process.env.PRODUCT_TABLE_NAME || '');
const inventoryRepo = new DynamoDBInventoryRepository(process.env.INVENTORY_TABLE_NAME || '');
const productService = new ProductService(productRepo, inventoryRepo);

const baseHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const limit = event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit) : 10;
    const nextToken = event.queryStringParameters?.next_token;

    const result = await productService.listProducts(limit, nextToken);

    return {
        statusCode: 200,
        body: JSON.stringify(result),
    };
};

export const handler = createApiMiddleware(listProductsSchema).handler(baseHandler);

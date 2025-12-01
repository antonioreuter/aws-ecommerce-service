import { describe, it, expect, beforeAll } from 'vitest';

// Wait for schemas to load
let schemas: any;

beforeAll(async () => {
    // Give time for async schema loading
    await new Promise(resolve => setTimeout(resolve, 100));
    schemas = await import('../../src/utils/validation-schemas');
});

describe('Validation Schemas', () => {
    describe('createProductSchema', () => {
        it('should load schema from OpenAPI spec', () => {
            expect(schemas.createProductSchema).toBeDefined();
            expect(schemas.createProductSchema.type).toBe('object');
            expect(schemas.createProductSchema.required).toContain('body');
        });

        it('should have correct body schema structure', () => {
            const bodySchema = schemas.createProductSchema.properties.body;
            expect(bodySchema).toBeDefined();
            expect(bodySchema.required).toContain('sku');
            expect(bodySchema.required).toContain('name');
            expect(bodySchema.required).toContain('price');
        });

        it('should have correct property types', () => {
            const properties = schemas.createProductSchema.properties.body.properties;
            expect(properties.sku.type).toBe('string');
            expect(properties.name.type).toBe('string');
            expect(properties.price.type).toBe('number');
        });
    });

    describe('getProductSchema', () => {
        it('should require path parameters', () => {
            expect(schemas.getProductSchema.required).toContain('pathParameters');
            expect(schemas.getProductSchema.properties.pathParameters).toBeDefined();
        });

        it('should require sku in path parameters', () => {
            const pathParams = schemas.getProductSchema.properties.pathParameters;
            expect(pathParams.required).toContain('sku');
            expect(pathParams.properties.sku.type).toBe('string');
        });
    });

    describe('listProductsSchema', () => {
        it('should have query parameters', () => {
            expect(schemas.listProductsSchema.properties.queryStringParameters).toBeDefined();
        });

        it('should support limit and next_token parameters', () => {
            const queryParams = schemas.listProductsSchema.properties.queryStringParameters;
            expect(queryParams.properties).toHaveProperty('limit');
            expect(queryParams.properties).toHaveProperty('next_token');
        });
    });

    describe('checkAvailabilitySchema', () => {
        it('should require items array in body', () => {
            const bodySchema = schemas.checkAvailabilitySchema.properties.body;
            expect(bodySchema.required).toContain('items');
            expect(bodySchema.properties.items.type).toBe('array');
        });

        it('should define item schema with sku and quantity', () => {
            const itemSchema = schemas.checkAvailabilitySchema.properties.body.properties.items.items;
            expect(itemSchema.required).toContain('sku');
            expect(itemSchema.required).toContain('quantity');
            expect(itemSchema.properties.sku.type).toBe('string');
            expect(itemSchema.properties.quantity.type).toBe('integer');
        });
    });

    describe('getInventorySchema', () => {
        it('should require sku in path parameters', () => {
            expect(schemas.getInventorySchema.required).toContain('pathParameters');
            const pathParams = schemas.getInventorySchema.properties.pathParameters;
            expect(pathParams.required).toContain('sku');
        });
    });

    describe('Schema Generation', () => {
        it('should generate schemas for all operations', () => {
            expect(schemas.createProductSchema).toBeDefined();
            expect(schemas.getProductSchema).toBeDefined();
            expect(schemas.listProductsSchema).toBeDefined();
            expect(schemas.checkAvailabilitySchema).toBeDefined();
            expect(schemas.getInventorySchema).toBeDefined();
        });

        it('should have consistent schema structure', () => {
            const allSchemas = [
                schemas.createProductSchema,
                schemas.getProductSchema,
                schemas.listProductsSchema,
                schemas.checkAvailabilitySchema,
                schemas.getInventorySchema
            ];
            
            allSchemas.forEach((schema: any) => {
                expect(schema.type).toBe('object');
                expect(schema.properties).toBeDefined();
            });
        });
    });
});

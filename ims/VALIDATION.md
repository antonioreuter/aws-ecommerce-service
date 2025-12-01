# Input Validation Implementation

## Overview

The IMS service now implements robust input validation using **Middy middleware** and **AJV (Another JSON Schema Validator)**. This approach provides:

- **Schema-based validation** aligned with the OpenAPI specification
- **Automatic request parsing** (JSON body parsing)
- **Centralized error handling**
- **Type safety** with TypeScript
- **Reusable middleware** across all handlers

## Architecture

### Components

1. **OpenAPI Specification** (`documentation/api/ims.yaml`)

   - **Single source of truth** for API contracts
   - Defines request/response schemas, parameters, and validation rules
   - Maintained independently of implementation code

2. **Schema Loader** (`src/utils/validation-schemas.ts`)

   - **Dynamically loads** OpenAPI spec at runtime
   - **Automatically generates** JSON schemas for validation
   - Maps OpenAPI `operationId` to validation schemas
   - Resolves `$ref` references to component schemas
   - No manual schema duplication required

3. **Middleware Factory** (`src/utils/middleware.ts`)

   - `createApiMiddleware()`: Creates middleware stack for API Gateway handlers
   - Includes: JSON body parser, validator, error handler
   - Type-safe with proper TypeScript generics

4. **Handler Implementation**
   - All API handlers wrapped with middleware
   - Validation happens before handler execution
   - Invalid requests return 400 with detailed error messages

## How It Works

The validation system uses a **simple, generic approach**:

1. **Loads** the OpenAPI spec from `documentation/api/ims.yaml` at module initialization
2. **Dereferences** all `$ref` pointers automatically using `@apidevtools/json-schema-ref-parser`
3. **Finds** the operation by `operationId` (e.g., `createProduct`, `getProduct`)
4. **Extracts** validation rules using a single generic function:
   - Request body: `requestBody.content['application/json'].schema`
   - Path parameters: `parameters` where `in === 'path'`
   - Query parameters: `parameters` where `in === 'query'`
5. **Generates** JSON Schema compatible with AJV validator
6. **Validates** incoming requests against the generated schema

**That's it!** No manual schema mapping, no complex logic. Just point to the `operationId` and validation works automatically.

## Validation Schemas

### Create Product

```typescript
{
  body: {
    required: ['sku', 'name', 'price'],
    properties: {
      sku: string,
      name: string,
      description: string (optional),
      price: number,
      image_url: string (optional)
    }
  }
}
```

### Check Availability

```typescript
{
  body: {
    required: ['items'],
    properties: {
      items: Array<{
        sku: string,
        quantity: integer
      }>
    }
  }
}
```

### Path Parameters (Get Product, Get Inventory)

```typescript
{
  pathParameters: {
    required: ['sku'],
    properties: {
      sku: string
    }
  }
}
```

### Query Parameters (List Products)

```typescript
{
  queryStringParameters: {
    limit: string (optional),
    next_token: string (optional)
  }
}
```

## Benefits

1. **Single Source of Truth**: OpenAPI spec is the only place to define validation rules
2. **No Duplication**: Schemas are generated automatically, not manually maintained
3. **Consistency**: All handlers use the same validation approach derived from the spec
4. **Maintainability**: Update OpenAPI spec once, validation updates automatically
5. **Security**: Invalid inputs rejected before reaching business logic
6. **Developer Experience**: Clear error messages for debugging
7. **Performance**: Validation happens early in the request lifecycle
8. **Type Safety**: TypeScript ensures correct handler signatures
9. **Documentation**: OpenAPI spec serves as both documentation and validation source

## Example Usage

```typescript
// Schemas are automatically generated from OpenAPI spec
import { createApiMiddleware } from "../utils/middleware";
import { createProductSchema } from "../utils/validation-schemas";

// The schema is loaded from documentation/api/ims.yaml
// based on the operationId 'createProduct'
const baseHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Body is already parsed and validated against the OpenAPI schema
  const product = event.body as any;
  // ... business logic
};

export const handler =
  createApiMiddleware(createProductSchema).handler(baseHandler);
```

## Updating Validation Rules

To update validation rules:

1. **Edit** `documentation/api/ims.yaml`
2. **Modify** the relevant schema or parameters
3. **Rebuild** the application (`npm run build`)
4. **Deploy** - validation automatically uses the updated rules

No code changes needed in `validation-schemas.ts`!

## Adding New Endpoints

To add a new validated endpoint:

1. **Define** the endpoint in `documentation/api/ims.yaml`:

   ```yaml
   /products/{sku}/stock:
     put:
       operationId: updateStock
       parameters:
         - name: sku
           in: path
           required: true
           schema:
             type: string
       requestBody:
         content:
           application/json:
             schema:
               type: object
               required: [quantity]
               properties:
                 quantity:
                   type: integer
   ```

2. **Export** the schema in `validation-schemas.ts`:

   ```typescript
   export const updateStockSchema = createSchemaForOperation("updateStock");
   ```

3. **Use** in your handler:

   ```typescript
   import { updateStockSchema } from "../utils/validation-schemas";

   const baseHandler = async (event, context) => {
     /* ... */
   };
   export const handler =
     createApiMiddleware(updateStockSchema).handler(baseHandler);
   ```

**Done!** The validation automatically works based on your OpenAPI definition.

## Error Responses

Invalid requests automatically return:

```json
{
  "statusCode": 400,
  "body": {
    "message": "Event object failed validation",
    "details": [
      /* AJV validation errors */
    ]
  }
}
```

## Future Enhancements

1. **Custom Error Messages**: Provide more user-friendly validation messages
2. **OpenAPI Integration**: Generate schemas directly from OpenAPI spec
3. **Request/Response Logging**: Add logging middleware
4. **Rate Limiting**: Add rate limiting middleware
5. **Authentication**: Add auth middleware for API key validation

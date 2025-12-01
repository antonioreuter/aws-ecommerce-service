import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Load OpenAPI spec synchronously at module initialization
const openApiPath = path.join(__dirname, '../../ims.yaml');
const rawSpec = yaml.load(fs.readFileSync(openApiPath, 'utf8')) as any;

// Simple function to resolve $ref pointers
function resolveRef(ref: string, spec: any): any {
  const parts = ref.replace('#/', '').split('/');
  let result = spec;
  for (const part of parts) {
    result = result[part];
  }
  return result;
}

// Recursively dereference all $ref in an object
function dereferenceSchema(schema: any, spec: any): any {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, spec);
    return dereferenceSchema(resolved, spec);
  }

  if (Array.isArray(schema)) {
    return schema.map(item => dereferenceSchema(item, spec));
  }

  const result: any = {};
  for (const [key, value] of Object.entries(schema)) {
    result[key] = dereferenceSchema(value, spec);
  }
  return result;
}

const openApiSpec = dereferenceSchema(rawSpec, rawSpec);

/**
 * Generic function to create validation schema from OpenAPI operation
 * @param operationId - The operationId from OpenAPI spec
 */
function createSchemaForOperation(operationId: string): any {
  // Find the operation
  for (const [pathKey, pathItem] of Object.entries(openApiSpec.paths)) {
    for (const [method, operation] of Object.entries(pathItem as any)) {
      const op = operation as any;
      if (op?.operationId === operationId) {
        const schema: any = {
          type: 'object',
          properties: {},
          required: []
        };

        // Add request body validation
        if (op.requestBody?.content?.['application/json']?.schema) {
          schema.properties.body = op.requestBody.content['application/json'].schema;
          schema.required.push('body');
        }

        // Add path parameters validation
        const pathParams = (op.parameters || []).filter((p: any) => p.in === 'path');
        if (pathParams.length > 0) {
          schema.properties.pathParameters = {
            type: 'object',
            properties: {},
            required: []
          };
          
          pathParams.forEach((param: any) => {
            schema.properties.pathParameters.properties[param.name] = param.schema;
            if (param.required) {
              schema.properties.pathParameters.required.push(param.name);
            }
          });
          
          schema.required.push('pathParameters');
        }

        // Add query parameters validation
        const queryParams = (op.parameters || []).filter((p: any) => p.in === 'query');
        if (queryParams.length > 0) {
          schema.properties.queryStringParameters = {
            type: 'object',
            properties: {}
          };
          
          queryParams.forEach((param: any) => {
            // Query params are always strings in API Gateway
            schema.properties.queryStringParameters.properties[param.name] = { type: 'string' };
          });
        }

        return schema;
      }
    }
  }

  throw new Error(`Operation ${operationId} not found in OpenAPI spec`);
}

// Export schemas - these are now loaded synchronously
export const createProductSchema = createSchemaForOperation('createProduct');
export const getProductSchema = createSchemaForOperation('getProduct');
export const listProductsSchema = createSchemaForOperation('listProducts');
export const getInventorySchema = createSchemaForOperation('getInventory');
export const checkAvailabilitySchema = createSchemaForOperation('checkInventory');

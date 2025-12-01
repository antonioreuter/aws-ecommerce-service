import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import validator from '@middy/validator';
import { transpileSchema } from '@middy/validator/transpile';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

/**
 * Creates a standardized middleware stack for API Gateway handlers
 * @param schema - JSON Schema for request validation
 */
export const createApiMiddleware = (schema?: any) => {
  const middleware = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
    .use(httpJsonBodyParser())
    .use(httpErrorHandler());

  if (schema) {
    middleware.use(
      validator({
        eventSchema: transpileSchema(schema),
      })
    );
  }

  return middleware;
};

/**
 * Creates a standardized middleware stack for SQS handlers
 */
export const createSqsMiddleware = () => {
  return middy()
    .use(httpErrorHandler());
};

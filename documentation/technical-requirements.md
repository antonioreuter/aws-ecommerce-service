# Technical Requirements

## General

The code generated must be production ready, following best practices and security standards.

Apply clean code principles and SOLID principles. Use dependency injection and design patterns where appropriate. The code must be easy to maintain and scale.

The code must be easy to test and debug. Use unit tests and integration tests where appropriate.

Promote code quality and security by using static code analysis tools and code review processes.

All the resources created in AWS must be created in the same region and be tagged with the same tags:

- Service: OMS, IMS, or Observability
- Environment: dev or prod
- Version: 1.0.0

## For the Order Management System (OMS) and Inventory Management System (IMS)

### Architecture

The architecture must be serverless and event-driven.

The code must follow the hexagonal architecture. The idea is to separate the core logic from the infrastructure. This will make the code easier to test and debug. The hexagonal architecture will also make the code easier to scale and maintain.

### Infrastructure

The code must be deployed in AWS. We will use AWS SAM for serverless deployment.

Each service must have its own CloudFormation stack, one for the OMS and one for the IMS.

### Language

For this project we will use typescript and node.js 22.x.

### Frameworks

Pino for logging.
Vitest for testing.
AWS SDK for JavaScript (Node.js) for AWS services.
ESLint for code quality.

### Observability

The code must be instrumented with AWS X-Ray using the ADOT (AWS Distro for OpenTelemetry) for Node.js.

- **Distributed Tracing**: All asynchronous messages (SQS) and synchronous API calls must propagate the W3C Trace Context (Trace ID). The system must visualize the full transaction lifecycle from API Gateway -> OMS Lambda -> SQS -> IMS Lambda.

### Reliability

- **Dead Letter Queues (DLQ)**: All SQS queues must be configured with a Dead Letter Queue (DLQ) and a corresponding CloudWatch Alarm that triggers when `ApproximateNumberOfMessagesVisible > 0`. A 'Redrive Policy' workflow must be defined.
- **Idempotency**: All event consumers (Lambda functions processing SQS) must implement idempotency checks to handle potential duplicate message delivery.

### Load Testing

The code must be load tested using K6. We want to test the system under load and measure the performance of the system. The load test will also be used to collect a baseline for the system, in this case we do not expect high load, but we want to measure the performance of the system.

### Deployment

The code must be deployed using github actions. The pipeline must be triggered on push to the main branch. Create individual steps for each service, one for the OMS and one for the IMS

## For the Observability Stack

To be defined in another moment.

## Project Structure

The project should follow a standard SAM/Monorepo structure:

```
.
├── oms/
│   ├── src/
│   │   ├── handlers/       # Lambda handlers
│   │   ├── core/           # Domain logic (Hexagonal: Ports & Adapters)
│   │   ├── adapters/       # Secondary adapters (DynamoDB, SQS)
│   │   └── utils/
│   ├── tests/
│   ├── template.yaml       # SAM template for OMS
│   ├── package.json
│   └── tsconfig.json
├── ims/
│   ├── src/
│   │   ├── handlers/
│   │   ├── core/
│   │   ├── adapters/
│   │   └── utils/
│   ├── tests/
│   ├── template.yaml       # SAM template for IMS
│   ├── package.json
│   └── tsconfig.json
├── shared/                 # Shared types/libs (if any)
└── package.json            # Root package.json (workspaces)
```

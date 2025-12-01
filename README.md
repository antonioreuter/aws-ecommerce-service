# AWS E-commerce Service POC: AI-Powered Observability & Remediation

## Overview

This project is a Proof of Concept (POC) designed to demonstrate an **AI Agent-driven observability and remediation system** for a distributed serverless application on AWS.

The core application consists of two decoupled microservices:

- **Order Management System (OMS)**
- **Inventory Management System (IMS)**

These services interact asynchronously to simulate a realistic e-commerce environment. The primary innovation of this project is the integration of an **AI Agent** (built with AWS Strands Agents framework) that autonomously monitors, diagnoses, and remediates issues using CloudWatch Application Signals and other AWS observability tools.

## Architecture

- **Pattern**: Serverless, Event-Driven, Hexagonal Architecture.
- **Communication**: Asynchronous messaging via Amazon SQS.
- **Data Isolation**: Shared-nothing architecture; each service owns its data (DynamoDB).
- **Observability**: Comprehensive instrumentation with AWS X-Ray (ADOT) and CloudWatch.

## Components

### 1. Order Management System (OMS)

Handles the lifecycle of orders, from creation to fulfillment.

- [OMS Specification](documentation/oms-specification.md)

### 2. Inventory Management System (IMS)

Manages product inventory, reservations, and availability checks.

- [IMS Specification](documentation/ims-specification.md)

### 3. AI Agent

An intelligent agent capable of:

- **Proactive Monitoring**: Detecting anomalies via Service Level Objectives (SLOs).
- **Root Cause Analysis (RCA)**: Analyzing logs and traces to pinpoint failures.
- **Autonomous Remediation**: Proposing and executing fixes (e.g., code changes, config updates) via Pull Requests.
- **Post-Incident Analysis**: Generating structured post-mortem reports.

## Technology Stack

- **Language**: TypeScript (Node.js 22.x)
- **Infrastructure as Code**: AWS SAM (Serverless Application Model)
- **Testing**: Vitest (Unit/Integration), K6 (Load Testing)
- **Logging**: Pino
- **CI/CD**: GitHub Actions

## Project Structure

The project follows a monorepo structure (planned):

```
.
├── oms/                # Order Management System service
├── ims/                # Inventory Management System service
├── shared/             # Shared libraries and types
├── documentation/      # Detailed specifications and diagrams
└── README.md           # This file
```

## Documentation

For detailed technical requirements and specifications, please refer to the following documents:

- [Main Specification](documentation/main-specification.md): Executive summary and high-level architecture.
- [Technical Requirements](documentation/technical-requirements.md): detailed tech stack, coding standards, and infrastructure requirements.
- [OMS Specification](documentation/oms-specification.md): Detailed design of the Order Management System.
- [IMS Specification](documentation/ims-specification.md): Detailed design of the Inventory Management System.

## Getting Started

_Note: This project is currently in the design and specification phase._

Please review the `documentation/` directory to understand the system design and requirements.

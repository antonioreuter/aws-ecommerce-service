# Order Management System (OMS)

![OMS Architecture](images/oms-architecture.png)

## Managing Orders

Users shall be able to create, list and delete orders.
In order to interact with the system, the user must provide a valid API key.

## System Diagrams

### Entity Relationship Diagram

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER ||--o{ DELIVERY : triggers

    CUSTOMER {
        string id PK
        string email
    }
    ORDER {
        string id PK
        string customer_id FK
        string status
    }
    DELIVERY {
        string id PK
        string order_id FK
        string status
    }
```

### Order State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING_INVENTORY: Create Order
    PENDING_INVENTORY --> CONFIRMED: Inventory Reserved
    PENDING_INVENTORY --> CANCELLED: Inventory Unavailable
    CONFIRMED --> [*]
    CANCELLED --> [*]
```

### Create Order Flow

```mermaid
sequenceDiagram
    participant User
    participant API as API Gateway
    participant OMS as OMS Lambda
    participant DB as Order Table
    participant SQS as IMS Queue
    participant IMS as IMS Lambda
    participant InvDB as Inventory Table
    participant Events as OMS Events Queue

    User->>API: POST /orders
    API->>OMS: Invoke CreateOrder
    OMS->>DB: PutItem (Status: PENDING_INVENTORY)
    OMS->>SQS: SendMessage (ReserveInventory)
    OMS-->>API: Return OrderID
    API-->>User: 201 Created

    SQS->>IMS: Consume Message
    IMS->>InvDB: Check & Decrement Stock
    alt Stock Available
        IMS->>InvDB: Update Quantity
        IMS->>Events: SendMessage (InventoryReserved)
    else Stock Unavailable
        IMS->>Events: SendMessage (InventoryReservationFailed)
    end

    Events->>OMS: Consume Event
    alt InventoryReserved
        OMS->>DB: UpdateItem (Status: CONFIRMED)
    else InventoryReservationFailed
        OMS->>DB: UpdateItem (Status: CANCELLED)
    end
```

## Data Model

The system shall use DynamoDB. To ensure scalability and support the required access patterns, we will use the following schema designs.

### Order Table (`OrderTable`)

- **Primary Key**: `id` (String)
- **GSI1 (By Customer)**:
  - Partition Key: `customer_id` (String)
  - Sort Key: `created_at` (String, ISO 8601)
  - _Purpose_: List orders by customer, sorted by date.
- **GSI2 (By Status)**:
  - Partition Key: `status` (String)
  - Sort Key: `created_at` (String, ISO 8601)
  - _Purpose_: List orders by status.

**Attributes**:

- `id`: Order ID (UUID)
- `customer_id`: Customer ID
- `items`: List of maps `[{sku, quantity, price, name}]`
- `total`: Number
- `status`: String (`PENDING_INVENTORY`, `CONFIRMED`, `CANCELLED`)
- `created_at`: String (ISO 8601)
- `updated_at`: String (ISO 8601)

### Customer Table (`CustomerTable`)

- **Primary Key**: `id` (String)

**Attributes**:

- `id`: Customer ID
- `name`: String
- `email`: String
- `address`: String

### Delivery Table (`DeliveryTable`)

- **Primary Key**: `id` (String)
- **GSI1**: `order_id` (Partition Key)

## Operations & API Specification

The API must be exposed via API Gateway.

### Create Order

**Endpoint**: `POST /orders`
**Request Body**:

```json
{
  "customer_id": "string",
  "items": [{ "sku": "string", "quantity": 1 }]
}
```

**Logic**:

1. Validate `customer_id` exists in `CustomerTable`.
2. Create Order in `OrderTable` with status `PENDING_INVENTORY`.
3. Send `ReserveInventory` message to IMS SQS.
4. Return `201 Created` with `{ "order_id": "..." }`.

### List Orders

**Endpoint**: `GET /orders`
**Query Parameters**:

- `customer_id` (Required)
- `status` (Optional)
- `start_date` (Optional, ISO 8601)
- `end_date` (Optional, ISO 8601)

**Logic**:

- Use `GSI1` to query by `customer_id`.
- Apply filter expressions for `status` or date range if provided.
- Implement pagination (Limit/NextToken).

### Get Order

**Endpoint**: `GET /orders/{id}`
**Logic**: Get item by PK from `OrderTable`.

### Delete Order

**Endpoint**: `DELETE /orders/{id}`
**Logic**: Delete item by PK from `OrderTable`.

## Messaging Contracts

### OMS -> IMS (Reserve Inventory)

**Queue**: `IMS-InventoryQueue`
**Message Body**:

```json
{
  "type": "ReserveInventory",
  "order_id": "uuid",
  "customer_id": "string",
  "items": [{ "sku": "string", "quantity": 1 }],
  "timestamp": "iso-date"
}
```

### IMS -> OMS (Reservation Result)

**Queue**: `OMS-OrderEventsQueue`
**Message Body**:

```json
{
  "type": "InventoryReserved" | "InventoryReservationFailed",
  "order_id": "uuid",
  "reason": "string (optional)"
}
```

**OMS Handler Logic**:

- On `InventoryReserved`: Update Order status to `CONFIRMED`.
- On `InventoryReservationFailed`: Update Order status to `CANCELLED`.

## AWS Services Configuration

### DynamoDB

- Billing Mode: On-Demand
- Encryption: AWS Managed Key
- Stream: Enabled (New and Old Images) for `OrderTable`.

### API Gateway

- Type: REST API
- Auth: Custom Lambda Authorizer
- Stages: `dev`, `prod`

### SQS

- **OMS-OrderEventsQueue**: Standard Queue.
- **OMS-OrderEventsDLQ**: Dead Letter Queue for the Order Events Queue.
- **IMS-InventoryQueue**: Referenced only (Created by IMS).

### Lambda

- Runtime: Node.js 22.x
- Architecture: arm64
- Environment Variables:
  - `ORDER_TABLE_NAME`
  - `CUSTOMER_TABLE_NAME`
  - `IMS_QUEUE_URL`

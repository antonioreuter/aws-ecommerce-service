import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { EventPublisher } from "../core/event-publisher";

const sqsClient = new SQSClient({});

export class SqsEventPublisher implements EventPublisher {
    private queueUrl: string;

    constructor(queueUrl: string) {
        this.queueUrl = queueUrl;
    }

    async publish(message: any): Promise<void> {
        await sqsClient.send(new SendMessageCommand({
            QueueUrl: this.queueUrl,
            MessageBody: JSON.stringify(message)
        }));
    }
}

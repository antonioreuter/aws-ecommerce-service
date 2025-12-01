export interface EventPublisher {
    publish(message: any): Promise<void>;
}

import { GameStatusUpdateEvent } from "../event"

interface CustomEventRecord
{
    "game_status_update": GameStatusUpdateEvent
}

declare global
{
    interface Window
    {
        addEventListener<EventName extends keyof CustomEventRecord>(
            type: EventName,
            listener: (this: Window, event: CustomEventRecord[EventName]) => any,
            options?: boolean | AddEventListenerOptions
        ): void;

        removeEventListener<EventName extends keyof CustomEventRecord>(
            type: EventName,
            listener: (this: Window, event: CustomEventRecord[EventName]) => any,
            options?: boolean | EventListenerOptions
        ): void;

        dispatchEvent<EventName extends keyof CustomEventRecord>(event: CustomEventRecord[EventName]): void;
    }
}
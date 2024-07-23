import { GameResult } from "@/game/manager/GameManager";
import { NotificationInstance, ArgsProps as NotifArgs } from "antd/es/notification/interface";

export type GameStatusUpdateEvent = CustomEvent<
    | { type: "load_start" }
    | { type: "load_end" }
    | { type: "game_end", result: GameResult }
    | { type: "key_range_change", start: number, end: number }
    | {
        type: "request_pop_up", kind: Exclude<keyof NotificationInstance, "open" | "destroy">,
        message: string, placement?: NotifArgs["placement"]
    }
>
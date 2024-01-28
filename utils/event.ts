import { GameResult } from "@/game/manager/GameManager";

export type GameStatusUpdateEvent = CustomEvent<
    { type: "load_start" }
    | { type: "load_end" }
    | { type: "game_end", result: GameResult }
>
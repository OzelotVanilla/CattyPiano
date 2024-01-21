import { GameResult } from "@/game/manager/GameManager";

export type GameEndEvent = CustomEvent<
    GameResult & {

    }
>
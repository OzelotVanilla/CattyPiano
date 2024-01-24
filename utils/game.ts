import { GameNote } from "@/game/manager/GameManager";

export function isTapNote(note: GameNote)
{
    return note.fully_play_time == undefined
}

export function isHoldNote(note: GameNote)
{
    return note.fully_play_time != undefined
}
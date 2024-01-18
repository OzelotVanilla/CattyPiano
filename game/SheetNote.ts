import { midi_note_to_name } from "@/utils/constant_store";
import { Time } from "tone/build/esm/core/type/Units";
import { JSONSheetNote } from "./MusicSheet";

export class SheetNote
{
    /** Note num in MIDI. */
    public readonly midi_num: number
    /** Note time in transport. */
    public readonly time: Time
    /** Note duration (play time). */
    public readonly duration: Time
    /** Time to fully play this note in game. */
    public readonly fully_play_time?: Time
    /** Key to press to play this note. */
    public readonly key_to_trigger?: string
    /** Get note name representation such as `C3`. */
    public get name() { return midi_note_to_name[this.midi_num] }

    constructor({
        midi_num, time, duration, fully_play_time, key_to_trigger
    }: SheetNote_Constructor)
    {
        this.midi_num = midi_num
        this.time = time
        this.duration = duration
        this.fully_play_time = fully_play_time
        this.key_to_trigger = key_to_trigger
    }

    public static fromSheetNote(note: JSONSheetNote)
    {
        return new SheetNote({
            midi_num: note.n,
            time: note.t,
            duration: note.d,
            fully_play_time: note.p,
            key_to_trigger: note.k
        })
    }
}

export type SheetNote_Constructor = {
    /** Note num in MIDI. */
    midi_num: number
    /** Note time in transport. */
    time: Time
    /** Note duration (play time). */
    duration: Time
    /** Time to fully play this note in game. */
    fully_play_time?: Time
    /** 
     * Key to press to play this note.
     * 
     * E.g. If you are designing a note that should use `1` to trigger.
     */
    key_to_trigger?: string
}
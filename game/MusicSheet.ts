import { Time } from "tone/build/esm/core/type/Units";
import { SheetNote } from "./SheetNote";

export class MusicSheet
{
    public readonly name: string
    public readonly bpm: number
    public readonly notes: SheetNote[]
    public readonly time_signature: [number, number]

    constructor(sheet_data: JSONSheetData)
    {
        // Read the JSON file of sheet data
        this.name = sheet_data.name ?? ""
        this.bpm = sheet_data.bpm ?? 90
        this.notes = sheet_data.notes.map(note => SheetNote.fromSheetNote(note))
        this.time_signature = (sheet_data.time_signature ?? "4/4").split("/").map(s => parseInt(s)) as [number, number]
    }
}

/**
 * The type of a `song.json` file.
 */
export type SongJSONData = {
    name: string
    bgm?: string
    sheet?: string
}

/**
 * The type of a sheet file, usually `sheet.json`.
 */
export type JSONSheetData = {
    name: string
    bpm?: number
    time_signature?: string
    notes: JSONSheetNote[]
}

export type JSONSheetNote = {
    /** Note num in MIDI. */
    n: number

    /** Note time in transport. */
    t: string | number // `Time`

    /** Note duration (play time). */
    d: string | number // `Time`

    /** Time to fully play this note in game. */
    p?: string | number // `Time`

    /** Key to press to play this note. */
    k?: string
}
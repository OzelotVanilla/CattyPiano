import { convertKeyNameToNoteNum } from "@/utils/music";

export class GameNote
{
    public readonly note_name: string;
    public readonly note_time_in_transport: number;
    public get midi_num() { return convertKeyNameToNoteNum(this.note_name) }

    constructor(note_name: string, note_time_in_transport: number)
    {
        this.note_name = note_name
        this.note_time_in_transport = note_time_in_transport
    }
}
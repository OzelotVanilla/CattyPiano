"use client"

import { midi_note_to_name } from "@/utils/constant_store";
import { isClientEnvironment } from "@/utils/env";
import { convertNoteNumToKeyName } from "@/utils/music";
import { Sampler, Player } from "tone"
import { getTransport as getToneTransport, context as tone_context } from "tone";
import { Time } from "tone/build/esm/core/type/Units";

export const global_audio_channel_count = 6

export type AvailableInstrument = "piano"

type Param_playNote = {
    instrument?: AvailableInstrument
    duration?: Time
}

export class SoundManager
{
    private static tonejs_instruments: Map<AvailableInstrument, Sampler> = new Map();

    private static bgm_player: Player;

    static {
        if (isClientEnvironment())
        {
            this.tonejs_instruments.set("piano",
                new Sampler({
                    urls: Object.fromEntries(new Map(
                        [...new Array(81)] // From `C1` to `G7` (this sample only has this range)
                            .map((_, index) => midi_note_to_name[index + 24]!)
                            .map(s => [s, `${s.replace("#", "s")}.mp3`])
                    )),
                    baseUrl: "/instrument_sample/piano/",
                    release: 1
                }).toDestination()
            )
        }
    }

    public static playNote(midi_note_number: number, param?: Param_playNote): void;
    public static playNote(note_name: string, param?: Param_playNote): void;
    public static playNote(midi_note_numbers: number[], param?: Param_playNote): void;
    public static playNote(note_names: string[], param?: Param_playNote): void;
    public static playNote(
        note: string | number | string[] | number[],
        { instrument = "piano", duration = 1 }: Param_playNote
    ): void
    {
        let keys_to_play = this.convertInputNotesToKeyNames(note)

        this.tonejs_instruments.get(instrument)?.triggerAttackRelease(keys_to_play, duration, tone_context.currentTime)
    }

    public static startNote(midi_note_number: number, instrument?: AvailableInstrument): void;
    public static startNote(note_name: string, instrument?: AvailableInstrument): void;
    public static startNote(midi_note_numbers: number[], instrument?: AvailableInstrument): void;
    public static startNote(note_names: string[], instrument?: AvailableInstrument): void;
    /**
     * Start playing a note, will not stop until calling `releaseNote`.
     * 
     * @param note 
     */
    public static startNote(
        note: string | number | string[] | number[],
        instrument: AvailableInstrument = "piano"
    )
    {
        this.tonejs_instruments.get(instrument)?.triggerAttack(this.convertInputNotesToKeyNames(note), tone_context.currentTime)
    }

    public static releaseNote(midi_note_number: number, instrument?: AvailableInstrument): void;
    public static releaseNote(note_name: string, instrument?: AvailableInstrument): void;
    public static releaseNote(midi_note_numbers: number[], instrument?: AvailableInstrument): void;
    public static releaseNote(note_names: string[], instrument?: AvailableInstrument): void;
    /**
     * Stop one or more playing note(s).
     * 
     * @param note 
     */
    public static releaseNote(
        note: string | number | string[] | number[],
        instrument: AvailableInstrument = "piano"
    )
    {
        this.tonejs_instruments.get(instrument)?.triggerRelease(this.convertInputNotesToKeyNames(note), tone_context.currentTime)
    }

    public static releaseAllNote(instrument: AvailableInstrument = "piano")
    {
        this.tonejs_instruments.get(instrument)?.releaseAll(tone_context.currentTime)
    }

    public static getPiano()
    {
        return this.tonejs_instruments.get("piano")
    }

    public static getBgmPlayerTime()
    {
        return this.bgm_player.immediate()
    }

    public static loadBgm(url: string)
    {
        return this.bgm_player.load(url)
    }

    public static startBgm()
    {
        return this.bgm_player.start()
    }

    public static pauseBgm()
    {
        return this.bgm_player.stop()
    }

    public static resumeBgm()
    {
        return this.bgm_player.start(undefined, getToneTransport().seconds)
    }

    public static convertInputNotesToKeyNames(value: string | number | string[] | number[]): string[]
    {
        let keys_to_play: string[]
        if (value instanceof Array)
        {
            if (value.length == 0) { return []; }

            switch (typeof value[0])
            {
                case "string": keys_to_play = value as string[]; break
                case "number": keys_to_play = (value as number[]).map((num) => convertNoteNumToKeyName(num)); break
            }
        }
        else
        {
            switch (typeof value)
            {
                case "string": keys_to_play = [value]; break
                case "number": keys_to_play = [convertNoteNumToKeyName(value)]; break
            }
        }

        return keys_to_play
    }
}
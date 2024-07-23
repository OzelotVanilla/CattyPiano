import { NoteRating } from "@/game/manager/GameManager";

export const default_piano_keyboard_layout: Record<PossibleKeyInput, PossibleNoteName> = {
    "a": "A3",
    "w": "A#3",
    "s": "B3",
    "d": "C4",
    "r": "C#4",
    "f": "D4",
    "t": "D#4",
    "g": "E4",
    "h": "F4",
    "u": "F#4",
    "j": "G4",
    "i": "G#4",
    "k": "A4",
    "o": "A#4",
    "l": "B4",
    ";": "C5",
    "[": "C#5",
    "\'": "D5"
}

export const default_function_key_layout: Record<PossibleKeyInput, PossibleFunction> = {
    "ArrowLeft": "func:range_left_full_note",
    "ArrowRight": "func:range_right_full_note",
    "ArrowUp": "func:range_right_octave",
    "ArrowDown": "func:range_left_octave"
}

export const midi_note_to_name = [
    undefined, // array starts with 0.
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    "A0", "A#0", "B0",
    "C1", "C#1", "D1", "D#1", "E1", "F1", "F#1", "G1", "G#1", "A1", "A#1", "B1",
    "C2", "C#2", "D2", "D#2", "E2", "F2", "F#2", "G2", "G#2", "A2", "A#2", "B2",
    "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3",
    "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
    "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5",
    "C6", "C#6", "D6", "D#6", "E6", "F6", "F#6", "G6", "G#6", "A6", "A#6", "B6",
    "C7", "C#7", "D7", "D#7", "E7", "F7", "F#7", "G7", "G#7", "A7", "A#7", "B7",
    "C8"
] as const

export const function_keys = [
    "func:range_left_full_note", "func:range_right_full_note", "func:range_left_octave", "func:range_right_octave"
] as const

type GetReadonlyArrayInnerType<ReadonlyArray extends readonly any[]> = ReadonlyArray[number];

export type PossibleKeyInput = KeyboardEvent["key"]
export type PossibleNoteName = Exclude<GetReadonlyArrayInnerType<typeof midi_note_to_name>, undefined>
export type PossibleFunction = GetReadonlyArrayInnerType<typeof function_keys>
export type ValidInputResult = PossibleNoteName | PossibleFunction

export type CanvasFillColour = CanvasFillStrokeStyles["fillStyle"]
export type CanvasTextFont = CanvasTextDrawingStyles["font"]

export const note_styles: { [style_name in NoteStyle]: NoteStyleConfig } = {
    "common": {
        width: 50,
        background_colour: "#decafe"
    }
}

export type NoteStyle = "common"

export type NoteStyleConfig = Readonly<{
    /** Width in px. */
    width: number
    /** Background of the note (CSS string of colour). */
    background_colour: CanvasFillColour
}>

export const rate_text_styles: { [style_name in RateTextStyle]: RateTextStyleConfig } = {
    "common": {
        missed_colour: "#83959f", bad_colour: "#005243",
        good_colour: "#f5b1aa", great_colour: "#f69e22", perfect_colour: "#ffd900",
        disappear_frame: 45, font: `40px "Consolas", serif`
    }
}

export type RateTextStyle = "common"

type GetRatingTextColour<NoteRating> = {
    [rating in keyof NoteRating as `${string & rating}_colour`]: CanvasFillColour
}

export type RateTextStyleConfig =
    GetRatingTextColour<Omit<typeof NoteRating, "not_rated_yet">>
    & {
        /** Time for the text to disappear (in frames). */
        disappear_frame: number
        /** Text font (CSS string of font). */
        font: CanvasTextFont
    }
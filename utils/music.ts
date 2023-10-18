import { midi_note_to_name } from "./constant_store"

export const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const
export type PossibleKey = typeof keys[number]

export function isValidMidiNoteNum(midi_note_num: number)
{
    return Number.isInteger(midi_note_num) && midi_note_num >= 21 && midi_note_num <= 108
}

export function convertNoteNumToKeyName(midi_note_num: number)
{
    if (!Number.isInteger(midi_note_num)) { throw TypeError(`Note number ${midi_note_num} is not an integer!`) }
    if (midi_note_num < 21 || midi_note_num > 108) { throw RangeError(`Note number ${midi_note_num} out of range.`) }

    // const octave = Math.floor(midi_note_num / 12) - 1
    // const offset = midi_note_num % 12

    // return `${keys[offset]}${octave}`
    return midi_note_to_name[midi_note_num]!
}

export function convertKeyNameToNoteNum(key_name: string)
{
    let key: string
    let octave: number

    switch (key_name.length)
    {
        case 2: key = key_name.slice(0, 1); octave = parseInt(key_name.slice(1, 2)); break
        case 3: key = key_name.slice(0, 2); octave = parseInt(key_name.slice(2, 3)); break
        default: throw TypeError(`This key name "${key_name} is probably not correct."`)
    }

    const offset = keys.indexOf(key as PossibleKey)
    if (offset < 0) { throw TypeError(`Key "${key_name}" does not exist`) }

    const result = 12 * (octave + 1) + offset
    if (result < 21 || result > 108) { throw RangeError(`Result ${result} out of range for key "${key_name}".`) }

    return result
}
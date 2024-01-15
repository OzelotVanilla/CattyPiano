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

export function isSharpKey(midi_note_num: number)
{
    return midi_note_to_name[midi_note_num]?.includes("#")
}

/**
 * Shift a note to fit in the range (can be reversed).
 * 
 * If the given range is too narrow to contain at least one octave, a `RangeError` will be thrown.
 * 
 * Example: given keyboard range from `C3` to `A3`, `C5` will be shifted to `C3`, and `D2` will be `D3`.
 * 
 * @param midi_note_num The note going to be shifted.
 * @param start_num Start of the given range, inclusive.
 * @param end_num End of the given range, inclusive.
 */
export function shiftToRange(midi_note_num: number, start_num: number, end_num: number)
{
    if (!Number.isInteger(midi_note_num)) { throw TypeError(`Note number ${midi_note_num} is not an integer!`) }
    if (midi_note_num < 21 || midi_note_num > 108) { throw RangeError(`Note number ${midi_note_num} out of range.`) }

    // Accept reversed range, just swap them.
    if (start_num > end_num) { const t = start_num; start_num = end_num; end_num = t }

    // If it is too narrow to contain one octave, throw `RangeError`.
    if (end_num - start_num < 11)
    {
        throw RangeError(
            `Range too narrow, from ${convertNoteNumToKeyName(start_num)} (${start_num}) ` +
            `to ${convertNoteNumToKeyName(end_num)} (${end_num}) does not contains an octave.`
        )
    }

    // If the note is just inside the range, just return.
    if (start_num <= midi_note_num && midi_note_num <= end_num) { return midi_note_num }
    else // The note should be shifted into the given range.
    {
        const octave_difference = Math.floor((midi_note_num - start_num) / 12)

        return midi_note_num - 12 * octave_difference
    }
}
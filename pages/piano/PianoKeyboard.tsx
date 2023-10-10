"use client"

import { PossibleKey } from "@/utils/music"


type PianoKeyboard_Props = {
    /**
     * Integer number to control the number of
     * piano keys to show.
     */
    number_of_keys?: number

    /**
     * The generation
     */
    start_from?: PossibleKey
}

export function PianoKeyboard({
    number_of_keys = 12, start_from = "C"
}: PianoKeyboard_Props)
{
    return (<></>)
}

function PianoWhiteKey()
{

}

function PianoBlackKey()
{

}
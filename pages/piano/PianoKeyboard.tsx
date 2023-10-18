import React from 'react';

type PossibleKey = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

type PianoKeyboardProps = {
    number_of_keys?: number;
    start_from?: PossibleKey;
};

type PianoKeyProps = {
    note: PossibleKey;
    octave: number;
    isSharp?: boolean;
    audioSrc?: string;
};

function PianoKey({ note, octave, isSharp = false, audioSrc }: PianoKeyProps)
{
    const handleKeyDown = () =>
    {
        // Play audio if audioSrc is provided
        if (audioSrc)
        {
            const audio = new Audio(audioSrc);
            audio.play();
        }
    };

    return (
        <div
            className={`piano-key ${isSharp ? 'sharp' : 'natural'}`}
            onMouseDown={handleKeyDown}
        >
            {`${note}${octave}`}
        </div>
    );
}

export function PianoKeyboard({
    number_of_keys = 12,
    start_from = "C",
}: PianoKeyboardProps)
{
    const pianoNotes: PossibleKey[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octaveCount = Math.ceil(number_of_keys / pianoNotes.length);

    const renderKeys = () =>
    {
        const keys: JSX.Element[] = [];

        for (let octave = 0; octave < octaveCount; octave++)
        {
            for (const note of pianoNotes)
            {
                const isSharp = note === 'E' || note === 'B'; // Determine if the key is sharp

                keys.push(
                    <PianoKey
                        key={`${note}-${octave}`}
                        note={note}
                        octave={octave}
                        isSharp={isSharp}
                    // audioSrc={/* Add appropriate audio source for the note */}
                    />
                );
            }
        }

        return keys;
    };

    return (
        <div className="piano-keyboard">
            {renderKeys()}
        </div>
    );
}

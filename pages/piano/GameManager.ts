import { SoundManager } from "./SoundManager";
import { default_piano_keyboard_layout } from "./constant_store";

export enum PianoMode
{
    /** Just make the piano looks like a real life piano */
    trival = "trival",
    /** 
     * The keyboard acts in the game, 
     *  while the keyboard range that trigger specific key, is wider.
     */
    in_game = "in_game"
}

export class GameManager
{
    public static piano_mode: PianoMode = PianoMode.trival;

    private static keymapping_setting: Map<PianoMode, Record<string, string>> = new Map([
        [PianoMode.trival, default_piano_keyboard_layout]
    ])

    /**
     * Check the key being pressed,
     *  deciding whether it can trigger a attack of the note on the screen.
     */
    public static getKeyDown(event: KeyboardEvent)
    {
        const keyboard_layout = this.getKeyMapping()!
        const key = event.key
        switch (this.piano_mode)
        {
            case PianoMode.trival: // Do not need to check whether correct
                return this.triggerAttack(keyboard_layout[key] ?? "")
            case PianoMode.in_game:
        }
    }

    public static getKeyUp(event: KeyboardEvent, all_key_released: boolean = false)
    {
        const keyboard_layout = this.getKeyMapping()!
        const key = event.key
        switch (this.piano_mode)
        {
            case PianoMode.trival:
                return this.triggerRelease(keyboard_layout[key] ?? "", all_key_released)
            case PianoMode.in_game:
        }
    }

    /** For a normal piano to get key being pressed. */
    private static triggerAttack(note: string)
    {
        console.log(`triggerAttack "${note}"`)
        if (note.trim().length == 0) { return this; }
        SoundManager.startNote(note)
        return this;
    }

    /** For a normal piano to release a pressed key. */
    private static triggerRelease(note: string, all_key_released: boolean = false)
    {
        console.log(`triggerRelease "${note}"`)
        if (note.trim().length == 0) { return this; }
        SoundManager.releaseNote(note)
        if (all_key_released) { SoundManager.releaseAllNote() }
        return this;
    }

    /** For in game note that only requires a tap. */
    private static triggerGameNoteTap() { }

    /** For in game note that requires long touch, this start the holding. */
    private static triggerGameNoteHoldStart() { }

    /** For in game note that requires long touch, this finish the holding. */
    private static triggerGameNoteHoldFinish() { }

    /** Get the mapping of key */
    public static getKeyMapping()
    {
        return this.keymapping_setting.get(this.piano_mode)
    }
}
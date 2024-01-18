import { getTransport } from "tone";
import { GraphicManager, prepareNotesOffscreen_Param } from "./GraphicManager";
import { SoundManager } from "./SoundManager";
import { PossibleNoteName, default_piano_keyboard_layout, midi_note_to_name } from "@/utils/constant_store";
import { MusicSheet, JSONSheetData, SongJSONData } from "../MusicSheet";
import { isClientEnvironment } from "@/utils/env";
import path from "path";
import { convertToSeconds, jsonfyResponse } from "@/utils/common";
import { SheetNote_Constructor } from "../SheetNote";
import { Time } from "tone/build/esm/core/type/Units";
import { pickOctaveRangedCtoB, shiftNoteToRange } from "@/utils/music";

export enum PianoMode
{
    /** Make the piano a simulator. */
    simulator = "simulator",

    /** 
     * The keyboard acts in the game, 
     *  while the keyboard range that trigger a specific key, is wider.
     */
    in_game = "in_game"
}

export enum GameStatus
{
    /** The game have not start yet. */
    not_start = "not_start",

    /** The game is currently running, BGM should being played. */
    running = "running",

    /** The game is paused, can be resumed. */
    paused = "paused",

    /** The game finishes a round, should show result panel soon. */
    finished = "finished"
}

type PlayingNoteInfo = {
    triggered_at: number
}

export class GameManager
{
    public static piano_mode: PianoMode = PianoMode.simulator

    private static pianokey_mapping_setting: Map<PianoMode, Record<string, string>> = new Map([
        [PianoMode.simulator, default_piano_keyboard_layout],
        [PianoMode.in_game, default_piano_keyboard_layout]
    ])

    private static _game_status: GameStatus = GameStatus.not_start
    public static get game_status() { return this._game_status }
    private static set game_status(value) { this._game_status = value }

    private static game_notes: GameNote[] | null = null

    private static note_playing: Map<string, PlayingNoteInfo> = new Map()

    /**
     * The length of current game's BGM (in seconds).
     */
    private static bgm_length: number

    public static get game_time() { return SoundManager.getBgmPlayerTime() }

    /** 
     * Start the piano's game loop, and do initialisation work.
     * 
     * **Warning**:
     * This function should only be called to **do initialisation**.
     * To resume a paused game, use `GameManager.resumePianoGame` instead.
     */
    public static startPianoGame()
    {
        if (this.game_status != GameStatus.not_start)
        {
            throw TypeError(
                `Could only start game that is not start yet (current status is "${this.game_status}").`
            )
        }

        if (this.game_notes == null) // No available game notes.
        {
            throw ReferenceError(
                `Could not start game that does not have an available game notes.`
            )
        }

        // Set game status to `GameStatus.running`, so the game loop will runs until the game is ended.
        getTransport().context.resume().then(
            () =>
            {
                getTransport().start()
                SoundManager.startBgm()
                this.doGameLoop()
            }
        )
        this.game_status = GameStatus.running
    }

    private static paused_at: number = 0

    /** 
     * Pause a running game.
     * 
     * **Warning**:
     * This function should only be called when the game is **running**.
     * If a game is `not_start` or `finished`, do not call this function.
     */
    public static pausePianoGame()
    {
        if (this.game_status != GameStatus.running)
        {
            throw TypeError(
                `Could only pause game that is running now (current status is "${this.game_status}").`
            )
        }

        const tonejs_transport = getTransport()
        // Set game status to `GameStatus.pause`, so the loop will stop next loop.
        this.game_status = GameStatus.paused
        tonejs_transport.pause()
        this.paused_at = tonejs_transport.seconds
        SoundManager.pauseBgm()
    }

    /** 
     * Resume a paused game.
     * 
     * **Warning**:
     * This function should only be called when the game is paused.
     */
    public static resumePianoGame()
    {
        if (this.game_status != GameStatus.paused)
        {
            throw TypeError(
                `Could only resume game that is paused before (current status is "${this.game_status}").`
            )
        }

        if (this.game_notes == null) // No available game notes.
        {
            throw ReferenceError(
                `Could not resume game that does not have an available game notes.`
            )
        }

        const tonejs_transport = getTransport()
        // Set game status to `GameStatus.running`, so the game loop will runs until the game is ended.
        this.game_status = GameStatus.running
        tonejs_transport.start()
        tonejs_transport.seconds = this.paused_at // Must set `seconds` here to prevent freezing the transport.
        SoundManager.resumeBgm()
        this.doGameLoop()
    }

    private static readonly doGameLoop = this.loopPianoGame.bind(GameManager)

    /** 
     * Main loop for the piano game.
     * 
     * Call `startPianoGame`, `resumePianoGame` or other function instead of directly calling this.
     * Once launched, it could be stopped by setting the `game_status` to `pause` or `not_start`.
     */
    private static loopPianoGame()
    {
        // Check if this loop can run or not.
        if (this.game_status != GameStatus.running) { return }

        // Get current time (relative to the `Tone.Transport` time, NOT `AudioContext` time)
        const current_time = getTransport().seconds

        // Schedule next loop as soon as possible.
        setTimeout(GameManager.doGameLoop)
    }

    /**
     * Check the key being pressed,
     *  deciding whether it can trigger a attack of the note on the screen.
     */
    public static getKeyDown(event: KeyboardEvent)
    {
        const keyboard_layout = this.getPianoKeyMapping()!
        const key = event.key
        switch (this.piano_mode)
        {
            case PianoMode.simulator: // Do not need to check whether correct
                if (keyboard_layout[key] == undefined) { return }

                GraphicManager.preparePianoKeyboardOffscreen({
                    mode: "keypress", key_num: midi_note_to_name.indexOf(keyboard_layout[key] as PossibleNoteName)
                })
                GraphicManager.draw()
                return this.triggerAttack(keyboard_layout[key] ?? "")

            case PianoMode.in_game:
        }
    }

    public static getKeyUp(event: KeyboardEvent, all_key_released: boolean = false)
    {
        const keyboard_layout = this.getPianoKeyMapping()!
        const key = event.key
        switch (this.piano_mode)
        {
            case PianoMode.simulator:
                if (keyboard_layout[key] == undefined) { return }

                GraphicManager.preparePianoKeyboardOffscreen({
                    mode: "keyrelease", key_num: midi_note_to_name.indexOf(keyboard_layout[key] as PossibleNoteName)
                })
                GraphicManager.draw()
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
    public static getPianoKeyMapping(order: "key_to_note" | "note_to_key" = "key_to_note")
    {
        const mapping = this.pianokey_mapping_setting.get(this.piano_mode)
        if (mapping == undefined) { return {} }

        if (order == "key_to_note") { return mapping }
        else if (order == "note_to_key")
        {
            return Object.fromEntries(Object.entries(mapping).map(([k, v]) => [v, k]))
        }
        else { throw TypeError(`Unknown param order ("${order}") for GameManager.getKeyMapping.`) }
    }

    /**
     * Load the song with given URL, and start the game after it is loaded.
     * 
     * @param song_url The URL of a song that contains `song.json`.
     */
    public static loadAndStartPianoGame(song_url: string)
    {
        if (!isClientEnvironment()) { return }

        this.loadSong(song_url)
            .then(this.startPianoGame.bind(GameManager))
    }

    private static async loadSong(
        song_folder_url: string, onFail: (param: { reason: any, song_json_url: string }) => any = console.error
    )
    {
        const song_json_url = path.join(song_folder_url, "song.json")
        const init_game_notes_value: GameNote_SpecialMember_WithDefault = {
            is_triggered: false,
            press_starts_at: 0, press_ends_at: 0
        }
        return await fetch(song_json_url)
            .then(jsonfyResponse)
            .catch(reason => onFail({ reason, song_json_url }))
            .then(
                async (data: SongJSONData) =>
                {
                    data.sheet = data.sheet != undefined
                        ? path.resolve(song_folder_url, data.sheet)
                        : path.join(song_folder_url, "sheet.json")
                    data.bgm = data.bgm != undefined
                        ? path.resolve(song_folder_url, data.bgm)
                        : path.join(song_folder_url, "bgm.mp3")

                    const sheet_json: JSONSheetData = await (fetch(data.sheet).then(jsonfyResponse))
                    const song_sheet = new MusicSheet(sheet_json)
                    getTransport().bpm.value = song_sheet.bpm
                    getTransport().timeSignature = song_sheet.time_signature
                    GameManager.game_notes = song_sheet.notes.map(
                        note => ({
                            ...note, ...init_game_notes_value,
                            time_in_seconds: convertToSeconds(note.time),
                            duration_in_seconds: convertToSeconds(note.duration)
                        })
                    )
                    await SoundManager.loadBgm(data.bgm)
                    this.bgm_length = SoundManager.getBgmLength()
                }
            )
    }


/**
 * The member that only exists in `GameNote`, for which has a default value at init.
 */
type GameNote_SpecialMember_WithDefault = {
    /**
     * Whether a note is already played or missed (in other words, whether playable).
     */
    is_triggered: boolean

    /**
     * The start time (in transport) of pressing to trigger this note.
     * 
     * If this value is *smaller than* 0, that means this note is **missed**.
     */
    press_starts_at: Time

    /**
     * The start time (in transport) of pressing to trigger this note.
     * 
     * If this value is *equal to* 0, that means this note does **not** need **hold** to trigger.
     */
    press_ends_at: Time
}

/**
 * The member that only exists in `GameNote`, for which should be calculated at init.
 */
type GameNote_SpecialMember_ShouldCalc = {
    /**
     * Calculated time of note, in **seconds**.
     */
    time_in_seconds: number

    /**
     * Calculated duration of note, in **seconds**.
     */
    duration_in_seconds: number
}

/** The note that appears in the game. */
export type GameNote = SheetNote_Constructor & GameNote_SpecialMember_WithDefault & GameNote_SpecialMember_ShouldCalc

}
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
import { isSharpKey, pickOctaveRangedCtoB, shiftNoteToRange } from "@/utils/music";

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

    // private static funckey_mapping_setting:Map<PianoMode,Record<string,string>>=new Map([
    //     [PianoMode.trival,]
    // ])

    private static _pianokey_start: number = 57
    public static get pianokey_start() { return this._pianokey_start }

    private static _pianokey_end: number = 74
    public static get pianokey_end() { return this._pianokey_end }

    /**
     * TODO: A static function that accept a pair of keyboard range.
     */
    public static setNewPianoKeyRange(start: number, end: number)
    {
        if (start < 21 || end > 108 || start >= end)
        {
            throw RangeError(`Error start or end`)
        }
        if (isSharpKey(start) || isSharpKey(end))
        {
            throw RangeError(`Cannot start or end on a black key.`)
        }

        let white_key = ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"]
        let black_key = ["", "w", "e", "r", "t", "y", "u", "i", "o", "p", "["]
        let key_count = 0

        let layout: Record<string, string> = {}
        for (let i = start; i <= end; i++)
        {
            if (key_count > white_key.length) { throw RangeError(`Too many Keys`) }

            if (isSharpKey(i)) { layout[black_key[key_count]] = midi_note_to_name[i]! }
            else { layout[white_key[key_count++]] = midi_note_to_name[i]! }
        }

        this.pianokey_mapping_setting.set(PianoMode.simulator, layout)
        this.pianokey_mapping_setting.set(PianoMode.in_game, layout)
    }

    private static _game_status: GameStatus = GameStatus.not_start
    public static get game_status() { return this._game_status }
    private static set game_status(value) { this._game_status = value }

    private static game_notes: GameNote[] | null = null

    private static _note_falling_speed = 140
    /** The falling speed of a note in pixel per second (px/s). */
    public static get note_falling_speed() { return this._note_falling_speed }
    /** Set the falling speed of a note in pixel per second (px/s), should be bigger than 0. */
    public static set note_falling_speed(value)
    {
        if (value <= 0) { throw RangeError(`Cannot set speed that is less or equal to 0 (now setting ${value} as speed).`) }
        this._note_falling_speed = value
    }

    private static _note_miss_time_limit = 0.5
    /** The time limit (in second) for a already-passed note to wait players to trigger. */
    public static get note_miss_time_limit() { return this._note_miss_time_limit }
    /** The time limit (in second) for a already-passed note to wait players to trigger, should be bigger than 0. */
    public static set note_miss_time_limit(value)
    {
        if (value <= 0) { throw RangeError(`Cannot set note miss limit that is less or equal to 0 (now setting ${value} as limit).`) }
        this._note_miss_time_limit = value
    }

    private static _note_late_time_limit = 0.1
    /** The time limit (in second) for a late-trigger note to only get *normal* rating. */
    public static get note_late_time_limit() { return this._note_late_time_limit }

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
        // console.log(`Current time ${current_time}.`)

        // Notes displaying.
        const index_of_first_on_screen_note = this.game_notes!.findIndex(note => (!note.is_triggered))
        if (index_of_first_on_screen_note >= 0) // There are still notes going to be displayed.
        {
            this.drawNoteInsideScreen(current_time, index_of_first_on_screen_note)
        }
        else // No notes should be displayed.
        {
            GraphicManager.eraseDrawNotesArea()

            // Check if also need to cancel the game loop, and show the result.
            if (current_time > this.bgm_length)
            {
                this.calculateGameResult()
                return
            }
        }


        // Schedule next loop as soon as possible.
        setTimeout(GameManager.doGameLoop)
    }

    /**
     * This should be only called by game loop.
     */
    private static drawNoteInsideScreen(current_time: number, index_of_first_on_screen_note: number)
    {
        //  Find the range of notes that could be drawn in this loop.
        const notes = this.game_notes!
        const notes_area_height = GraphicManager.game_area_height - GraphicManager.piano_keyboard_height
        let notes_to_display: prepareNotesOffscreen_Param["notes"] = []
        /** Will be `-1` if not found. */
        const [key_range_start, key_range_end] = pickOctaveRangedCtoB(this.pianokey_start, this.pianokey_end)

        for (let i = index_of_first_on_screen_note; i < notes.length; i++)
        {
            const note = notes[i]
            // Do not display already triggered.
            if (note.is_triggered) { continue }
            // Calculate the distance of this note (from top of keyboard to itself).
            const time_diff = note.time_in_seconds - current_time
            // That means this note is missed. Note that `note_miss_time_limit` is positive.
            if (time_diff < (-this.note_miss_time_limit))
            {
                this.triggerGameNoteMiss(i)
            }
            const distance = time_diff >= 0
                ? time_diff * this.note_falling_speed // Note approaching to be played.
                : 0 // Note going to be missed. Will wait at the piano edge, and removed after time limit.

            if (distance > notes_area_height) // Until this note, all previous notes are able to be displayed.
            {
                break
            }
            else // Add current distance into the array.
            {
                // Shift all note to the octave that starts from `C` to `B`.
                notes_to_display.push({ note: shiftNoteToRange(note, key_range_start, key_range_end), distance })
            }
        }

        // Put notes to the screen and draw the notes
        GraphicManager.prepareNotesOffscreen({ notes: notes_to_display }).drawNotesAreaOnly()
    }

    /**
     * Return the result of a game.
     * 
     * This should be only called by game loop.
     */
    private static async calculateGameResult()
    {
        let note_rating_count = new Map<NoteRating, number>([
            [NoteRating.missed, 0], [NoteRating.normal, 0],
            [NoteRating.good, 0], [NoteRating.great, 0], [NoteRating.perfect, 0]
        ])

        const [miss_limit, late_limit] = [GameManager.note_miss_time_limit, GameManager.note_late_time_limit]

        function increase(note_rating: NoteRating)
        {
            note_rating_count.set(note_rating, (note_rating_count.get(note_rating)!) + 1)
        }

        for (const note of this.game_notes!)
        {
            const {
                press_starts_at: s_time, press_ends_at: e_time,
                time_in_seconds, duration_in_seconds
            } = note
            const [press_starts_at, press_ends_at] = [convertToSeconds(s_time), convertToSeconds(e_time)]

            // If missed
            if (press_starts_at < 0) { increase(NoteRating.missed) }
            else // Not missed
            {
                let diff_percent = 0
                const time_diff = press_starts_at - time_in_seconds
                if (press_ends_at <= 0)  // It is a "tap" note
                {
                    diff_percent = time_diff < late_limit
                        ? Math.abs(press_starts_at - time_in_seconds) / miss_limit
                        : 0.6
                }
                else  // It is a "hold" note
                {
                    const note_end = time_in_seconds + duration_in_seconds
                    const trigger_diff = time_diff < late_limit
                        ? Math.abs(press_starts_at - time_in_seconds)
                        : 0.6
                    const release_diff = press_ends_at > note_end
                        ? 0
                        : Math.abs(press_ends_at - note_end)
                    diff_percent = (trigger_diff + release_diff) / 2 / miss_limit
                }

                // Get rating using the `diff_percent`.
                if (diff_percent > 1) { increase(NoteRating.missed) }
                else if (diff_percent > 0.6) { increase(NoteRating.normal) }
                else if (diff_percent > 0.4) { increase(NoteRating.good) }
                else if (diff_percent > 0.05) { increase(NoteRating.great) }
                else if (diff_percent > 0) { increase(NoteRating.perfect) }
                else { throw RangeError(`Bad \`diff_percent\` calculated: ${diff_percent}.`) }
            }
        }

        // Use rating to generate score.

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
    private static triggerGameNoteTap(note: GameNote)
    {

    }

    /** For in game note that requires long touch, this start the holding. */
    private static triggerGameNoteHoldStart() { }

    /** For in game note that requires long touch, this finish the holding. */
    private static triggerGameNoteHoldFinish() { }

    private static triggerGameNoteMiss(note_index: number)
    {
        const result: Partial<GameNote_SpecialMember_WithDefault> = {
            is_triggered: true,
            press_starts_at: -1
        }

        this.game_notes![note_index] = { ...this.game_notes![note_index], ...result }
    }

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

    /** Get mapping of the functional key */
    public static getFunctionalKeyMapping()
    {

    }
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

enum NoteRating
{
    /** 失 */
    missed = "missed",
    /** 可 */
    normal = "normal",
    /** 良 */
    good = "good",
    /** 優 */
    great = "great",
    /** 極 */
    perfect = "perfect"
}
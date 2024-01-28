import { midi_note_to_name, NoteStyle, note_styles, RateTextStyle, CanvasTextFont, CanvasFillColour, rate_text_styles } from "@/utils/constant_store";
import { isClientEnvironment } from "@/utils/env";
import { isSharpKey } from "@/utils/music";
import { GameManager, GameNote, NoteRating } from "./GameManager";

export class GraphicManager
{
    public static get game_canvas() { return document.getElementById("piano_game") as HTMLCanvasElement }
    public static get game_area_width() { return this.game_canvas.width }
    public static get game_area_height() { return this.game_canvas.height }

    private static canvas_for_piano_keyboard: OffscreenCanvas
    public static get piano_keyboard_height() { return this.canvas_for_piano_keyboard.height }

    private static canvas_for_notes: OffscreenCanvas

    private static keyboard_config = {
        start_num: 57, end_num: 74,
        white_keys_position: [] as number[], black_keys_position: [] as number[],
        white_key_width: 0, white_key_height: 0, black_key_width: 0, black_key_height: 0,
        /** From 0 to 1. */
        piano_keyboard_height_ratio: 0.28,
        white_key_release_bg: "#ffffff", white_key_pressed_bg: "#cccccc", white_key_label_colour: "#000000",
        black_key_release_bg: "#000000", black_key_pressed_bg: "#777777", black_key_label_colour: "#ffffff",
    }

    private static note_style: NoteStyle = "common"

    static {
        if (isClientEnvironment())
        {
        }
    }

    /** This function is only called after the page is load. */
    public static init()
    {
        this.adjustGameCanvasSize()
        this.rating_text_queue = new Set()
        this.key_being_pressed = new Set()
        this.draw()
    }

    /** This function is only called in `GameManager.finalise`. */
    public static finalise()
    {
    }

    /**
     * Caution: Only call this function after the page load finish.
     */
    public static adjustGameCanvasSize()
    {
        const game_canvas_draw = this.game_canvas.getContext("2d")!
        game_canvas_draw.canvas.height = window.innerHeight
        game_canvas_draw.canvas.width = window.innerWidth
        this.canvas_for_piano_keyboard = new OffscreenCanvas(
            window.innerWidth, window.innerHeight * this.keyboard_config.piano_keyboard_height_ratio
        )
        this.canvas_for_notes = new OffscreenCanvas(
            window.innerWidth, window.innerHeight * (1 - this.keyboard_config.piano_keyboard_height_ratio)
        )
        this.preparePianoKeyboardOffscreen({ mode: "redraw" })
    }

    /** This will fetch and draw the image in the offscreen canvas. */
    public static draw()
    {
        this.drawKeyboardOnly()
        this.drawExceptKeyboard()

        return this
    }

    /**
     * Check if there is remaining
     */
    public static isDrawingFinished()
    {
        return this.rating_text_queue.size == 0
    }

    private static rating_text_queue: Set<prepareFadingText_Param> = new Set()

    /** Will be called by the game loop. */
    public static drawExceptKeyboard()
    {
        this.drawNotesAreaOnly()
        this.drawRatingText()

        return this
    }

    public static drawRatingText()
    {
        Array.from(this.rating_text_queue)
            .sort((a, b) => a.alpha - b.alpha)
            .forEach(this.drawFadingText.bind(GraphicManager))

        return this
    }

    public static drawKeyboardOnly()
    {
        const game_canvas = this.game_canvas
        const game_canvas_draw = game_canvas.getContext("2d")!
        const height = game_canvas.height * (1 - this.keyboard_config.piano_keyboard_height_ratio)
        game_canvas_draw.drawImage(this.canvas_for_piano_keyboard, 0, height)

        return this
    }

    public static handleWindowResize()
    {
        console.log(`Get window resize.`)
        this.adjustGameCanvasSize()
        this.preparePianoKeyboardOffscreen({ mode: "redraw" })
        this.draw()
    }

    private static key_being_pressed: Set<number> = new Set<number>()

    /**
     * Only need to call if the keyboard change.
     */
    public static preparePianoKeyboardOffscreen(param: preparePianoKeyboardOffscreen_Param)
    {
        const draw = this.canvas_for_piano_keyboard.getContext("2d")!
        // const draw = this.game_canvas.getContext("2d")! // debug purpose

        const note_name_to_key = GameManager.getPianoKeyMapping("note_to_key")

        const [width, height] = [this.canvas_for_piano_keyboard.width, this.canvas_for_piano_keyboard.height]

        // See if need to update calculated position array for white and black key.
        if (
            param.mode == "layout"
            || this.keyboard_config.white_keys_position.length == 0
        )
        {
            const start_num = param.mode == "layout" ? param.start_num : this.keyboard_config.start_num
            const end_num = param.mode == "layout" ? param.end_num : this.keyboard_config.end_num
            // Need to display a whole keyboard: no sharp key at the edge.
            const [start_key, end_key] = [
                isSharpKey(start_num) ? start_num - 1 : start_num,
                isSharpKey(end_num) ? end_num + 1 : end_num
            ]

            this.keyboard_config.start_num = start_num
            this.keyboard_config.end_num = end_num

            // First get the sequence of keys to draw. If necessary
            // The position is calculated and stored in an array that:
            // * For white keys, no special.
            // * For black keys, index is the position towards its **right** white key.
            const keys_name =
                [...new Array(end_num - start_num + 1)].map((_, n) => midi_note_to_name[n + start_num]) as string[]
            const white_key_count = keys_name.filter(s => (!s.includes("#"))).length
            // console.log(`white_key_count`, white_key_count)
            let [white_keys_position, black_keys_position] =
                [new Array(white_key_count) as number[], new Array(white_key_count) as number[]];
            for (let [current_key, white_key_index] = [start_key, 0]; current_key <= end_key; current_key++)
            {
                if (!isSharpKey(current_key)) { white_keys_position[white_key_index++] = current_key }
                else { black_keys_position[white_key_index] = current_key }
            }
            // console.log("Black key:", black_keys_position)
            // console.log("White key:", white_keys_position)

            this.keyboard_config.white_keys_position = white_keys_position
            this.keyboard_config.black_keys_position = black_keys_position

            this.keyboard_config = {
                ...this.keyboard_config,
                white_keys_position, black_keys_position
            }
        }
        // See if need to calculate the height and width of the keys.
        if (
            param.mode == "redraw"
            || this.keyboard_config.black_key_width <= 0 || this.keyboard_config.white_key_width <= 0
            || this.keyboard_config.white_key_height <= 0 || this.keyboard_config.black_key_height <= 0
        )
        {
            const [white_key_width, white_key_height] =
                [width / this.keyboard_config.white_keys_position.length, height]
            const [black_key_width, black_key_height] =
                [(13.7 / 23.5) * white_key_width, 0.6 * white_key_height]

            this.keyboard_config = {
                ...this.keyboard_config,
                white_key_width, white_key_height, black_key_width, black_key_height
            }
        }

        const { white_key_width, white_key_height, black_key_height, black_key_width } = this.keyboard_config
        const black_key_half_width = black_key_width / 2

        type drawKey_Param = { index: number, label: string, is_pressed?: boolean }

        function drawWhiteKey({ index, label, is_pressed = false }: drawKey_Param)
        {
            // Keyboard itself.
            draw.fillStyle = is_pressed
                ? GraphicManager.keyboard_config.white_key_pressed_bg
                : GraphicManager.keyboard_config.white_key_release_bg
            draw.fillRect(
                index * white_key_width, 0,
                white_key_width, white_key_height
            )
            draw.strokeRect( // Border for the white key.
                index * white_key_width, 0,
                white_key_width, white_key_height
            )

            // Label.
            if (label.length == 0) { return }
            draw.fillStyle = GraphicManager.keyboard_config.white_key_label_colour
            draw.fillText(
                label,
                (index + 0.5) * white_key_width, white_key_height - 50,
                white_key_width // max width
            )
        }

        function drawBlackKey({ index, label, is_pressed = false }: drawKey_Param)
        {
            const key_center_position = index * white_key_width
            // Draw left-half and right-half.
            draw.fillStyle = is_pressed
                ? GraphicManager.keyboard_config.black_key_pressed_bg
                : GraphicManager.keyboard_config.black_key_release_bg
            draw.fillRect(
                key_center_position - black_key_half_width, 0,
                black_key_half_width * 2, black_key_height
            )

            // Label.
            if (label.length == 0) { return }
            draw.fillStyle = GraphicManager.keyboard_config.black_key_label_colour
            draw.fillText(
                label,
                key_center_position, black_key_height - 50,
                black_key_half_width * 2 // max width
            )
        }

        if (param.mode == "layout" || param.mode == "redraw")
        {
            // console.log("param: ", param)

            // draw.fillStyle = "#decafe" // Debug purpose, to detect the size of piano.
            draw.fillStyle = "#ffffff"
            draw.clearRect(0, 0, width, height) // Clear the screen

            // Then use the array to draw the piano
            const [white_key_position, black_key_position] =
                [this.keyboard_config.white_keys_position, this.keyboard_config.black_keys_position]
            // console.log("white_key_position:\n", white_key_position)
            // console.log("mapping_from_note_name:\n", mapping_from_note_name)

            // First, draw the white keys.
            draw.strokeStyle = "#000000"
            draw.textAlign = "center"
            draw.font = `40px "Consolas", serif`
            // console.log(`width: ${white_key_width}, height: ${height}`)
            for (let white_key_index = 0; white_key_index < white_key_position.length; white_key_index++)
            {
                drawWhiteKey({
                    index: white_key_index,
                    label: note_name_to_key[midi_note_to_name[white_key_position[white_key_index]]!]
                })
            }

            // Then, draw the black key.
            for (let black_key_index = 0; black_key_index < black_key_position.length; black_key_index++)
            {
                const note_num = black_key_position[black_key_index]
                if (note_num == undefined) { continue }

                drawBlackKey({
                    index: black_key_index,
                    label: note_name_to_key[midi_note_to_name[black_key_position[black_key_index]]!]
                })
            }
        }
        else if (param.mode == "keypress" || param.mode == "keyrelease")
        {
            param.mode == "keypress"
                ? this.key_being_pressed.add(param.key_num)
                : this.key_being_pressed.delete(param.key_num)

            const [white_keys_position, black_keys_position] =
                [this.keyboard_config.white_keys_position, this.keyboard_config.black_keys_position]

            const [key_to_draw, key_is_sharp] = [param.key_num, isSharpKey(param.key_num)]
            const key_position = (key_is_sharp ? black_keys_position : white_keys_position).indexOf(key_to_draw)

            // Draw key.
            draw.textAlign = "center"
            draw.font = `40px "Consolas", serif`
            if (key_is_sharp) // Draw black key will affect no keys.
            {
                drawBlackKey({
                    index: key_position,
                    label: note_name_to_key[midi_note_to_name[key_to_draw]!],
                    is_pressed: param.mode == "keypress"
                })
            }
            else // There is one or two black key being affected by redrawing white key.
            {
                drawWhiteKey({
                    index: key_position,
                    label: note_name_to_key[midi_note_to_name[key_to_draw]!],
                    is_pressed: param.mode == "keypress"
                })

                // Affected left key (if exists)
                if (isSharpKey(key_to_draw - 1) && key_to_draw - 1 > this.keyboard_config.start_num)
                {
                    drawBlackKey({
                        index: key_position,
                        label: note_name_to_key[midi_note_to_name[key_to_draw - 1]!],
                        is_pressed: this.key_being_pressed.has(key_to_draw - 1)
                    })
                }

                // Affected right key (if exists)
                if (isSharpKey(key_to_draw + 1) && key_to_draw + 1 < this.keyboard_config.end_num)
                {
                    drawBlackKey({
                        index: key_position + 1,
                        label: note_name_to_key[midi_note_to_name[key_to_draw + 1]!],
                        is_pressed: this.key_being_pressed.has(key_to_draw + 1)
                    })
                }
            }
        }
        else
        {
            throw TypeError(`Unsupported mode for drawPianoKeyboard: "${param.mode}".`)
        }

        // Restore after job
        draw.fillStyle = "#ffffff"
        draw.textAlign = "left"

        return this
    }

    public static drawNotesAreaOnly()
    {
        const game_canvas_draw = this.game_canvas.getContext("2d")!
        const [width, height] = [this.canvas_for_notes.width, this.canvas_for_notes.height]
        game_canvas_draw.clearRect(0, 0, width, height) // Clear the screen
        game_canvas_draw.drawImage(this.canvas_for_notes, 0, 0)

        return this
    }

    /**
     * Erase the notes area offscreen canvas, and then draw it.
     */
    public static eraseDrawNotesArea()
    {
        const note_draw = this.canvas_for_notes.getContext("2d")!
        const game_canvas_draw = this.game_canvas.getContext("2d")!
        const [width, height] = [this.canvas_for_notes.width, this.canvas_for_notes.height]
        note_draw.clearRect(0, 0, width, height) // Clear the offscreen canvas.
        game_canvas_draw.clearRect(0, 0, width, height) // Clear the screen.

        return this
    }

    /**
     * The buffer of the note that is going to be drawn.
     */
    public static prepareNotesOffscreen(param: prepareNotesOffscreen_Param)
    {
        const draw = this.canvas_for_notes.getContext("2d")!
        const [width, height] = [this.canvas_for_notes.width, this.canvas_for_notes.height]

        draw.clearRect(0, 0, width, height) // Clear the screen

        // Debug purpose
        // draw.fillStyle = "#eae5e3"
        // draw.fillRect(0, 0, width, height)

        // console.log(param.notes.map(e => `${e.note.midi_num}:${e.note.time}:${e.distance}`))
        const note_style = note_styles[this.note_style]
        draw.fillStyle = note_style.background_colour
        const note_width = note_style.width
        const note_half_width = note_width / 2
        for (const note_and_distance of param.notes)
        {
            const { note, distance } = note_and_distance

            // If this note is already assigned with a key to press.
            if (note.key_to_trigger != undefined)
            {

            }
            else
            {
                const midi_num = note_and_distance.note.midi_num
                /** The center of the note rectangle that is going to be drawn. */
                const x_axis_offset = this.getMiddlePointXOffsetOfKey(midi_num)

                // Draw the note.
                draw.fillRect(
                    x_axis_offset - note_half_width, height - distance,
                    note_width, -20
                )
            }

            // Debug purpose
            // this.drawNotesAreaOnly()
        }

        return this
    }

    public static getMiddlePointXOffsetOfKey(midi_num: number)
    {
        const key_offset = isSharpKey(midi_num)
            ? this.keyboard_config.black_keys_position.indexOf(midi_num)
            : this.keyboard_config.white_keys_position.indexOf(midi_num)

        if (key_offset < 0) { throw RangeError(`Midi Number ${midi_num} does not exist in the keyboard range.`) }

        return (isSharpKey(midi_num)
            ? 0
            : this.keyboard_config.white_key_width / 2
        ) + this.keyboard_config.white_key_width * key_offset;
    }

    public static prepareRateTextAboveKey(note: GameNote, rate_text_style: RateTextStyle = "common")
    {
        const style = rate_text_styles[rate_text_style]
        let colour: CanvasFillColour
        switch (note.rating)
        {
            case NoteRating.missed:
                colour = style.missed_colour
                break
            case NoteRating.bad:
                colour = style.bad_colour
                break
            case NoteRating.good:
                colour = style.good_colour
                break
            case NoteRating.great:
                colour = style.great_colour
                break
            case NoteRating.perfect:
                colour = style.perfect_colour
                break
            case NoteRating.not_rated_yet:
                throw RangeError()
        }

        this.rating_text_queue.add(
            {
                midi_num: note.midi_num,
                text: note.rating.toUpperCase(),
                alpha: 1,
                font: style.font,
                colour: colour,
                x: this.getMiddlePointXOffsetOfKey(note.midi_num),
                y: this.game_canvas.height - this.piano_keyboard_height - 50,
                fade_out_in_frame: style.disappear_frame
            }
        )

        // Create new offscreen canvas for the rating text.
    }

    private static drawFadingText(param: prepareFadingText_Param)
    {
        let offscreen_canvas = new OffscreenCanvas(
            window.innerWidth, window.innerHeight * (1 - this.keyboard_config.piano_keyboard_height_ratio)
        )

        const draw = offscreen_canvas.getContext("2d")!
        // Set config to draw.
        draw.font = param.font
        draw.fillStyle = param.colour
        draw.textAlign = "center"
        draw.globalAlpha = param.alpha
        // Draw the text.
        draw.fillText(param.text, param.x, param.y)

        this.game_canvas.getContext("2d")!.drawImage(offscreen_canvas, 0, 0)

        let new_alpha = param.alpha - (1 / param.fade_out_in_frame)
        if (new_alpha > 0)
        {
            param.alpha = new_alpha
        }
        else
        {
            this.rating_text_queue.delete(param)
        }
    }
}

type preparePianoKeyboardOffscreen_Param = {
    /** The layout (affected by number of keys) going to be inited or has changed. */
    mode: "layout"
    start_num: number
    end_num: number
} | {
    /** The layout does not change, only key press state changed */
    mode: "keypress" | "keyrelease"
    key_num: number
} | {
    /** The layout does not change, only width or height of canvas changed */
    mode: "redraw"
}

export type prepareNotesOffscreen_Param = {
    /** The notes going to be put on the offscreen. */
    notes: ({
        /** The game note itself. */
        note: GameNote
        /** The distance between the note and the top edge of the piano keyboard. */
        distance: number
    })[]
}

type prepareFadingText_Param = {
    midi_num: number
    text: string
    alpha: number
    font: CanvasTextFont
    colour: CanvasFillColour
    /** Center point of text on x-axis. */
    x: number
    y: number
    /** The time (in frames) for a text to totally fadeout. */
    fade_out_in_frame: number
}
import { midi_note_to_name } from "@/utils/constant_store";
import { isClientEnvironment } from "@/utils/env";
import { isSharpKey } from "@/utils/music";
import { GameManager } from "./GameManager";

export class GraphicManager
{
    public static get game_canvas() { return document.getElementById("piano_game") as HTMLCanvasElement }
    public static get game_area_width() { return this.game_canvas.width }
    public static get game_area_height() { return this.game_canvas.height }

    private static canvas_for_piano_keyboard: OffscreenCanvas;

    private static keyboard_config = {
        start_num: 57, end_num: 74,
        white_key_position: [] as number[], black_key_position: [] as number[],
        piano_keyboard_height_ratio: 0.28
    }

    static {
        if (isClientEnvironment())
        {
            this.canvas_for_piano_keyboard = new OffscreenCanvas(
                this.game_area_width, this.game_area_height * this.keyboard_config.piano_keyboard_height_ratio
            )
        }
    }

    public static adjustGameCanvasSize()
    {
        const game_canvas_draw = this.game_canvas.getContext("2d")!
        game_canvas_draw.canvas.height = window.innerHeight
        game_canvas_draw.canvas.width = window.innerWidth
        this.canvas_for_piano_keyboard = new OffscreenCanvas(
            window.innerWidth, window.innerHeight * this.keyboard_config.piano_keyboard_height_ratio
        )
    }

    public static draw()
    {
        const game_canvas = this.game_canvas
        const game_canvas_draw = game_canvas.getContext("2d")!
        const width = game_canvas.width
        const height = game_canvas.height

        // Draw piano keyboard
        {
            const dest_height = height * (1 - this.keyboard_config.piano_keyboard_height_ratio)
            game_canvas_draw?.drawImage(this.canvas_for_piano_keyboard, 0, dest_height)
        }
    }

    public static handleWindowResize()
    {
        console.log(`Get window resize.`)
        this.adjustGameCanvasSize()
        this.drawPianoKeyboardOffscreen({ mode: "redraw" })
        this.draw()
    }

    private static key_being_pressed = new Set<number>()

    /**
     * Only need to call if the keyboard change.
     */
    public static drawPianoKeyboardOffscreen(param: drawPianoKeyboard_Param)
    {
        const draw = this.canvas_for_piano_keyboard.getContext("2d")!
        // const draw = this.game_canvas.getContext("2d")! // debug purpose

        if (param.mode == "layout" || param.mode == "redraw")
        {
            const start_num = param.mode == "layout" ? param.start_num : this.keyboard_config.start_num
            const end_num = param.mode == "layout" ? param.end_num : this.keyboard_config.end_num

            // console.log("param: ", param)

            // Need to display a whole keyboard: no sharp key at the edge.
            const [start_key, end_key] = [
                isSharpKey(start_num) ? start_num - 1 : start_num,
                isSharpKey(end_num) ? end_num + 1 : end_num
            ]
            const [width, height] = [this.canvas_for_piano_keyboard.width, this.canvas_for_piano_keyboard.height]
            // draw.fillStyle = "#decafe" // Debug purpose, to detect the size of piano.
            draw.fillStyle = "#ffffff"
            draw.clearRect(0, 0, width, height) // Clear the screen

            // See if need to update calculated position array for white and black key
            if (
                param.mode == "layout"
                || this.keyboard_config.white_key_position.length == 0
            )
            {
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

                this.keyboard_config.white_key_position = white_keys_position
                this.keyboard_config.black_key_position = black_keys_position
            }

            // Then use the array to draw the piano
            const [white_key_width, white_key_height] =
                [width / this.keyboard_config.white_key_position.length, height]
            const [white_key_position, black_key_position] =
                [this.keyboard_config.white_key_position, this.keyboard_config.black_key_position]
            console.log("white_key_position:\n", white_key_position)
            const mapping_from_note_name = GameManager.getKeyMapping("note_to_key")
            // console.log("mapping_from_note_name:\n", mapping_from_note_name)

            // First, draw the white keys.
            draw.strokeStyle = "#000000"
            draw.textAlign = "center"
            draw.font = `40px "Consolas", serif`
            // console.log(`width: ${white_key_width}, height: ${height}`)
            for (let white_key_index = 0; white_key_index < white_key_position.length; white_key_index++)
            {
                // Keyboard itself.
                draw.fillStyle = "#ffffff"
                draw.strokeRect(
                    white_key_index * white_key_width, 0,
                    white_key_width, white_key_height
                )

                // Label.
                draw.fillStyle = "#000000"
                draw.fillText(
                    mapping_from_note_name[midi_note_to_name[white_key_position[white_key_index]]!],
                    (white_key_index + 0.5) * white_key_width, white_key_height - 50,
                    white_key_width // max width
                )
            }

            // Then, draw the black key.
            const [black_key_half_width, black_key_height] = [(13.7 / 23.5) * white_key_width / 2, 0.6 * white_key_height]
            for (let black_key_index = 0; black_key_index < black_key_position.length; black_key_index++)
            {
                const note_num = black_key_position[black_key_index]
                if (note_num == undefined) { continue }

                const key_center_position = black_key_index * white_key_width
                // Draw left-half and right-half.
                draw.fillStyle = "#000000"
                draw.fillRect(
                    key_center_position - black_key_half_width, 0,
                    black_key_half_width * 2, black_key_height
                )

                // Label.
                draw.fillStyle = "#ffffff"
                draw.fillText(
                    mapping_from_note_name[midi_note_to_name[black_key_position[black_key_index]]!],
                    key_center_position, black_key_height - 50
                )
            }
        }
        else if (param.mode == "keypress" || param.mode == "keyrelease")
        {
            param.mode == "keypress"
                ? this.key_being_pressed.add(param.key_num)
                : this.key_being_pressed.delete(param.key_num)
        }
        else
        {
            throw TypeError(`Unsupported mode for drawPianoKeyboard: ${param.mode}`)
        }

        // Restore after job
        draw.fillStyle = "#ffffff"
        draw.textAlign = "left"
    }
}

type drawPianoKeyboard_Param = {
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
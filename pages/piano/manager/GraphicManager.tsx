export class GraphicManager
{
    private static canvas_for_piano_keyboard = document.createElement("canvas").getContext("2d")
    public static get game_canvas() { return document.getElementById("piano_game") as HTMLCanvasElement }
    public static get game_area_width() { return this.game_canvas.width }
    public static get game_area_height() { return this.game_canvas.height }

    public static handleWindowResize() { }

    public static drawPianoKeyboard()
    {
        const game_canvas = this.game_canvas
        const width = game_canvas.width
        const height = game_canvas.height

    }
}
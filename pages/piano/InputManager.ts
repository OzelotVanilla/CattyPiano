import { GameManager } from "./GameManager"

/**
 * This input manager treats keyboard event or other input devices as input event,
 * and make sure no repeated event is delivered to the `GameManager`.
 */
export class InputManager
{
    private static key_currently_pressed = new Set<KeyString>()

    static {

    }

    public static processKeyDownEvent(event: KeyboardEvent)
    {
        // console.log("key_currently_pressed:", this.key_currently_pressed)
        const event_key = event.key
        if (event.repeat || this.key_currently_pressed.has(event_key)) { return } // Ignore repeating key
        this.addKeyBeingPressed(event_key)

        GameManager.getKeyDown(event)
        // console.log(`get key down event:`, event)
    }

    public static processKeyUpEvent(event: KeyboardEvent)
    {
        const event_key = event.key
        // console.log("key_currently_pressed:", this.key_currently_pressed)
        if (event.repeat || (!this.key_currently_pressed.has(event_key))) { return } // Ignore repeating result
        this.deleteKeyBeingPressed(event_key)

        GameManager.getKeyUp(event)
        // console.log(`get key up event:`, event)
    }

    private static addKeyBeingPressed(key_name: string)
    {
        // Ignore "Alt" key because it might be fired by `Alt + Tab`
        this.key_currently_pressed.add(key_name)
        if (this.key_currently_pressed.has("Alt") && this.key_currently_pressed.has("Tab"))
        {
            this.key_currently_pressed.delete("Alt")
        }
    }

    private static deleteKeyBeingPressed(key_name: string)
    {
        this.key_currently_pressed.delete(key_name)
    }
}

type KeyString = string
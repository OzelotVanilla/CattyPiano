"use client"

import "./piano.scss";
import { convertKeyNameToNoteNum, convertNoteNumToKeyName, keys } from "@/utils/music";
import { Button, Typography } from "antd";
const { Text } = Typography
import { useEffect, useState } from "react";
import { SoundManager } from "./manager/SoundManager";
import { InputManager } from "./manager/InputManager";
import { GameManager } from "./manager/GameManager";
import { GraphicManager } from "./manager/GraphicManager";


export default function PianoPage()
{
    // Load the static code inside
    GameManager; // Controls game mode or some other high level things like the key hit.
    SoundManager; // Play the game sound.
    InputManager; // Accept raw input, and trigger corresponding action.

    // Record user settings about the keyboard
    let [keyboard_start, setKeyboardStart] = useState(57)
    let [keyboard_end, setKeyboardEnd] = useState(74)

    // Any key stroke will be passed to the Input Manager.
    useEffect(() => 
    {
        // Should bind `this` because this is JavaScript.
        document.addEventListener("keydown", InputManager.processKeyDownEvent.bind(InputManager), true)
        document.addEventListener("keyup", InputManager.processKeyUpEvent.bind(InputManager), true)
        window.addEventListener("resize", GraphicManager.handleWindowResize.bind(GraphicManager))

        // Destructor
        return () =>
        {
            document.removeEventListener("keydown", InputManager.processKeyDownEvent.bind(InputManager))
            document.removeEventListener("keyup", InputManager.processKeyUpEvent.bind(InputManager))
            window.removeEventListener("resize", GraphicManager.handleWindowResize.bind(GraphicManager))
        }
    }, [])

    // If the layout of piano should change:
    useEffect(() =>
    {
        GraphicManager.adjustGameCanvasSize()
        GraphicManager.drawPianoKeyboardOffscreen({ mode: "layout", start_num: keyboard_start, end_num: keyboard_end })
        GraphicManager.draw()
    }, [keyboard_start, keyboard_end])

    return (<>
        {/* <div id="KeyboardArea">{Object.entries(GameManager.getKeyMapping() ?? {}).map(
            ([key, note_name]) => (<Text key={key} style={{ marginRight: "min(1.5vw, 15px)" }}>
                <Text keyboard>{key}</Text>{`: ${note_name}`}
            </Text>)
        )}</div> */}
        <canvas id="piano_game"></canvas>
    </>)
}
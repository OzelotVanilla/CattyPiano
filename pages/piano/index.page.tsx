"use client"

import "./piano.scss";
import { convertKeyNameToNoteNum, convertNoteNumToKeyName, keys } from "@/utils/music";
import { Button, Typography } from "antd";
const { Text } = Typography
import { useCallback, useEffect, useState } from "react";
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

    const handleKeydown = useCallback(InputManager.processKeyDownEvent.bind(InputManager), [])
    const handleKeyup = useCallback(InputManager.processKeyUpEvent.bind(InputManager), [])
    const handleResize = useCallback(GraphicManager.handleWindowResize.bind(GraphicManager), [])

    // Record user settings about the keyboard
    let [keyboard_start, setKeyboardStart] = useState(57)
    let [keyboard_end, setKeyboardEnd] = useState(74)

    // Any key stroke will be passed to the Input Manager.
    useEffect(() => 
    {
        // Should bind `this` because this is JavaScript.
        document.addEventListener("keydown", handleKeydown, true)
        document.addEventListener("keyup", handleKeyup, true)
        window.addEventListener("resize", handleResize)

        // Destructor
        return () =>
        {
            document.removeEventListener("keydown", handleKeydown)
            document.removeEventListener("keyup", handleKeyup)
            window.removeEventListener("resize", handleResize)
        }
    }, [])

    // If the layout of piano should change:
    useEffect(() =>
    {
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
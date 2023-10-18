"use client"

import { convertKeyNameToNoteNum, convertNoteNumToKeyName, keys } from "@/utils/music";
import { Button } from "antd";
import { useEffect, useState } from "react";
import { PianoKeyboard } from "./PianoKeyboard";
import { SoundManager } from "./SoundManager";
import { InputManager } from "./InputManager";
import { GameManager } from "./GameManager";


export default function PianoPage()
{
    // Load the static code inside
    GameManager; // Controls game mode or some other high level things like the key hit.
    SoundManager; // Play the game sound.
    InputManager; // Accept raw input, and trigger corresponding action.

    // Any key stroke will be passed to the Input Manager.
    useEffect(() => 
    {
        // Should bind `this` because this is JavaScript.
        document.addEventListener("keydown", InputManager.processKeyDownEvent.bind(InputManager), true)
        document.addEventListener("keyup", InputManager.processKeyUpEvent.bind(InputManager), true)

        // Destructor
        return () =>
        {
            document.removeEventListener("keydown", (e) => InputManager.processKeyDownEvent(e))
            document.removeEventListener("keyup", (e) => InputManager.processKeyUpEvent(e))
        }
    }, [])

    return (<>
        <div id="KeyboardArea"><PianoKeyboard /></div>
    </>)
}
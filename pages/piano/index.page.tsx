"use client"

import "./piano.scss";
import { convertKeyNameToNoteNum, convertNoteNumToKeyName, keys } from "@/utils/music";
import { Button, FloatButton, Modal, Space, Typography } from "antd";
const { Text } = Typography
import { useCallback, useEffect, useState } from "react";
import { SoundManager } from "./manager/SoundManager";
import { InputManager } from "./manager/InputManager";
import { GameManager } from "./manager/GameManager";
import { GraphicManager } from "./manager/GraphicManager";
import { SettingOutlined } from "@ant-design/icons";
import { useI18N } from "@/i18n/i18n";

enum ScreenMode { normal, curve_screen }

const left_screen_ratio = new Map<ScreenMode, number>([
    [ScreenMode.normal, 0], [ScreenMode.curve_screen, 30]
])

export default function PianoPage()
{
    // Load the static code inside
    GameManager; // Controls game mode or some other high level things like the key hit.
    SoundManager; // Play the game sound.
    InputManager; // Accept raw input, and trigger corresponding action.

    const handleKeydown = useCallback(InputManager.processKeyDownEvent.bind(InputManager), [])
    const handleKeyup = useCallback(InputManager.processKeyUpEvent.bind(InputManager), [])
    const handleResize = useCallback(GraphicManager.handleWindowResize.bind(GraphicManager), [])

    const { text } = useI18N()

    // Record user settings about the keyboard
    let [keyboard_start, setKeyboardStart] = useState(57)
    let [keyboard_end, setKeyboardEnd] = useState(74)
    // The UI settings
    let [screen_mode, setScreenMode] = useState(ScreenMode.normal)
    let [is_setting_open, setSettingOpen] = useState(false)

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

    const screen_left_part_width_ratio = left_screen_ratio.get(screen_mode) ?? 0
    const screen_right_part_width_ratio = 100 - screen_left_part_width_ratio

    return (<div id="game_panel">
        <div id="screen_left_part" style={{ width: `${screen_left_part_width_ratio}%` }}></div>
        <div id="screen_right_part" style={{ width: `${screen_right_part_width_ratio}%` }}>
            <canvas id="piano_game"></canvas>
        </div>
        <Modal open={is_setting_open} onOk={_ => setSettingOpen(false)}>
            <Space>
                <Text>{text.piano.screen_mode}</Text>
                <Button
                    type={screen_mode == ScreenMode.normal ? "primary" : "default"}
                    onClick={_ => setScreenMode(ScreenMode.normal)}>
                    {text.piano.full_screen_mode}
                </Button>
                <Button
                    type={screen_mode == ScreenMode.curve_screen ? "primary" : "default"}
                    onClick={_ => setScreenMode(ScreenMode.curve_screen)}>
                    {text.piano.curve_screen_mode}
                </Button>
            </Space>
        </Modal>
        <FloatButton className="SettingButton" icon={<SettingOutlined />} onClick={_ => setSettingOpen(true)} />
    </div>)
}
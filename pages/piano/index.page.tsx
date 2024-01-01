"use client"

import "./piano.scss";
import { convertKeyNameToNoteNum, convertNoteNumToKeyName, keys } from "@/utils/music";
import { Button, FloatButton, Modal, Space, Typography } from "antd";
const { Text } = Typography
import { useCallback, useEffect, useRef, useState } from "react";
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

const default_piano_setting: PianoSetting = {
    screen_mode: ScreenMode.normal
}

export default function PianoPage()
{
    const handleKeydown = useCallback(InputManager.processKeyDownEvent.bind(InputManager), [])
    const handleKeyup = useCallback(InputManager.processKeyUpEvent.bind(InputManager), [])
    const handleResize = useCallback(GraphicManager.handleWindowResize.bind(GraphicManager), [])

    const { text } = useI18N()

    // Record user settings about the keyboard
    let [keyboard_start, setKeyboardStart] = useState(57)
    let [keyboard_end, setKeyboardEnd] = useState(74)
    // The UI settings
    let [is_setting_open, setSettingOpen] = useState(false)
    let [piano_setting, setPianoSetting] = useState(default_piano_setting)

    // On mount. Any key stroke will be passed to the Input Manager.
    useEffect(() => 
    {
        // Load the static code inside
        GameManager; // Controls game mode or some other high level things like the key hit.
        SoundManager; // Play the game sound.
        InputManager; // Accept raw input, and trigger corresponding action.

        // Should bind `this` because this is JavaScript.
        document.addEventListener("keydown", handleKeydown, true)
        document.addEventListener("keyup", handleKeyup, true)
        window.addEventListener("resize", handleResize)
        GraphicManager.adjustGameCanvasSize()

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

    const screen_left_part_width_ratio = left_screen_ratio.get(piano_setting.screen_mode) ?? 0
    const screen_right_part_width_ratio = 100 - screen_left_part_width_ratio

    return (<div id="game_panel">
        <div id="screen_left_part" style={{ width: `${screen_left_part_width_ratio}%` }}></div>
        <div id="screen_right_part" style={{ width: `${screen_right_part_width_ratio}%` }}>
            <canvas id="piano_game"></canvas>
        </div>
        <PianoSettingModal
            piano_setting={piano_setting} setPianoSetting={setPianoSetting}
            is_setting_open={is_setting_open} setSettingOpen={setSettingOpen} />
        <FloatButton className="SettingButton" icon={<SettingOutlined />} onClick={_ => setSettingOpen(true)} />
    </div>)
}

function PianoSettingModal({
    piano_setting, setPianoSetting, is_setting_open, setSettingOpen
}: PianoSettingModal_Prop)
{
    const { text } = useI18N()
    const old_setting = useRef(piano_setting)

    function onOk()
    {
        setSettingOpen(false)
    }

    function onCancel()
    {
        setPianoSetting(old_setting.current)
        setSettingOpen(false)
    }

    return (<Modal open={is_setting_open} onOk={onOk} onCancel={onCancel}>
        <Space>
            <Text>{text.piano.screen_mode}</Text>
            <Button
                type={piano_setting.screen_mode == ScreenMode.normal ? "primary" : "default"}
                onClick={_ => setPianoSetting({ ...piano_setting, screen_mode: ScreenMode.normal })}>
                {text.piano.full_screen_mode}
            </Button>
            <Button
                type={piano_setting.screen_mode == ScreenMode.curve_screen ? "primary" : "default"}
                onClick={_ => setPianoSetting({ ...piano_setting, screen_mode: ScreenMode.curve_screen })}>
                {text.piano.curve_screen_mode}
            </Button>
        </Space>
    </Modal>)
}

type PianoSettingModal_Prop = {
    piano_setting: PianoSetting
    setPianoSetting: (v: PianoSetting) => any
    is_setting_open: boolean
    setSettingOpen: (v: boolean) => any
}

type PianoSetting = {
    screen_mode: ScreenMode
}
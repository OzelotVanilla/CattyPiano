"use client"

import "./piano.scss";
import { Button, FloatButton, List, Modal, Space, Typography, notification } from "antd";
const { Text, Title } = Typography
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { SoundManager } from "@/game/manager/SoundManager";
import { InputManager } from "@/game/manager/InputManager";
import { GameManager, PianoMode } from "@/game/manager/GameManager";
import { GraphicManager } from "@/game/manager/GraphicManager";
import { ReloadOutlined, SettingOutlined } from "@ant-design/icons";
import { useI18N } from "@/i18n/i18n";
import path from "path";

import game_sheet_info from "@/public/game_sheet/info.json"
import { jsonfyResponse } from "@/utils/common";
import { isClientEnvironment } from "@/utils/env";
import { SongJSONData } from "@/game/MusicSheet";

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

    // Record user settings about the keyboard
    let [keyboard_start, setKeyboardStart] = useState(57) // 57
    let [keyboard_end, setKeyboardEnd] = useState(74) // 74

    let [piano_mode, setPianoMode] = useState(GameManager.piano_mode)

    // The UI and game settings
    let [is_setting_open, setSettingOpen] = useState(false)
    let [is_song_select_open, setSongSelectOpen] = useState(false)
    let [piano_setting, setPianoSetting] = useState(default_piano_setting)
    let [song_playing, setSongPlaying] = useState<SongData | null>(null)

    // On mount. Any key stroke will be passed to the Input Manager.
    useEffect(() => 
    {
        // Load the static code inside
        GameManager;  // Controls game mode or some other high level things like the key hit.
        SoundManager; // Play the game sound.
        InputManager; // Accept raw input, and trigger corresponding action.

        // Should bind `this` because this is JavaScript.
        window.addEventListener("keydown", handleKeydown)
        window.addEventListener("keyup", handleKeyup)
        window.addEventListener("resize", handleResize)
        GraphicManager.adjustGameCanvasSize()

        // Destructor
        return () =>
        {
            window.removeEventListener("keydown", handleKeydown)
            window.removeEventListener("keyup", handleKeyup)
            window.removeEventListener("resize", handleResize)
        }
    }, [])

    // If the layout of piano should change:
    useEffect(() =>
    {
        GameManager.setNewPianoKeyRange(keyboard_start, keyboard_end)
        GraphicManager.preparePianoKeyboardOffscreen({ mode: "layout", start_num: keyboard_start, end_num: keyboard_end })
        GraphicManager.draw()
    }, [keyboard_start, keyboard_end])

    const screen_left_part_width_ratio = left_screen_ratio.get(piano_setting.screen_mode) ?? 0
    const screen_right_part_width_ratio = 100 - screen_left_part_width_ratio

    return (<div id="game_panel">
        <div id="screen_left_part" style={{ width: `${screen_left_part_width_ratio}%` }}></div>
        <div id="screen_right_part" style={{ width: `${screen_right_part_width_ratio}%` }}>
            <canvas id="piano_game"></canvas>
        </div>
        <SelectSimOrGameMode
            piano_mode={piano_mode} setPianoMode={setPianoMode}
            song_playing={song_playing} setSongSelectOpen={setSongSelectOpen} />
        <SongSelectModal
            is_song_select_open={is_song_select_open} setSongSelectOpen={setSongSelectOpen}
            song_playing={song_playing} setSongPlaying={setSongPlaying} />
        <PianoSettingModal
            piano_setting={piano_setting} setPianoSetting={setPianoSetting}
            is_setting_open={is_setting_open} setSettingOpen={setSettingOpen} />
        <FloatButton className="SettingButton" icon={<SettingOutlined />} onClick={_ => setSettingOpen(true)} />
    </div>)
}

function SelectSimOrGameMode({
    piano_mode, setPianoMode, song_playing, setSongSelectOpen
}: SelectSimOrGameMode_Prop)
{
    const { text } = useI18N()

    function onChangeToSimulator()
    {
        setPianoMode(GameManager.piano_mode = PianoMode.simulator)
    }

    function onChangeToGame()
    {
        setPianoMode(GameManager.piano_mode = PianoMode.in_game)
        if (song_playing ?? true)
        {
            setSongSelectOpen(true)
        }
    }

    function SongPlayingLabel()
    {
        if (piano_mode != PianoMode.in_game) { return (<></>) }

        let song_label = (song_playing != null)
            ? (<Text>{song_playing.name}</Text>)
            : (<Space>
                <Text italic={true}>{text.piano.not_selected}</Text>
                <Button className="SelectNowButton" onClick={() => setSongSelectOpen(true)}>
                    {text.piano.select_now}
                </Button>
            </Space>)

        return (
            <Text>{text.piano.song_playing}: {song_label}</Text>
        )
    }

    return (<FloatButton.Group className="PianoModeButtonGroup"><Space>
        <Button onClick={onChangeToSimulator}
            type={piano_mode == PianoMode.simulator ? "primary" : "default"}>
            {text.piano.sim_mode}
        </Button>
        <Button onClick={onChangeToGame}
            type={piano_mode == PianoMode.in_game ? "primary" : "default"}>
            {text.piano.game_mode}
        </Button>
        <SongPlayingLabel />
    </Space></FloatButton.Group>)
}

type SelectSimOrGameMode_Prop = {
    piano_mode: PianoMode
    setPianoMode: Dispatch<SetStateAction<PianoMode>>
    song_playing: SongData | null
    setSongSelectOpen: Dispatch<SetStateAction<boolean>>
}

function SongSelectModal({
    is_song_select_open, setSongSelectOpen, song_playing, setSongPlaying
}: SongSelectModal_Prop)
{
    let [song_list, setSongList] = useState<SongData[]>([])
    let [song_selected_in_list, setSongSelectedInList] = useState<SongData | null>()

    const { text } = useI18N()
    const [notif_api, notif_ctx] = notification.useNotification()

    /**
     * This will start the game.
     */
    function onSelectSong()
    {
        if (song_selected_in_list != null)
        {
            setSongPlaying(song_selected_in_list)
            setSongSelectOpen(false)
            GameManager.loadAndStartPianoGame(song_selected_in_list.folder_path)
        }
        else
        {
            notif_api.warning({
                message: text.piano.warn_not_selected,
                placement: "top"
            })
        }
    }

    function onSelectSongCancel()
    {
        setSongSelectedInList(song_playing)
        setSongSelectOpen(false)
    }

    async function updateSongList()
    {
        const available_songs_folder_name = game_sheet_info.songs
        if (isClientEnvironment())
        {
            const available_songs = await Promise.all(available_songs_folder_name.map(
                async (folder_name) =>
                    fetch(path.join("/game_sheet", folder_name, "song.json"))
                        .then(jsonfyResponse)
                        .then((info: SongJSONData) => ({ ...info, folder_path: path.join("/game_sheet", folder_name) }))
                        .catch(r => { console.error(r); return null; })
            ));

            setSongList(available_songs.filter((song_name) => song_name != null) as SongData[]);
        }
    }

    function SongList()
    {
        function SongListItem(song_data: SongData)
        {
            const is_selected = song_data.name == song_selected_in_list?.name

            return (<List.Item key={`${song_data.name}:${is_selected}`}
                onClick={() => setSongSelectedInList(song_data)}
                className={`SongListItem ${is_selected ? "SelectedSong" : ""}`}>
                {song_data.name}
            </List.Item>)
        }

        return (<List size="small" id="song_select_list"
            pagination={{ position: "bottom", align: "start" }}
            dataSource={song_list} renderItem={SongListItem}
            header={<Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button onClick={updateSongList}><ReloadOutlined /></Button>
            </Space>}
        />)
    }

    useEffect(() =>
    {
        updateSongList()
    }, [])

    return (<Modal open={is_song_select_open} onOk={onSelectSong} onCancel={onSelectSongCancel}>
        {notif_ctx}
        <Title>{text.piano.song_select_title}</Title>
        <SongList />
    </Modal>)
}

type SongSelectModal_Prop = {
    is_song_select_open: boolean
    setSongSelectOpen: Dispatch<SetStateAction<boolean>>
    song_playing: SongData | null
    setSongPlaying: Dispatch<SetStateAction<SongData | null>>
}

type SongData = SongJSONData & {
    folder_path: string
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

    function onSelectNormalScreen()
    {
        setPianoSetting({ ...piano_setting, screen_mode: ScreenMode.normal })
        GraphicManager.handleWindowResize()
    }

    function onSelectCurveScreen()
    {
        setPianoSetting({ ...piano_setting, screen_mode: ScreenMode.curve_screen })
        GraphicManager.handleWindowResize()
    }

    return (<Modal open={is_setting_open} onOk={onOk} onCancel={onCancel}>
        <Space>
            <Text>{text.piano.screen_mode}</Text>
            <Button
                type={piano_setting.screen_mode == ScreenMode.normal ? "primary" : "default"}
                onClick={onSelectNormalScreen}>
                {text.piano.full_screen_mode}
            </Button>
            <Button
                type={piano_setting.screen_mode == ScreenMode.curve_screen ? "primary" : "default"}
                onClick={onSelectCurveScreen}>
                {text.piano.curve_screen_mode}
            </Button>
        </Space>
        <Space>
            <Button onClick={GameManager.startPianoGame.bind(GameManager)}>
                Start
            </Button>
            <Button onClick={GameManager.pausePianoGame.bind(GameManager)}>
                Pause
            </Button>
            <Button onClick={GameManager.resumePianoGame.bind(GameManager)}>
                Resume
            </Button>
        </Space>
    </Modal>)
}

type PianoSettingModal_Prop = {
    piano_setting: PianoSetting
    setPianoSetting: Dispatch<SetStateAction<PianoSetting>>
    is_setting_open: boolean
    setSettingOpen: Dispatch<SetStateAction<boolean>>
}

type PianoSetting = {
    screen_mode: ScreenMode
}
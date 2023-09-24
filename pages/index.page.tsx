"use client"

import "./home.scss"
import { useI18N } from "@/i18n/i18n"
import { Button, Space } from "antd"
import { Typography } from "antd"
const { Title } = Typography

export default function IndexPage()
{
    const { text } = useI18N()

    return (<div id="HomePage">
        <Title className="Title" level={1}>{text.index.game_title}</Title>
        <Space className="PlayAndHelpButtons" size={50}>
            <Button type="primary" size="large">{text.index.play_button_text}</Button>
            <Button size="large">{text.index.help_button_text}</Button>
        </Space>
    </div>)
}   
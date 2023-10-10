"use client"

import "./home.scss"
import { possible_locales, useI18N } from "@/i18n/i18n"
import { Button, Dropdown, FloatButton, MenuProps, Space } from "antd"
import { Typography } from "antd"
const { Title } = Typography
import { TranslationOutlined } from "@ant-design/icons"
import Link from "next/link"

export default function IndexPage()
{
    const { text } = useI18N()

    const lang_select_menu: MenuProps["items"] = possible_locales.map(
        locale => ({
            key: locale, label: (<Link href={""} locale={locale}>
                {text.lang[locale as keyof typeof text.lang]}
            </Link>)
        })
    )

    return (<div id="HomePage">
        <div id="HomePage_Main">
            <Title className="Title" level={1}>{text.index.game_title}</Title>
            <Space className="PlayAndHelpButtons" size={50}>
                <Link href="/piano/"><Button type="primary" size="large">
                    {text.index.play_button_text}
                </Button></Link>
                <Link href="/how_to_play"><Button size="large">
                    {text.index.help_button_text}
                </Button></Link>
            </Space>
        </div>
        <div id="HomePage_HoverButtons">
            <Dropdown menu={{ items: lang_select_menu }} placement="bottomRight">
                <Button size="large">
                    <TranslationOutlined />
                    {"Language / 语言"}
                </Button>
            </Dropdown>
        </div>
    </div>)
}   
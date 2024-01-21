"use client"

import { useRouter } from "next/router"
import { GameEndResultQuery } from "../piano/index.page"

import "./result.scss"
import { Button, Space, Table, Typography } from "antd"
import { useI18N } from "@/i18n/i18n"
import Link from "next/link"
const { Text, Title } = Typography

export default function ResultPage()
{
    const router = useRouter()
    // See if the result page is come from a ended game.
    if (router.query.sum_score == undefined) { return (<NoResultAvailablePage />) }

    const { text } = useI18N()

    const { rating_count_in_str, sum_score: sum_score_in_str, total_note_num: total_note_num_in_str } =
        router.query as unknown as { [key in keyof GameEndResultQuery]: string }
    const rating_count = new Map(
        rating_count_in_str.slice(1, -1).split(",").map(s => { const [r, c] = s.split(":"); return [r, parseInt(c)] })
    )
    const [sum_score, total_note_num] = [parseInt(sum_score_in_str), parseInt(total_note_num_in_str)]

    // console.log({ rating_count_in_str, rating_count, sum_score, total_note_num })

    return (<div id="result_panel">
        <Title className="Title">{text.result.title_text}</Title>
        <Space direction="horizontal" className="DataPanel">
            <Table pagination={false}
                dataSource={[...rating_count.entries()].map(([rating, count]) => ({ rating, count, key: rating }))}
                columns={["Rating", "Count"].map(s => ({ key: s, dataIndex: s.toLocaleLowerCase(), title: s }))} />
            <Space direction="vertical" align="start">
                <Text>{text.result.completeness_text} {(sum_score / total_note_num * 100).toFixed(2)}%</Text>
            </Space>
        </Space>
        <Link href={"/piano?goto_game=true"} as={"/piano"}><Button id="button_play" type="primary">
            {text.result.button_text_play_another}
        </Button></Link>
    </div>)
}

function NoResultAvailablePage()
{
    const { text } = useI18N()

    return (<div id="result_panel" className="NoResultPanel">
        <Title>{text.result.no_result_yet}</Title>
        <Text>{text.result.hint_go_to_game}</Text>
        <Link href={"/piano?goto_game=true"} as={"/piano"}><Button id="button_play" type="primary">
            {text.result.button_text_play}
        </Button></Link>
    </div>)
}
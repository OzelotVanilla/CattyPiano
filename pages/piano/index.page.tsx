"use client"

import { convertKeyNameToNoteNum, convertNoteNumToKeyName, keys } from "@/utils/music";
import { Button } from "antd";
import { useEffect, useState } from "react";
import { PianoKeyboard } from "./PianoKeyboard";


export default function PianoPage()
{
    return (<>
        <div id="KeyboardArea"><PianoKeyboard /></div>
    </>)
}
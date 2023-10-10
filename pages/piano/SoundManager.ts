"use client"

import { isClientEnvironment } from "@/utils/env";

export const global_audio_channel_count = 6

export class SoundManager
{
    public static audio_context: AudioContext | null = null;

    /**
     * 
     * @returns Singleton of `AudioContext`, `null` if not at client side.
     */
    public getAudioContext()
    {
        if (isClientEnvironment())
        {
            if (SoundManager.audio_context == null) { SoundManager.audio_context = new AudioContext() }
            return SoundManager.audio_context
        }

        return null
    }
}
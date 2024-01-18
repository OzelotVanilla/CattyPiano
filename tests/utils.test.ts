import { shiftMIDINumToRange } from "../utils/music"

test(
    "Check `shiftToRange` in `music.ts`",
    function ()
    {
        const toC3A3Range = (n: number) => shiftMIDINumToRange(n, 48, 59)
        expect(toC3A3Range(50)).toBe(50)
        expect(toC3A3Range(47)).toBe(59)
        expect(toC3A3Range(36)).toBe(48)
        expect(toC3A3Range(78)).toBe(54)
    }
)
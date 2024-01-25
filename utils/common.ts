import { Time as convertToTime, getTransport } from "tone";
import { Time } from "tone/build/esm/core/type/Units";

export const jsonfyResponse =
    async (r: Response) =>
    {
        const text = await r.text()

        try { return JSON.parse(text.replace(/\/\*\*?(?:.|\n|\r|\r\n)*\*\/|\/\/.*$/gm, "")) }
        catch (reason) { console.error(`Requested URL ${r.url} does not contains valid JSON.`, reason) }
    }

export function convertToSeconds(t: Time)
{
    return convertToTime(t).toSeconds()
}
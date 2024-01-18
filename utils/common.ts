import { Time as convertToTime, getTransport } from "tone";
import { Time } from "tone/build/esm/core/type/Units";

export const jsonfyResponse =
    (r: Response) =>
        r.json()
            .catch(reason => console.error(`Requested URL ${r.url} does not contains valid JSON.`, reason))

export function convertToSeconds(t: Time)
{
    return convertToTime(t).toSeconds()
}
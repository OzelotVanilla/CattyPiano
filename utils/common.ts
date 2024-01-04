export const jsonfyResponse =
    (r: Response) =>
        r.json()
            .catch(reason => console.error(`Requested URL ${r.url} does not contains valid JSON.`, reason))
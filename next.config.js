const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    pageExtensions: ["page.tsx"],
    i18n: {
        locales: ["en", "zh"],
        defaultLocale: "en"
    },
    /**
     * Disable module CSS, 
     *  from "https://stackoverflow.com/questions/67934463/how-to-turn-off-css-module-feature-in-next-js".
    */
    webpack(config)
    {
        config.module.rules.forEach(
            (rule) =>
            {
                const { oneOf } = rule;
                if (oneOf)
                {
                    oneOf.forEach((one) =>
                    {
                        if (!`${one.issuer?.and}`.includes('_app')) return;
                        one.issuer.and = [path.resolve(__dirname)];
                    });
                }
            }
        )
        return config;
    },
    reactStrictMode: true,
}

module.exports = nextConfig

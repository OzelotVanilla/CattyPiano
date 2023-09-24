const path = require('path');

const possible_locale = ["en", "zh"]

/** @type {import('next').NextConfig} */
const nextConfig = {
    pageExtensions: ["page.tsx"],
    i18n: {
        locales: possible_locale,
        defaultLocale: "en"
    },
    publicRuntimeConfig: {
        locales: possible_locale
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

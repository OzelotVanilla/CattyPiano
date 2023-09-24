import { ConfigProvider } from "antd";
import { AppProps } from "next/app";

export default function AppGlobalWrapper({ Component, pageProps }: AppProps)
{
    return (
        <ConfigProvider theme={{
            token: {
                fontFamily: "Roboto, Consolas, 'LXGW Wenkai Mono', LXGWWenKaiMono"
            }
        }}>
            <Component {...pageProps} />
        </ConfigProvider>
    )
}
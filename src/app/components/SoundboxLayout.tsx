import { useEffect, useState } from "react";
import { Inter } from "next/font/google";
import { useApplicationConfig } from "../context/ApplicationConfigContext";
import Constants from "../model/Constants";
import Navbar from "./navbar/navbar";
import PWA from "../pwa";
import SoundboxConfig from "../model/SoundboxConfig";
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });

const SoundboxLayout = ({
    children,
    memeName,
    soundboxConfig
}: { children: React.ReactNode, memeName: string, soundboxConfig?: SoundboxConfig }) => {
    const { currentTheme, currentLanguageValue } = useApplicationConfig();

    const [currentPrimaryColor, setCurrentPrimaryColor] = useState("#61A6FA");

    // Configure colors based on configuration
    useEffect(() => {
        // Primary color - normal
        if (soundboxConfig && soundboxConfig.primaryColor && soundboxConfig.primaryColor.normal) {
            const color = currentTheme === Constants.THEMES.DARK ? soundboxConfig.primaryColor.normal.dark : soundboxConfig.primaryColor.normal.light;
            document.body.style.setProperty("--fallback-p", color);
            document.body.style.setProperty("--primary-color", color);
            setCurrentPrimaryColor(color);
        } else {
            setCurrentPrimaryColor(currentTheme == Constants.THEMES.LIGHT ? "#61A6FA" : "#3884FF");
        }

        // Secondary color - normal
        if (soundboxConfig && soundboxConfig.secondaryColor && soundboxConfig.secondaryColor.normal) {
            const color = currentTheme === Constants.THEMES.DARK ? soundboxConfig.secondaryColor.normal.dark : soundboxConfig.secondaryColor.normal.light;
            document.body.style.setProperty("--secondary-color", color);
        }

        // Primary color - hover
        if (soundboxConfig && soundboxConfig.primaryColor && soundboxConfig.primaryColor.hover) {
            const color = currentTheme === Constants.THEMES.DARK ? soundboxConfig.primaryColor.hover.dark : soundboxConfig.primaryColor.hover.light;
            document.body.style.setProperty("--primary-color-hover", color);
        }

        // Secondary color - hover
        if (soundboxConfig && soundboxConfig.secondaryColor && soundboxConfig.secondaryColor.normal) {
            const color = currentTheme === Constants.THEMES.DARK ? soundboxConfig.secondaryColor.hover.dark : soundboxConfig.secondaryColor.hover.light;
            document.body.style.setProperty("--secondary-color-hover", color);
        }
    }, [soundboxConfig, currentTheme]);
    
    return (
        <html data-theme={currentTheme ? currentTheme : Constants.THEMES.DARK} className="h-full" lang={currentLanguageValue}>
            <Head>
                <link rel="manifest" href={Constants.MANIFEST_URI.replace(Constants.MEME_NAME_PLACEHOLDER, memeName)} />
                <meta name="theme-color" content={currentPrimaryColor} />
                {soundboxConfig && soundboxConfig.soundboxDescription && <meta name="description" content={soundboxConfig.soundboxDescription[currentLanguageValue] || soundboxConfig.soundboxDescription["en"]} />}
                {soundboxConfig && soundboxConfig.appTitle && <title>{soundboxConfig.appTitle[currentLanguageValue] || soundboxConfig.appTitle["en"]}</title>}
            </Head>
            <body className={`${inter.className} h-full flex flex-col overflow-x-hidden`}>
                <Navbar config={soundboxConfig}></Navbar>
                {children}
                <PWA></PWA>
            </body>
        </html>
    );
};

export default SoundboxLayout;

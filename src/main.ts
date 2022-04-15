import bcd from "@mdn/browser-compat-data";
import { SupportBlock } from "@mdn/browser-compat-data/types";
import browserslist from "browserslist";

// key: caniuse (https://github.com/browserslist/caniuse-lite/blob/main/data/browsers.js)
// value: mdn (https://github.com/mdn/browser-compat-data/tree/main/browsers)

const browserMap: {[key: string]: string | null} = {
    "ie": "ie",
    "edge": "edge",
    "firefox": "firefox",
    "chrome": "chrome",
    "safari": "safari",
    "opera": "opera",
    "ios_saf": "safari_ios",
    "android": "webview_android",
    "op_mob": "opera_android",
    "and_chr": "chrome_android",
    "and_ff": "firefox_android",
    "samsung": "samsunginternet_android",
    "ie_mob": null,
    "and_uc": null,
    "bb": null,
    "op_mini": null,
    "and_qq": null,
    "kaios": null,
    "baidu": null,
};

console.log(bcd.css.properties["background"].__compat);


console.log(
    browserslist("defaults")
);

function isSupport(browser: string, version: string, support: SupportBlock): boolean {
    console.log(typeof support);
    return true;
}

console.log(
    browserslist("defaults")
        .map((browser) => browser.split(" "))
        .every((browser) => {
            const bcdBrowser = browserMap[browser[0]];
            if (!bcdBrowser) return true;

            return isSupport(bcdBrowser, browser[1], bcd.css.properties["background"].__compat!.support!);
        })
);

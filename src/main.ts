import bcd from "@mdn/browser-compat-data";
import { SupportBlock, Identifier, SupportStatement, VersionValue } from "@mdn/browser-compat-data/types";
import browserslist from "browserslist";
import { compare } from "compare-versions";

type versionBrowser = { [key: string]: string };
type compatResult = { key: string, browsers: versionBrowser, };

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

function browserSupportList(): {[key: string]: string[]} {
    const browserVersions: {[key: string]: string[]} = {};
    const bs = browserslist([
        // "defaults"
        "iOS >= 13",
        "Safari >= 13",
        "Firefox ESR",
        "last 2 Chrome versions",
        "last 2 Edge versions"
    ]);
    console.log(bs);

    bs.map((browser) => browser.split(" ")).forEach((browser) => {
        const bcdBrowserName = browserMap[browser[0]];
        if (!bcdBrowserName) {
            console.log("unknow browser", browser[0]);
            return;
        }
        (browserVersions[bcdBrowserName] || (browserVersions[bcdBrowserName] = [])).push(...browser[1].split("-"));
    });
    return browserVersions;
}

const browserVersions = browserSupportList();

function browserSupport(version: string, versionStatement?: SupportStatement): boolean {
    if (!versionStatement) {
        console.log("warning: support no statement");
        return true;
    }

    let versionAdded: VersionValue = false;

    if (versionStatement instanceof Array) {
        // somthing changed, for example add prefix '-webkit-', etc.
        for (const subStatement of versionStatement) {
            if (Object.keys(subStatement).length == 1 && "version_added" in subStatement) {
                // find the latest status and use it to compare
                versionAdded = subStatement.version_added;
                break;
            }
        }
    } else if ("version_added" in versionStatement) {
        versionAdded = versionStatement.version_added;
    }

    if (!versionAdded) {
        // not supported
        return false;
    } else if (versionAdded === true) {
        // unknown in which version support was added
        return true;
    }

    // normalize for version compare
    versionAdded = versionAdded.replace("≤", "");

    return compare(version, versionAdded, ">=");
}

function unsupport(support: SupportBlock): versionBrowser {
    const unsupportBrowsers: versionBrowser = {};
    for (const browser in support) {
        if (!(browser in browserVersions)) continue; // ignore

        const versions = browserVersions[browser];
        const unsupportVersions = versions.filter(version => !browserSupport(version, support[browser]));
        if (unsupportVersions.length > 0) {
            unsupportBrowsers[browser] = unsupportVersions[0];
        }
    }
    return unsupportBrowsers;
}

function compat(properties: Identifier, parent?: string): compatResult[] {
    const browserVersions: compatResult[] = [];

    for (const key of Object.keys(properties) ) {
        const property = properties[key];
        const keyWithParent = parent ? (parent + " " + key) : key;

        if (!property.__compat) {
            browserVersions.push(...compat(property, keyWithParent));
            continue;
        }

        const support = property.__compat.support;
        const unsupports = unsupport(support);
        if (Object.keys(unsupports).length > 0) {
            browserVersions.push({ key: keyWithParent, browsers: unsupports });
            // console.log("unsupport", keyWithParent, unsupports);
        }
    }

    return browserVersions;
}

// runSupport({ gap: bcd.css.properties.gap });

const unsupportedBrowsers = compat(bcd.css.properties);
console.log(unsupportedBrowsers);

// console.log(bcd.css.properties.length);

// console.log(bcd.css.properties["-webkit-border-before"]);
// isSupport(bcd.css.properties["background"].__compat!.support!);

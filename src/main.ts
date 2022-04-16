import browserslist from "browserslist";
import { Identifier, SupportStatement, VersionValue, BrowserNames } from "@mdn/browser-compat-data/types";
import { compare } from "compare-versions";

type CompatResult = PriCompatResult & CompatResultMeta;

// CompatResult without __browsers
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface PriCompatResult
  extends Record<Exclude<string, "__browsers">, CompatResult> {}

// CompatResult with browsers only
interface CompatResultMeta {
    __browsers?: browserVersionMap;
}

type browserVersionMap = {
    [key in BrowserNames]?: string;
};

// key: caniuse (https://github.com/browserslist/caniuse-lite/blob/main/data/browsers.js)
// value: mdn (https://github.com/mdn/browser-compat-data/tree/main/browsers)
const BROWSERS_MAP: {[key: string]: BrowserNames} = {
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

    // Unsupport browsers
    // "ie_mob": null,
    // "and_uc": null,
    // "bb": null,
    // "op_mini": null,
    // "and_qq": null,
    // "kaios": null,
    // "baidu": null,
};

class mdnCompat {
    private browserVersions: {[BrowserNames: string]: string[]} = {};

    constructor(
        queries?: string | readonly string[] | null,
        opts?: browserslist.Options
    ) {
        browserslist(queries, opts).map((browser) => browser.split(" ")).forEach((browser) => {
            const bcdBrowserName = BROWSERS_MAP[browser[0]];
            if (!bcdBrowserName) {
                // non support browser
                return;
            }
            (this.browserVersions[bcdBrowserName] || (this.browserVersions[bcdBrowserName] = [])).push(...browser[1].split("-"));
        });
    }

    private getStatementVersionAdded(supportStatement: SupportStatement) : VersionValue {
        let versionAdded: VersionValue = false;

        if (supportStatement instanceof Array) {
            // somthing changed, for example add prefix '-webkit-', etc.
            for (const subStatement of supportStatement) {
                if (Object.keys(subStatement).length == 1 && "version_added" in subStatement) {
                    // find the latest status and use it to compare
                    versionAdded = subStatement.version_added;
                    break;
                }
            }
        } else if ("version_added" in supportStatement) {
            versionAdded = supportStatement.version_added;
        }
        return versionAdded;
    }

    unsupport(ident: Identifier): CompatResult {
        const compat = ident && ident.__compat;
        if (!compat) {
            const primaryResults: PriCompatResult = {};
            // nested identifier compat, run recursive
            for (const [identName, subIdent] of Object.entries(ident) ) {
                const unsupports = this.unsupport(subIdent);
                if (Object.keys(unsupports).length) {
                    primaryResults[identName] = unsupports;
                }
            }
            return primaryResults;
        }

        const results: CompatResult = {};
        const support = compat.support;

        const unsupportBrowsers : browserVersionMap = {};
        for (const [unknownBrowser, statement] of Object.entries(support)) {
            if ( !(unknownBrowser in this.browserVersions)) continue; // ignore non-target browser

            // force type casting
            const browser = unknownBrowser as BrowserNames;

            // parse get statement version added
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            let versionAdded = this.getStatementVersionAdded(statement!);
            if (typeof versionAdded == "string") {
                // FIXME: normalize for version compare, e.g. "≤37" (android webview), "review"
                if (versionAdded.match(/[^\d|\.]/)) {
                    // console.log("warning: special statement", key, browser, versionAdded);
                    versionAdded = versionAdded.replace(/[^\d|\.]/g, "");
                }
            }

            const versions = this.browserVersions[browser];
            const unsupportVersions = versions.filter(version => {
                if (!versionAdded) {
                    // unsupported
                    return true;
                } else if (versionAdded === true) {
                    // unknown in which version support was added
                    return false;
                }
                return compare(version, versionAdded, "<");
            });
            if (unsupportVersions.length > 0) {
                // pick the latest version
                unsupportBrowsers[browser] = unsupportVersions[0];
            }
        }

        if (Object.keys(unsupportBrowsers).length) {
            results.__browsers = unsupportBrowsers;
        }

        return results;
    }
}

export default mdnCompat;

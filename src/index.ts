import browserslist from "browserslist";
import { Identifier, SupportStatement, VersionValue, BrowserNames, SimpleSupportStatement } from "@mdn/browser-compat-data/types";
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

type AlternativeNameResult = {
    [key: string]: string[] | AlternativeNameResult
} | string[]

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

export class MdnCompat {
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

        if (typeof versionAdded == "string") {
            // FIXME: normalize for version compare, e.g. "≤37" (android webview), "review"
            if (versionAdded.match(/[^\d|\.]/)) {
                // console.log("warning: special statement", key, browser, versionAdded);
                versionAdded = versionAdded.replace(/[^\d|\.]/g, "");
            }
        }

        return versionAdded;
    }

    private getStatementAlternativeName(name: string, supportStatement: SupportStatement): string[] {
        const alternativeNamesMap: { [key: string]: true } = {};
        const addAlternativeName = (stmt: SimpleSupportStatement) => {
            if (stmt.alternative_name) {
                alternativeNamesMap[stmt.alternative_name] = true;
            }
            if (stmt.prefix) {
                alternativeNamesMap[stmt.prefix + name] = true;
            }
        };
        if (supportStatement instanceof Array) {
            // somthing changed, for example add prefix '-webkit-', etc.
            for (const subStatement of supportStatement) {
                addAlternativeName(subStatement);
            }
        } else if ("version_added" in supportStatement) {
            addAlternativeName(supportStatement);
        }

        return Object.keys(alternativeNamesMap);
    }

    private support(browser: string, supportStatement: SupportStatement): boolean {
        const versionAdded = this.getStatementVersionAdded(supportStatement);
        const versions = this.browserVersions[browser];
        return versions.every(version => {
            if (!versionAdded) {
                // unsupported
                return false;
            } else if (versionAdded === true) {
                // unknown in which version support was added
                return true;
            }
            return compare(version, versionAdded, ">=");
        });
    }

    alternative(ident: Identifier, identName = ""): AlternativeNameResult {
        // console.log(ident);
        const compat = ident && ident.__compat;
        if (!compat) {
            const primaryResults: AlternativeNameResult = { };
            // nested identifier compat, run recursive
            for (const identName of Object.keys(ident) ) {
                const subIdent = ident[identName];
                Object.assign(primaryResults, this.alternative(subIdent, identName));
            }
            return identName ? { [identName]: primaryResults } : primaryResults;
        }

        const name = ((identName.indexOf("_") != -1 && compat.mdn_url) ? compat.mdn_url.split("/").pop() : "") || identName || "";
        const results: { [key: string]: true } = {};
        const support = compat.support;

        for (const browser of Object.keys(support).filter(browser => browser in this.browserVersions) as BrowserNames[]) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const statement = support[browser]!;
            if (this.support(browser, statement)) {
                this.getStatementAlternativeName(name, statement).forEach(alternativeName => results[alternativeName] = true);
            }
        }
        return identName ? { [identName]: Object.keys(results) } : Object.keys(results);
    }

    unsupport(ident: Identifier): CompatResult {
        const compat = ident && ident.__compat;
        if (!compat) {
            const primaryResults: PriCompatResult = {};
            // nested identifier compat, run recursive
            for (const identName of Object.keys(ident) ) {
                const subIdent = ident[identName];
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

        for (const browser of Object.keys(support).filter(browser => browser in this.browserVersions) as BrowserNames[]) {
            const statement = support[browser];

            // parse get statement version added
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const versionAdded = this.getStatementVersionAdded(statement!);

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

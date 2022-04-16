# mdn-compat-browserlist

List all browsers compat data from [MDN](https://developer.mozilla.org/) and filter with [browserlist](https://github.com/browserslist/browserslist).

## Features

- [x] Support filter all browserlist queries
- [x] List all browser unsupported features (including HTML, CSS, JavaScript, SVG, Web API, WebExtensions, etc.)
- [ ] List all browser supported features

## Install

```
npm install mdn-compat-browserlist
```

```
yarn add mdn-compat-browserlist
```

## Setup

```js
import mdnCompat from "mdn-compat-browserlist";
import bcd from "@mdn/browser-compat-data";
```

## Usage

Init `mdnCompat` object with browserlist query and config (optional).

```js
const compat = new mdnCompat(["> 0.5%", "last 2 versions", "not dead"]);

compat.unsupport(bcd.css);
compat.unsupport(bcd.css.properties);
compat.unsupport(bcd.css.properties["justify-content"]);
```

## Results

For listing unsupported features, the browser list in `__browsers` will contains the max version of the browser which filter by browserlist filter.

### Normal result sample (must contains `__browsers` key)

```js
'box-shadow': {
  __browsers: {
    chrome: '100',
    chrome_android: '100',
    firefox: '99',
    firefox_android: '99',
    opera_android: '64',
    safari: '15.4',
    safari_ios: '15.4',
    samsunginternet_android: '16.0',
    webview_android: '100'
  }
}
```

### Nested result sample (must NOT contains `__browsers` key)

```js
'justify-content': {
  flex_context: {
    __browsers: { firefox: '99', firefox_android: '99' }
  },
  grid_context: {
    __browsers: { ie: '11' }
  }
}
```

## License

MIT License

CC0-1.0 License for MDN data

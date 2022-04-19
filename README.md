# mdn-compat-browserlist

List all browsers compat data from [MDN](https://developer.mozilla.org/) and filter with [browserlist](https://github.com/browserslist/browserslist).

## Features

- [x] [Support filter all browserlist queries](#usage)
- [x] List all [browser unsupported features](#unsupport-listing) (including HTML, CSS, JavaScript, SVG, Web API, WebExtensions, etc.)
- [x] List all [alternative CSS properties](#alternative-css-properties) (`-webkit`, `-moz`, etc.)
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
import { MdnCompat } from "mdn-compat-browserlist";
import bcd from "@mdn/browser-compat-data";
```

## Usage

Init `MdnCompat` with browserlist query and config (optional).

```js
const compat = new MdnCompat(["> 0.5%", "last 2 versions", "not dead"]);
```

### Unsupport listing

```
compat.unsupport(bcd.css);
compat.unsupport(bcd.css.properties);
compat.unsupport(bcd.css.properties["justify-content"]);
```

#### Results

For listing unsupported features, the browser list in `__browsers` will contains the max version of the browser which filter by browserlist query.

##### Normal result sample

must contains `__browsers` key

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

##### Nested result sample

must NOT contains `__browsers` key

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

### Alternative CSS properties

```js
compat.alternative(bcd.css.properties);
compat.alternative(bcd.css.properties["justify-content"]);
```

#### Results

```js
compat.alternative(bcd.css.properties["font-smooth"]);

// output
["-webkit-font-smoothing", "-moz-osx-font-smoothing"];
```

```js
compat.alternative(bcd.css.properties["justify-content"]);

// output
{
  flex_context: ["-webkit-justify-content"],
  grid_context: []
}
```

## License

MIT License

CC0-1.0 License for MDN data

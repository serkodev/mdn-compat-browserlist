import bcd from "@mdn/browser-compat-data";
import mdnCompat from "./main";

const compat = new mdnCompat();

// TODO: test case
console.log(compat.unsupport(bcd.css.properties));
console.log(compat.unsupport(bcd.css.selectors));

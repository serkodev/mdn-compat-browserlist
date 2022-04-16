import bcd from "@mdn/browser-compat-data";
import mdnCompat from "./main";

const compat = new mdnCompat(["> 0.5%", "last 2 versions", "not dead"]);

// TODO: test case
console.log(compat.unsupport(bcd.css.properties));
console.log(compat.unsupport(bcd.javascript.operators));
console.log(compat.unsupport(bcd.css.properties["justify-content"]));

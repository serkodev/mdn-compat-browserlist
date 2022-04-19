import bcd from "@mdn/browser-compat-data";
import { MdnCompat } from "./index";

const compat = new MdnCompat(["> 0.5%", "last 2 versions", "not dead"]);

// TODO: test case
// console.log(compat.unsupport(bcd.css.properties));
// console.log(compat.unsupport(bcd.javascript.operators));
// console.log(compat.unsupport(bcd.css.properties["justify-content"]));

console.log(compat.alternative(bcd.css.properties["justify-content"]));
console.log(compat.alternative(bcd.css.properties["font-smooth"]));
console.log(compat.alternative(bcd.css.properties));

"use strict";

var __awaiter = this && this.__awaiter || function (e, t, n, o) {
    return new (n || (n = Promise))(function (r, s) {
        function c (e) {
            try {
                a(o.next(e));
            } catch (e) {
                s(e);
            }
        }
        function i (e) {
            try {
                a(o.throw(e));
            } catch (e) {
                s(e);
            }
        }
        function a (e) {
            var t;
            if (e.done) {
                r(e.value);
            } else {
                (t = e.value, t instanceof n ? t : new n(function (e) {
                    e(t);
                })).then(c, i);
            }
        }
        a((o = o.apply(e, t || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.compressTextures = undefined;
const fs_extra_1 = require("fs-extra");
const compressTextures = e => __awaiter(undefined, undefined, undefined, function* () {
    console.debug(`Execute compress task ${e}`);
    for (let t = 0; t < e.length; t++) {
        const n = e[t];
        if (n.format === "jpg") {
            n.dest = n.dest.replace(".png", ".jpg");
            yield pngToJPG(n.src, n.dest, n.quality);
            e.splice(t, 1);
            t--;
        }
    }
});
function pngToJPG (e, t, n) {
    return __awaiter(this, undefined, undefined, function* () {
        const o = yield getImage(e);
        const r = document.createElement("canvas");
        r.getContext("2d").drawImage(o, 0, 0);
        const s = r.toDataURL("image/jpeg", n / 100);
        yield (0, fs_extra_1.outputFile)(t, s);
        console.debug("pngToJPG", t);
    });
}
function getImage (e) {
    return new Promise((t, n) => {
        const o = new Image();
        o.onload = function () {
            t(o);
        };
        o.onerror = function (e) {
            n(e);
        };
        o.src = e.replace("#", "%23");
    });
}
exports.compressTextures = compressTextures;
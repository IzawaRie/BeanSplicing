"use strict";

const path = require('path');
const compressing = require('compressing');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
// const mainScript = require('../main');
// const exec = require('child_process').exec;
var __awaiter = this && this.__awaiter || function (o, e, t, n) {
    return new (t || (t = Promise))(function (s, r) {
        function i (o) {
            try {
                c(n.next(o));
            } catch (o) {
                r(o);
            }
        }
        function a (o) {
            try {
                c(n.throw(o));
            } catch (o) {
                r(o);
            }
        }
        function c (o) {
            var e;
            if (o.done) {
                s(o.value);
            } else {
                (e = o.value, e instanceof t ? e : new t(function (o) {
                    o(e);
                })).then(i, a);
            }
        }
        c((n = n.apply(o, e || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.onAfterMake = exports.onBeforeMake = exports.onError = exports.unload = exports.onAfterBuild = exports.onAfterCompressSettings = exports.onBeforeCompressSettings = exports.onBeforeBuild = exports.load = exports.throwError = undefined;
const PACKAGE_NAME = "cocos_inspector";
function log (...o) {
    return console.log(`[${PACKAGE_NAME}] `, ...o);
}
let allAssets = [];
exports.throwError = true;
const load = function () {
    return __awaiter(this, undefined, undefined, function* () {
        console.log(`[${PACKAGE_NAME}] Load cocos plugin example in builder.`);
        allAssets = yield Editor.Message.request("asset-db", "query-assets");
    });
};

function getDevicesCount (stdout, isPrint = true) {
    const output = stdout.replace('List of devices attached', '').trim();
    const deviceCount = output.split('device').length - 1;
    if (isPrint) console.log(`已连接的设备数量: ${deviceCount}`);
    return deviceCount;
}
exports.load = load;
const onBeforeBuild = async function (o, e) {
    console.log(o);
    console.log("onBeforeBuild")
    const isPush = o.packages[PACKAGE_NAME].Push2Device;
    if (isPush) {
        let { stdout } = await exec('adb devices');
        const deviceCount = getDevicesCount(stdout, false);
        if (deviceCount === 0) {
            throw new Error("未连接到设备");
        } else if (deviceCount > 1) {
            throw new Error("只能连接1个设备");
        }
    } else {
        console.warn("不推送data到设备");
    }

    // const res = await mainScript.methods.checkDevice();
    // console.log(res);
    // if (!res) {
    //     throw new Error("未连接到设备");
    // }
    // return new Promise((resolve, reject) => {
    //     reject();
    // });
    // (async () => { 
    //     let { stdout } = await exec('adb devices');
    //     console.log(stdout);
    // })()
    // exec('adb devices', (err, stdout, stderr) => {
    //     console.log(stdout);
    // });
    // return __awaiter(this, undefined, undefined, function* () {
    //     log(`${PACKAGE_NAME}.webTestOption`, "onBeforeBuild");
    // });
    // return exec('adb devices').then(({ stdout }) => { console.log(stdout) });

};
exports.onBeforeBuild = onBeforeBuild;

const onAfterCompressSettings = function (o, e) {
    return __awaiter(this, undefined, undefined, function* () {
        console.log("webTestOption", "onAfterCompressSettings");
    });
};
exports.onAfterCompressSettings = onAfterCompressSettings;
const onAfterBuild =async function (o, e) {
    const isPush = o.packages[PACKAGE_NAME].Push2Device;
    if (isPush) {
        console.warn("推送data到设备")
        console.time('压缩');
        const zipPath = path.join(__dirname, '../../../build/android/data.zip');
        const dataPath = path.join(__dirname, '../../../build/android/data');
        await compressing.zip.compressDir(dataPath, zipPath);
        console.timeEnd('压缩');
        console.time('推送');
        await exec(`adb push ${zipPath}  /storage/emulated/0/CocosRemoteRenderService/`);
        console.timeEnd('推送');
        console.time('解压');
        await exec(`adb shell unzip -o /storage/emulated/0/CocosRemoteRenderService/data.zip -d /storage/emulated/0/CocosRemoteRenderService/`);
        console.timeEnd('解压');
        const cmd = `adb shell am force-stop com.tinnove.renderclient.carcenter && ` +
            `adb shell am force-stop com.tinnove.renderclient.nid &&` +
            `adb shell am force-stop com.tinnove.renderclient.apa &&` +
            `adb shell am force-stop com.tinnove.renderserver &&` +
            `adb shell am force-stop com.wt.renderclientdemo &&` +
            `adb shell am force-stop com.wt.renderclientdemo.nid &&` +
            `adb shell am force-stop com.wt.renderclientdemo.apa &&` +
            `adb shell am force-stop com.wt.renderclientdemo.carcenter &&` +
            `adb shell settings put global is_assets 1`
        await exec(cmd);
        console.log("重启进程");
        await Editor.Dialog.info('推送成功');
    } else {
        console.warn("不推送data到设备");
    }
};
exports.onAfterBuild = onAfterBuild;
const unload = function () {
    return __awaiter(this, undefined, undefined, function* () {
        console.log(`[${PACKAGE_NAME}] Unload cocos plugin example in builder.`);
    });
};
exports.unload = unload;
const onError = function (o, e) {
    return __awaiter(this, undefined, undefined, function* () {
        console.warn(`${PACKAGE_NAME} run onError`);
    });
};
exports.onError = onError;
const onBeforeMake = function (o, e) {
    return __awaiter(this, undefined, undefined, function* () {
        console.log(`onBeforeMake: root: ${o}, options: ${e}`);
    });
};
exports.onBeforeMake = onBeforeMake;
const onAfterMake = function (o, e) {
    return __awaiter(this, undefined, undefined, function* () {
        console.log(`onAfterMake: root: ${o}, options: ${e}`);
    });
};
exports.onAfterMake = onAfterMake;
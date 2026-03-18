"use strict";

const {
    BrowserWindow,
    app,
    ipcMain,
    Menu,
    Tray,
    nativeImage,
    MenuItem,
    clipboard,
} = require("electron");
const remote = require("electron/remote");
const path = require("path");
const pcs = require("process");
const os = require("os");
const sizeOf = require('image-size');
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const sizeOfPromise = util.promisify(sizeOf);
const folder = "";
const dts = true;
let win;
let tray = null;
let mode = 0;
let unloaded = false;
const PKG_NAME = require("./package.json").name;
const PKG_VERSION = require("./package.json").version;
let fs = require("fs");
let _configPath = path.join(__dirname, "config.json");
let __parentConfig = path.join(__dirname, "../cocos-inspector-config.json");
function readConfig () {
    let _0x60c598 = "";
    if (fs.existsSync(__parentConfig)) {
        _0x60c598 = fs.readFileSync(__parentConfig, {
            encoding: "utf-8",
        });
    } else {
        _0x60c598 = fs.readFileSync(_configPath, {
            encoding: "utf-8",
        });
    }
    return JSON.parse(_0x60c598);
}
let config = readConfig();
let disableWebSec = Boolean(config.disableWebSec);
let dw = 0;
let dh = 0;
function changeDWH () {
    dw = config.simpleMode
        ? config.isPortrait
            ? config.size[0]
            : config.size[1]
        : 878;
    dh = config.simpleMode
        ? (config.isPortrait ? config.size[1] : config.size[0]) + 51
        : 600;
}
changeDWH();
let u = null;
let bigThan3_8_0 =
    Editor.App.version.localeCompare("3.8.0", undefined, {
        numeric: true,
    }) >= 0;


function findFilesInDir (startPath, filters) {
    let results = [];

    // 检查起始路径是否存在
    if (!fs.existsSync(startPath)) {
        console.log("Directory not found: " + startPath);
        return results;
    }

    const files = fs.readdirSync(startPath); // 同步读取起始路径下的文件和文件夹

    for (let i = 0; i < files.length; i++) {
        const filename = path.join(startPath, files[i]);
        const stat = fs.statSync(filename); // 获取文件或文件夹的状态信息

        if (stat.isDirectory()) {
            // 如果是文件夹，则递归查找
            results = results.concat(findFilesInDir(filename, filters));
        } else {
            // 检查文件是否符合扩展名过滤器中的一个
            const baseName = path.basename(filename);
            for (let filter of filters) {
                if (baseName.endsWith(filter) && baseName.length <= 42) {
                    results.push(path.basename(filename, path.extname(filename)))
                    // results.push(path.basename(filename).length);
                    break; // 匹配到一个扩展名后不再继续检查
                }
            }
        }
    }

    return results;
}
module.exports = {
    async load () {
        ipcMain.on(PKG_NAME + ":openTS", openTS);
        ipcMain.on(PKG_NAME + ":fetchIcon", fetchIcon);
        ipcMain.on(PKG_NAME + ":savePrefab", savePrefab);
        ipcMain.on(PKG_NAME + ":saveError", saveError);
        ipcMain.on(PKG_NAME + ":focusNode", focusNode);
        ipcMain.on(PKG_NAME + ":focusAsset", focusAsset);
        remote.Editor = Editor;
        try {
            u = await Editor.User.getData();
            if (!u.access_token) {
                Object.assign(u, await Editor.User.getUserToken());
            }
        } catch (_0x1ac724) { }
    },
    unload () {
        delete remote.Editor;
        unloaded = true;
        ipcMain.removeAllListeners(PKG_NAME + ":openTS");
        ipcMain.removeAllListeners(PKG_NAME + ":fetchIcon");
        ipcMain.removeAllListeners(PKG_NAME + ":savePrefab");
        ipcMain.removeAllListeners(PKG_NAME + ":saveError");
        ipcMain.removeAllListeners(PKG_NAME + ":focusNode");
        ipcMain.removeAllListeners(PKG_NAME + ":focusAsset");
    },
    methods: {
        previewMode () {
            if (unloaded) {
                return;
            }
            tryShowWindow(0);
        },
        async connect2Device () {
            const ip = "192.168.22.79";
            const cmd = `adb connect ${ip}:5555`;
            let { stdout } = await exec(cmd);
            if (stdout.includes("connected")) {
                await Editor.Dialog.info("已连接到设备");
            } else if (stdout.includes("failed")) {
                await Editor.Dialog.info("连接失败");
            }
        },
        async checkAssets () {
            const PROJECT_PATH = Editor.Project.path;
            const ASSETS_PATH = path.join(PROJECT_PATH, "assets");
            const MAIN_BUNDLE_PATH = path.join(PROJECT_PATH, "/build/android/data/assets/main");
            const RESOURCE_BUNDLE_PATH = path.join(PROJECT_PATH, "/build/android/data/assets/resources");
            const list = findFilesInDir(MAIN_BUNDLE_PATH, [".png"])
                .concat(findFilesInDir(RESOURCE_BUNDLE_PATH, [".png"]));
            list.forEach(async (uuid) => {
                const info = await Editor.Message.request("asset-db", "query-asset-info", uuid);
                const meta = await Editor.Message.request("asset-db", "query-asset-meta", uuid);
                if (!meta.userData?.compressSettings?.useCompressTexture) {
                    console.info("未开启压缩纹理: ", path.basename(info.file));
                }
                const dimensions = await sizeOfPromise(info.file);
                if (dimensions.width > 1024 || dimensions.height > 1024) { 
                    console.error(`${path.basename(info.file)} : ${dimensions.width} x ${dimensions.height}`);
                }else if(dimensions.width > 512 || dimensions.height > 512){
                    console.warn(`${path.basename(info.file)} : ${dimensions.width} x ${dimensions.height}`);
                }
            });
            
        },
        buildMobileMode () {
            if (unloaded) {
                return;
            }
            tryShowWindow(1);
        },
        buildDesktopMode () {
            if (unloaded) {
                return;
            }
            tryShowWindow(3);
        },
        openCustomPage () {
            if (unloaded) {
                return;
            }
            tryShowWindow(2);
        },
        refresh () {
            win?.webContents?.executeJavaScript("v?.refresh()");
        },
    },
};
let lastErrors = [];
function saveError (_0x2f3778, _0x263c16) {
    lastErrors.push(_0x263c16);
    if (lastErrors.length > 3) {
        lastErrors.splice(0, 1);
    }
}
async function fetchIcon (_0x3227ee, _0x52e889) {
    let _0x192f78 = await Editor.Message.request(
        "scene",
        "execute-scene-script",
        {
            name: PKG_NAME,
            method: "fetch-icon",
            args: [_0x52e889],
        },
    );
    win?.webContents?.executeJavaScript(
        'v.$set(v.iconMap, "' + _0x52e889 + "\",'" + _0x192f78 + "')",
    );
}
function openTS (_0xce2632, _0xb48424) {
    try {
        let _0x403497 = Editor.Utils.UUID.decompressUUID(_0xb48424);
        Editor.Message.request("asset-db", "open-asset", _0x403497);
    } catch (_0x5c2c13) {
        console.error(_0x5c2c13);
    }
}
function savePrefab (_0x4c387f, _0x536f1f) {
    Editor.Message.request("scene", "execute-scene-script", {
        name: PKG_NAME,
        method: "save-prefab-from-changes",
        args: [_0x536f1f],
    });
}
function focusNode (_0x5b66d6, _0x40b7d7) {
    let _0x4580ec = Editor.Selection.getSelected("node");
    Editor.Selection.unselect("node", _0x4580ec);
    Editor.Selection.select("node", _0x40b7d7);
}
function focusAsset (_0x246f16, _0x29dad1) {
    if (!Editor.Utils.UUID.isUUID(_0x29dad1)) {
        _0x29dad1 = "db://internal/default_materials/" + _0x29dad1 + ".mtl";
    }
    Editor.Message.broadcast("ui-kit:touch-asset", _0x29dad1);
    let _0x32500d = Editor.Selection.getSelected("asset");
    Editor.Selection.unselect("asset", _0x32500d);
    Editor.Selection.select("asset", _0x29dad1);
}
async function showWindow () {
    if (win) {
        win.show();
        win.webContents.executeJavaScript("v.switchMode(" + mode + ")");
        return;
    }
    win = new BrowserWindow({
        width: dw,
        height: dh,
        title: "Cocos Inspector v" + PKG_VERSION,
        backgroundColor: "#2e2c29",
        autoHideMenuBar: true,
        webPreferences: {
            useContentSize: true,
            enablePreferredSizeMode: false,
            preferredSizeMode: false,
            webviewTag: true,
            nodeIntegration: true,
            nodeIntegrationInSubFrames: true,
            enableRemoteModule: true,
            sandbox: false,
            devTools: dts,
            contextIsolation: false,
            webSecurity: !disableWebSec,
            resizable: !config.simpleMode,
            minimizable: !config.simpleMode,
            maximizable: !config.simpleMode,
            preload: path.join(__dirname, folder + "mainPreload.js"),
        },
    });
    try {
        win.setMenu(null);
        win.setMenuBarVisibility(false);
        win.setMenuBarVisibility = win.setMenu = function (_0x1d6e16) { };
    } catch (_0xf65086) { }
    win.on("resize", () => {
        try {
            win.webContents
                .executeJavaScript("setting.configDataForMain")
                .then(function (_0x1035a5) {
                    if (_0x1035a5) {
                        config = _0x1035a5;
                    }
                    changeDWH();
                    if (config.simpleMode && win.webContents) {
                        let _0x31b2b5 = win.getContentSize();
                        dw != _0x31b2b5[0];
                        if (dh != _0x31b2b5[1]) {
                            win.setContentSize(dw, dh);
                            if (dts) {
                                console.warn("fixed content size");
                            }
                        }
                    }
                });
        } catch (_0x157999) {
            console.error(_0x157999);
        }
    });
    win.on("ready-to-show", () => {
        if (!bigThan3_8_0) {
            let _0x27f43a = (
                `
      @font-face {
          font-family: 'editor-icon';
          src: url('` +
                Editor.App.path +
                `/node_modules/@editor/creator/dist/ui-kit/renderer/components/icon/iconfont.woff') format('woff');
      }
      `
            ).replaceAll("\n", "");
            win.webContents.executeJavaScript(
                'if(!window["st"]){let st = document.createElement("style");st.innerText="' +
                _0x27f43a +
                '";document.head.append(st);window["st"] = st;};1;',
            );
        } else {
            let _0x76aa3d = `
      .asset-icon::before {
          content: unset;
      }
      `.replaceAll("\n", "");
            win.webContents.executeJavaScript(
                'v.bigThan3_8_0 = true;if(!window["st"]){let st = document.createElement("style");st.innerText="' +
                _0x76aa3d +
                '";document.head.append(st);window["st"] = st;};1;',
            );
        }
        win.show();
    });
    win.on("closed", () => {
        win.destroy();
        win = null;
        if (tray) {
            tray.destroy();
        }
        tray = null;
    });
    let _0x3072e6 = folder + "index_low_electron.html";
    if (process.versions.electron.split(".")[0] >= 5) {
        _0x3072e6 = folder + "index.html";
    }
    let _0x404700 = await Editor.Message.request("server", "query-port");
    let _0x2435e9 = path.join(
        __dirname,
        _0x3072e6 + "?port=" + _0x404700 + "&mode=" + mode,
    );
    if (u) {
        let {
            cocos_uid: _0xb1f060,
            nickname: _0x1d26f8,
            access_token: _0x5c7b70,
        } = u;
        let _0x91860a = {
            cocos_uid: _0xb1f060,
            nickname: _0x1d26f8,
            access_token: _0x5c7b70,
        };
        for (let _0x256ade in _0x91860a) {
            _0x2435e9 += "&" + _0x256ade + "=" + _0x91860a[_0x256ade];
        }
    }
    win.loadURL("file://" + _0x2435e9);
}
function tryShowWindow (_0x86e7d9) {
    try {
        let _0x406800 = nativeImage.createFromPath(
            path.join(__dirname, "./icon.png"),
        );
        _0x406800 = _0x406800.resize({
            width: 16,
            height: 16,
        });
        if (tray) {
            tray.setImage(_0x406800);
        }
        if (!tray) {
            tray = new Tray(_0x406800);
            tray.on("click", function () {
                win.show();
            });
            let _0x3ba3e9 = new Menu();
            _0x3ba3e9.append(
                new MenuItem({
                    label: "Copy Last Errors",
                    click: function () {
                        clipboard.writeText(
                            lastErrors.join(`
______
`),
                        );
                    },
                }),
            );
            if (dts) {
                _0x3ba3e9.append(
                    new MenuItem({
                        label: "OpenDevTools",
                        click: function () {
                            if (win) {
                                win.webContents.openDevTools();
                            }
                        },
                    }),
                );
            }
            tray.setContextMenu(_0x3ba3e9);
        } else if (dts) {
            console.warn("has tray already!");
        }
    } catch (_0x31fdaa) {
        if (dts) {
            console.error(_0x31fdaa);
        }
    }
    mode = _0x86e7d9;
    try {
        showWindow();
    } catch (_0x95aedc) {
        console.error(_0x95aedc);
    }
}

"use strict";
let fs_1 = require("fs");
let path = require("path");
let pcs = require("process");
let os = require("os");
let {
    remote,
    ipcRenderer
} = require("electron");
var str = fs_1.readFileSync(path.join(__dirname, "aa.js"), {
    encoding: "utf-8"
});

var wv;
var dwv;
const PKG_NAME = require("./package.json").name;
const PKG_VERSION = require("./package.json").version;
const highElectron = process.versions.electron.split(".")[0] >= 5;
window.addEventListener("error", _0x5c4f5e => {
    let _0x5284da = [_0x5c4f5e.message, _0x5c4f5e.filename, _0x5c4f5e.lineno + ":" + _0x5c4f5e.colno];
    ipcRenderer.send(PKG_NAME + ":saveError", _0x5284da.join("\n"));
}, true);
window.addEventListener("unhandledrejection", _0x273e25 => {
    ipcRenderer.send(PKG_NAME + ":saveError", _0x273e25.reason);
}, true);
let {
    ebtRenderer,
    trackPageView,
    trackEvent
} = require("./tj");
const BAIDU_SITE_ID = "05b110c3fa1434bf87f433e39666f67c";
ebtRenderer(BAIDU_SITE_ID).then(function () {
    trackEvent("app", "open");
});
let isWindows = os.type().includes("Windows");
let a = location.search.slice(1).split("&");
let cocos_uid = a[2].split("=")[1];
let nickname = a[3].split("=")[1];
let access_token = btoa(a[4].split("=")[1]);
let setting = new Vue({
    el: "#setting",
    data: {
        isMuted: false,
        showFps: true,
        logCount: 3,
        retinaEnable: true,
        autoUpdateTree: true,
        displayAsFairyTree: false,
        hideFairyComContainer: false,
        syncNodeDetail: true,
        disableWebSec: false,
        showDevToolInTab: true,
        size: [320, 480],
        extraSizes: [],
        isPortrait: true,
        show: false,
        urlParams: "",
        customUrl: "",
        clearLogAfterRefresh: true,
        extensionFile: "",
        enableExtension: true,
        statisticing: false,
        statistics: null,
        sortCompProperties: {},
        simpleMode: false,
        orderNum: "xxxxx",
        showDc: false,
        showChildrenCount: false,
        openArrayLimit: 5,
        prefabFontSize: 1.15,
        useChinese: remote.app.getLocale() == "zh-CN",
        httpProxyServer: "",
        proxyBypassRules: "",
        openHttpProxy: false,
        propertyAlignLeft: false
    },
    watch: {
        httpProxyServer: function (_0x41fd88, _0x49f24d) {
            this.setProxy();
        },
        openHttpProxy: function (_0x227f0b, _0x3762be) {
            this.setProxy();
        },
        proxyBypassRules: function (_0x46eeae, _0x30f9ec) {
            this.setProxy();
        },
        showDevToolInTab: function (_0x470c08, _0x36e2f4) {
            v.syncBv();
        },
        show: function (_0x18f28e, _0x5d8b22) {
            if (!_0x18f28e) {
                // TOLOOK
                setTimeout(function () {
                    v.syncBv();
                }, 500);
            } else {
                v.syncBv();
            }
        }
    },
    async created () {
        let _0x3f6906 = readConfig();
        if (_0x3f6906) {
            Object.assign(this, _0x3f6906);
            this.show = false;
        }
        await this.$nextTick();
        if (this.enableExtension && this.extensionFile && this.extensionFile != "") {
            let _0x428d1c = fs_1.readFileSync(this.extensionFile, {
                encoding: "utf-8"
            });
            let {
                menu: {
                    node: _0x2b902e,
                    component: _0x559851
                }
            } = JSON.parse(_0x428d1c);
            if (_0x2b902e && _0x2b902e.length > 0) {
                nodeMenu.append(new MenuItem({
                    type: "separator"
                }));
                _0x2b902e.forEach(_0x29e445 => {
                    nodeMenu.append(new MenuItem({
                        label: _0x29e445[0],
                        click: function (_0x5a28c8) {
                            wv.executeJavaScript(_0x29e445[1] + "(__nd['" + menuId + "'])");
                            v.pushNormalLog(_0x5a28c8.label + (setting.useChinese ? "成功!" : " Success!"));
                        }
                    }));
                });
            }
            if (_0x559851 && _0x559851.length > 0) {
                comMenu.append(new MenuItem({
                    type: "separator"
                }));
                _0x559851.forEach(_0x78717f => {
                    comMenu.append(new MenuItem({
                        label: _0x78717f[0],
                        click: function (_0x5e56d1) {
                            wv.executeJavaScript(_0x78717f[1] + "(__getComp('" + v.selectedNode + "','" + compId + "'))");
                            v.pushNormalLog(_0x5e56d1.label + (setting.useChinese ? "成功!" : " Success!"));
                        }
                    }));
                });
            }
        }
    },
    computed: {
        w () {
            if (this.isPortrait) {
                return this.size[0];
            } else {
                return this.size[1];
            }
        },
        h () {
            if (this.isPortrait) {
                return this.size[1];
            } else {
                return this.size[0];
            }
        },
        webviewStyle () {
            let _0x5a000e = remote.getCurrentWindow();
            if (_0x5a000e) {
                let _0xdd738e = this.w + 546;
                let _0x6a1d0e = this.h + 45;
                if (this.simpleMode) {
                    _0xdd738e = this.w;
                } else if (os.type().includes("Windows")) {
                    _0xdd738e += 18;
                }
                if (this.simpleMode) {
                    if (_0x5a000e.isMaximized()) {
                        _0x5a000e.unmaximize();
                    }
                    if (_0x5a000e.isFullScreen()) {
                        _0x5a000e.setFullScreen(false);
                    }
                    _0x5a000e.setMinimumSize(_0xdd738e, _0x6a1d0e);
                    _0x5a000e.setMinimizable(false);
                    _0x5a000e.setResizable(false);
                    _0x5a000e.setMaximizable(false);
                    _0x5a000e.setContentSize(_0xdd738e, _0x6a1d0e);
                } else {
                    _0x5a000e.setMinimizable(true);
                    _0x5a000e.setResizable(true);
                    _0x5a000e.setMaximizable(true);
                    _0x5a000e.setMinimumSize(_0xdd738e, _0x6a1d0e + (isWindows ? 45 : 37));
                    let _0x5da30e = _0x5a000e.getContentSize();
                    _0x5a000e.setContentSize(Math.max(_0xdd738e, _0x5da30e[0]), Math.max(_0x6a1d0e, _0x5da30e[1]));
                }
            }
            return "width:" + this.w + "px;height:" + this.h + "px;min-width:" + this.w + "px;min-height:" + this.h + "px";
        },
        gamePanelStyle () {
            return "max-width:" + this.w + "px";
        },
        configDataForMain () {
            return {
                simpleMode: this.simpleMode,
                isPortrait: this.isPortrait,
                size: this.size
            };
        }
    },
    methods: {
        toggleFps () {
            this.showFps = !this.showFps;
            wv.executeJavaScript("__toggleFps(" + this.showFps + ")");
            this.saveToStorage("showFps");
        },
        toggleSnd () {
            let _0x2962a3 = wv.getWebContents ? wv.getWebContents() : remote.webContents.fromId(wv.getWebContentsId());
            this.isMuted = !this.isMuted;
            _0x2962a3.setAudioMuted(this.isMuted);
            this.saveToStorage("isMuted");
        },
        async setProxy () {
            if (!wc) {
                return;
            }
            let _0x2726b7 = wc.session;
            if (!_0x2726b7) {
                return;
            }
            _0x2726b7.closeAllConnections();
            if (this.openHttpProxy && this.httpProxyServer) {
                await _0x2726b7.setProxy({
                    mode: "fixed_servers",
                    proxyRules: this.httpProxyServer,
                    proxyBypassRules: this.proxyBypassRules
                });
            } else {
                await _0x2726b7.setProxy({
                    mode: "direct"
                });
            }
            _0x2726b7.forceReloadProxyConfig();
        },
        togglePortrait () {
            this.isPortrait = !this.isPortrait;
            this.syncPortrait();
        },
        syncPortrait () {
            this.saveToStorage();
            this.$nextTick().then(() => {
                wv.executeJavaScript("setTimeout(__resizeCvn,200)");
            });
            v.showResolutionSelector = false;
            v.syncBv();
        },
        toggleSimpleMode () {
            this.simpleMode = !this.simpleMode;
            this.saveToStorage();
        },
        toggleSortComp (_0x52afb1) {
            this.sortCompProperties[_0x52afb1] = this.sortCompProperties[_0x52afb1] ? 0 : 1;
            this.saveToStorage("toggleSortComp");
        },
        toggleDc () {
            this.showDc = !this.showDc;
            wv.executeJavaScript("__toggleDC()");
            this.saveToStorage();
        },
        toggleChildrenCount () {
            this.showChildrenCount = !this.showChildrenCount;
            this.saveToStorage();
        },
        toggleStatistic () {
            this.statisticing = !this.statisticing;
            wv.executeJavaScript("__startStatistic(" + this.statisticing + ")");
        },
        initMv (_0x33396a = {}) {
            let _0x47dcdb = "__showFps=" + this.showFps + ";__dc=" + this.showDc + ";__autoUpdateTree=" + this.autoUpdateTree + ";__syncNodeDetail=" + this.syncNodeDetail + ";";
            for (let _0x4b7a79 in _0x33396a) {
                const _0x3435f9 = _0x33396a[_0x4b7a79];
                if (typeof _0x3435f9 == "string") {
                    _0x47dcdb += _0x4b7a79 + "='" + _0x3435f9 + "';";
                } else {
                    _0x47dcdb += _0x4b7a79 + "=" + _0x3435f9 + ";";
                }
            }
            _0x47dcdb += `var dectedCC = setInterval(function(){
                if(!window["cc"]){
                    return
                }
                clearInterval(dectedCC)
                cc.director.once(cc.Director.EVENT_BEFORE_SCENE_LAUNCH,function(){
                    // if(!__moreThen3_4_0()){
                        try{
                        let ort = cc.view.enableRetina;
                        cc.view.enableRetina = function(b){ort.call(cc.view, ` + this.retinaEnable + `)}
                    }catch(e){}
                    // }
                })
            }, 10)
                `;
            wv.executeJavaScript(_0x47dcdb);
            return _0x47dcdb;
        },
        changeSetting () {
            try {
                if (this.autoUpdateTree && v.canUpdateTree) {
                    v.forceUpdateTree();
                }
                wv.executeJavaScript("__autoUpdateTree=" + this.autoUpdateTree + ";__syncNodeDetail=" + this.syncNodeDetail + ";");
            } catch (_0x462d90) { }
        },
        saveToStorage (_0x57275d) {
            this.changeSetting();
            saveConfig(this.$data);
            this.$emit(_0x57275d || "settingSize_change");
        },
        close () {
            this.show = false;
        }
    }
});
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const BrowserView = remote.BrowserView;
let appMenu = new Menu();
appMenu.append(new MenuItem({
    label: setting.useChinese ? "开关迷你模式" : "Toggle Mini Mode",
    click: function () {
        setting.toggleSimpleMode();
    }
}));
appMenu.append(new MenuItem({
    type: "separator"
}));
appMenu.append(new MenuItem({
    label: setting.useChinese ? "切换横/竖屏" : "Rotate Portrait/Landscape",
    click: function () {
        setting.togglePortrait();
    }
}));
appMenu.append(new MenuItem({
    label: setting.useChinese ? "自定义分辨率" : "Custom Resolution",
    click: function () {
        v.showResolutionSelector = !v.showResolutionSelector;
    }
}));
appMenu.append(new MenuItem({
    type: "separator"
}));
appMenu.append(new MenuItem({
    label: setting.useChinese ? "清除缓存" : "Clear Cache",
    submenu: [new MenuItem({
        label: setting.useChinese ? "清除Http缓存" : "Clear Http Cache",
        click: function (_0x54cad2) {
            if (wc) {
                let _0x1a8dd2 = wc.session;
                _0x1a8dd2.clearCache();
                v.pushNormalLog(_0x54cad2.label + (setting.useChinese ? "成功!" : " Success!"));
            }
        }
    }), new MenuItem({
        label: setting.useChinese ? "清除LocalStorage" : "Clear LocalStorage",
        click: function (_0x1999df) {
            if (wc) {
                let _0x2fc595 = wc.session;
                _0x2fc595.clearStorageData({
                    storages: ["localstorage"]
                });
                v.pushNormalLog(_0x1999df.label + (setting.useChinese ? "成功!" : " Success!"));
            }
        }
    }), new MenuItem({
        label: setting.useChinese ? "清除Cookies" : "Clear Cookies",
        click: function (_0x1e152b) {
            if (wc) {
                let _0x32438c = wc.session;
                _0x32438c.clearStorageData({
                    storages: ["cookies"]
                });
                v.pushNormalLog(_0x1e152b.label + (setting.useChinese ? "成功!" : " Success!"));
            }
        }
    }), new MenuItem({
        type: "separator"
    }), new MenuItem({
        label: setting.useChinese ? "清除全部" : "Clear All Cache",
        click: function (_0x31e9c0) {
            if (wc) {
                let _0x129da8 = wc.session;
                _0x129da8.clearStorageData({
                    storages: ["localstorage", "cookies"]
                });
                _0x129da8.clearCache();
                v.pushNormalLog(_0x31e9c0.label + (setting.useChinese ? "成功!" : " Success!"));
            }
        }
    })]
}));
appMenu.append(new MenuItem({
    label: setting.useChinese ? "打开开发者工具" : "Open DevTools",
    click: function () {
        if (!setting.showDevToolInTab) {
            v.openWvDevTool();
        } else {
            if (setting.simpleMode) {
                setting.toggleSimpleMode();
            }
            v.openDevToolsTab();
        }
    },
    accelerator: "CommandOrControl+P"
}));
appMenu.append(new MenuItem({
    type: "separator"
}));
appMenu.append(new MenuItem({
    label: setting.useChinese ? "帮助" : "Help",
    click: function () {
        v.showHelp();
    }
}));
appMenu.append(new MenuItem({
    label: setting.useChinese ? "设置" : "Setting",
    click: function () {
        v.showSetting();
    },
    accelerator: isWindows ? "Ctrl+," : "Command+,"
}));
let debug = false;
try {
    let awc = remote.getCurrentWindow().webContents;
    debug = awc.getWebPreferences().devTools;
    if (debug) {
        appMenu.append(new MenuItem({
            type: "separator"
        }));
        appMenu.append(new MenuItem({
            label: setting.useChinese ? "打开App开发者工具" : "Open App DevTools",
            click: function () {
                awc.openDevTools();
            }
        }));
        appMenu.append(new MenuItem({
            label: setting.useChinese ? "打开DevTools开发者工具" : "Open DevTools of DevTools",
            click: function () {
                dwc.openDevTools();
            }
        }));
    }
} catch (_0x188531) { }
let menuId;
let menuNode;
let nodeMenu = new Menu();
nodeMenu.append(new MenuItem({
    label: setting.useChinese ? "开启/关闭节点" : "Toggle",
    click: function () {
        wv.executeJavaScript("__toggleNode('" + menuId + "')");
    }
}));
nodeMenu.append(new MenuItem({
    label: setting.useChinese ? "移除节点" : "Remove",
    click: function () {
        wv.executeJavaScript("__removeNode('" + menuId + "')");
    },
    icon: remote.nativeImage.createFromPath(__dirname + "/delete.png").resize({
        width: 16
    })
}));
nodeMenu.append(new MenuItem({
    type: "separator"
}));
nodeMenu.append(new MenuItem({
    label: setting.useChinese ? "复制uuid" : "Copy uuid",
    click: function () {
        remote.clipboard.writeText(menuId);
    }
}));
nodeMenu.append(new MenuItem({
    label: setting.useChinese ? "打印节点路径" : "Print Path",
    click: async function () {
        let _0x2beae5 = await wv.executeJavaScript("__printPath('" + menuId + "')");
        v.pushNormalLog(_0x2beae5);
    }
}));
nodeMenu.append(new MenuItem({
    label: setting.useChinese ? "在全局变量中存储节点" : "Store in Global",
    click: async function () {
        let _0x2b3c0c = await wv.executeJavaScript("__storeInGlobal('" + menuId + "')");
        v.pushNormalLog(_0x2b3c0c);
    }
}));
nodeMenu.append(new MenuItem({
    label: setting.useChinese ? "锁定拖拽" : "Lock/Unlock Drag",
    click: function () {
        v.toggleDrag(menuId);
    }
}));
nodeMenu.append(new MenuItem({
    type: "separator"
}));
nodeMenu.append(new MenuItem({
    label: setting.useChinese ? "在此节点中搜索组件" : "Search Components from here",
    click: function () {
        searchVm.n = menuNode;
    },
    icon: remote.nativeImage.createFromPath(remote.nativeTheme?.shouldUseDarkColors ? __dirname + "/search.png" : __dirname + "/search_dark.png").resize({
        width: 16
    })
}));
nodeMenu.append(new MenuItem({
    label: setting.useChinese ? "开关此节点的自动更新" : "Toggle Auto Update Node",
    click: function () {
        wv.executeJavaScript("__donotAutoUpdate('" + menuId + "')");
    }
}));
nodeMenu.append(new MenuItem({
    type: "separator"
}));
nodeMenu.append(new MenuItem({
    id: "break",
    icon: remote.nativeImage.createFromPath(__dirname + "/thunder.png").resize({
        width: 16
    }),
    label: setting.useChinese ? "设定断点" : "Break On",
    submenu: [new MenuItem({
        label: "transform-changed",
        submenu: ["POSITION", "ROTATION", "SCALE"].map(_0x31f3cf => {
            return new MenuItem({
                label: _0x31f3cf,
                click: function () {
                    wv.executeJavaScript("__setBreakPoint('" + menuId + "', 'transform-changed', '" + _0x31f3cf + "')");
                }
            });
        })
    }), ...["size-changed", "color-changed", "child-removed", "child-added", "layer-changed", "sibling-order-changed", "active-in-hierarchy-changed"].map(_0x679d6 => {
        return new MenuItem({
            label: _0x679d6,
            click: function () {
                wv.executeJavaScript("__setBreakPoint('" + menuId + "', '" + _0x679d6 + "')");
            }
        });
    })]
}));
nodeMenu.append(new MenuItem({
    label: setting.useChinese ? "移除断点" : "Remove Break Points",
    click: function () {
        wv.executeJavaScript("__removeBreakPoint('" + menuId + "')");
    }
}));
nodeMenu.append(new MenuItem({
    label: setting.useChinese ? "移除所有断点" : "Remove All Break Points",
    click: function () {
        wv.executeJavaScript("__removeAllBreakPoint()");
    }
}));
nodeMenu.append(new MenuItem({
    type: "separator"
}));
nodeMenu.append(new MenuItem({
    label: setting.useChinese ? "在编辑器中选中节点/prefab资源" : "Select in Editor",
    click: async function () {
        let _0x2e62ae = await wv.executeJavaScript("__getPrefabUuid('" + menuId + "')");
        if (_0x2e62ae) {
            ipcRenderer.send(PKG_NAME + ":focusAsset", _0x2e62ae);
        } else {
            ipcRenderer.send(PKG_NAME + ":focusNode", menuId);
        }
    },
    icon: remote.nativeImage.createFromPath(__dirname + "/locate.png").resize({
        width: 16
    })
}));
nodeMenu.append(new MenuItem({
    label: setting.useChinese ? "尝试保存prefab修改至项目资源文件" : "Try Save Prefab Changes To Project(Beta)",
    click: async function () {
        let _0x5435e5 = await wv.executeJavaScript("__getPrefabChanges('" + menuId + "')");
        if (Object.keys(_0x5435e5).length == 0) {
            remote.dialog.showMessageBoxSync({
                message: setting.useChinese ? "没有任何修改" : "Nothing Changes"
            });
            return;
        } else {
            let _0x1c9a05 = showPrefabSaveDialog(remote.app.getLocale() == "zh-CN" ? 1 : 0);
            switch (_0x1c9a05) {
                case 0:
                    break;
                case 1:
                    ipcRenderer.send(PKG_NAME + ":savePrefab", _0x5435e5);
                    break;
            }
        }
    },
    icon: remote.nativeImage.createFromPath(__dirname + "/save.png").resize({
        width: 16
    })
}));
function showPrefabSaveDialog (_0x20249f = 0) {
    let _0x351318 = [`Sure Save Prefab? 

because this Operation may break your Prefab

 Please ensure your Prefab already in Version Control`, `确定要保存Prefab吗？

此操作可能会破坏你的Prefab,

请确定你的Prefab已经处于版本控制之中`];
    let _0x566273 = [["Cancel", "Save", "Chinese"], ["取消", "保存", "English"]];
    let _0x1b6a14 = remote.dialog.showMessageBoxSync({
        message: _0x351318[_0x20249f],
        buttons: _0x566273[_0x20249f],
        type: "warning",
        cancelId: 0,
        defaultId: 1
    });
    if (_0x1b6a14 == 2) {
        _0x20249f = _0x20249f == 0 ? 1 : 0;
        return showPrefabSaveDialog(_0x20249f);
    }
    return _0x1b6a14;
}
let compId;
let compCid;
let compName;
let comMenu = new Menu();
comMenu.append(new MenuItem({
    label: setting.useChinese ? "通过代码编辑器打开" : "Open By CodeEditor",
    click: function () {
        if (compCid.includes(".")) {
            v.pushWarnLog(compCid + "不可以打开");
            return;
        }
        ipcRenderer.send(PKG_NAME + ":openTS", compCid);
    },
    icon: remote.nativeImage.createFromPath(__dirname + "/code.png").resize({
        width: 16
    })
}));
comMenu.append(new MenuItem({
    type: "separator"
}));
comMenu.append(new MenuItem({
    label: setting.useChinese ? "移除" : "Remove",
    click: function () {
        wv.executeJavaScript("__removeComp('" + v.selectedNode + "','" + compId + "')");
    },
    icon: remote.nativeImage.createFromPath(__dirname + "/delete.png").resize({
        width: 16
    })
}));
comMenu.append(new MenuItem({
    label: setting.useChinese ? "字段排序" : "Fields Sort",
    click: function () {
        setting.toggleSortComp(compName);
    },
    icon: remote.nativeImage.createFromPath(__dirname + "/sort.png").resize({
        width: 16
    })
}));
comMenu.append(new MenuItem({
    type: "separator"
}));
comMenu.append(new MenuItem({
    label: setting.useChinese ? "在全局变量中存储该组件实例" : "Store in Global",
    click: async function () {
        let _0x586147 = await wv.executeJavaScript("__storeCompInGlobal('" + v.selectedNode + "','" + compId + "')");
        v.pushNormalLog(_0x586147);
    }
}));
comMenu.append(new MenuItem({
    label: setting.useChinese ? "在场景中搜索同名组件" : "Search in Scene",
    click: function () {
        searchVm.startSearch(compName.replaceAll("<", "").replaceAll(">", ""));
    }
}));
let propertyName;
let proMenu = new Menu();
proMenu.append(new MenuItem({
    label: setting.useChinese ? "复制访问代码" : "Copy Access Code",
    click: async function () {
        let _0x3e4e84 = await wv.executeJavaScript("__getPathByid('" + v.selectedNode + "')");
        if (compCid.startsWith("cc.")) {
            compName = compCid;
        }
        let _0x345d68 = "cc.find('" + _0x3e4e84 + "').getComponent('" + compName + "')." + propertyName + " = ";
        remote.clipboard.writeText(_0x345d68);
    }
}));
proMenu.append(new MenuItem({
    label: setting.useChinese ? "复制访问代码2" : "Copy Access Code 2",
    click: async function () {
        if (compCid.startsWith("cc.")) {
            compName = compCid;
        }
        let _0x4a2be9 = "cc.director.getScene().getComponentInChildren('" + compName + "')." + propertyName + " = ";
        remote.clipboard.writeText(_0x4a2be9);
    }
}));
let treeMenu = new Menu();
treeMenu.append(new MenuItem({
    label: setting.useChinese ? "开启关闭DrawCall分析模式（beta)" : "Toggle Draw Call (beta)",
    click: function () {
        setting.toggleDc();
    }
}));
treeMenu.append(new MenuItem({
    label: setting.useChinese ? "开启关闭3d节点的Root节点" : "Toggle Root Node of 3D Node",
    click: function () {
        v.hide3dRootNode = !v.hide3dRootNode;
    }
}));
treeMenu.append(new MenuItem({
    label: setting.useChinese ? "开启关闭子节点数量的显示" : "Toggle Children Count",
    click: function () {
        setting.toggleChildrenCount();
    }
}));
treeMenu.append(new MenuItem({
    type: "separator"
}));
treeMenu.append(new MenuItem({
    label: setting.useChinese ? "显示场景属性" : "Show Scene Properties",
    click: function () {
        v.toggleSceneDetail();
    }
}));
treeMenu.append(new MenuItem({
    type: "separator"
}));
treeMenu.append(new MenuItem({
    label: setting.useChinese ? "强制刷新一次节点树" : "Force Refresh Node Tree Once",
    click: function () {
        wv.executeJavaScript("__readyUpdateTree(true);");
    },
    icon: remote.nativeImage.createFromPath(__dirname + "/refresh.png").resize({
        width: 16
    })
}));
let widgetSort = (_0x51123a, _0x2da454) => _0x2da454.split("").reverse().join("").localeCompare(_0x51123a.split("").reverse().join(""));
let comSet = new Set(["cid", "uuid", "name", "enabled", "isCC_COM", "packageItem", "node", "__methods___"]);
Vue.component("NodeComponent", {
    props: {
        com: Object
    },
    data () {
        return {
            filterStr: "",
            sort: false
        };
    },
    created () {
        let _0x360ae4 = this;
        this.fupdate = function () {
            if (setting.sortCompProperties[_0x360ae4.comName] == undefined) {
                setting.sortCompProperties[_0x360ae4.comName] = _0x360ae4.sort = _0x360ae4.defaultSort;
            } else {
                _0x360ae4.sort = Boolean(setting.sortCompProperties[_0x360ae4.comName]);
            }
        };
        setting.$on("toggleSortComp", this.fupdate);
        this.fupdate();
    },
    beforeDestroy () {
        setting.$off("toggleSortComp", this.fupdate);
    },
    computed: {
        comName () {
            let _0x3637c4 = this.com.name;
            if (!this.com.isCC_COM || this.com.isScene) {
                return _0x3637c4;
            }
            return "<" + _0x3637c4.split("<")[1];
        },
        defaultSort () {
            return true;
        },
        afterFilters () {
            let _0x3bc420 = this.sort ? widgetSort : undefined;
            if (this.filterStr.trim() == "") {
                return Object.keys(this.com).sort(_0x3bc420).filter(_0x5ee9e9 => {
                    if (this.com.isScene) {
                        if (_0x5ee9e9 == "isScene") {
                            return false;
                        }
                        if (_0x5ee9e9 == "enabled") {
                            return true;
                        }
                    }
                    return !comSet.has(_0x5ee9e9);
                });
            } else {
                return Object.keys(this.com).sort(_0x3bc420).filter(_0x4a625e => {
                    if (this.com.isScene) {
                        if (_0x4a625e == "isScene") {
                            return false;
                        }
                        if (_0x4a625e == "enabled") {
                            return true;
                        }
                    }
                    return !comSet.has(_0x4a625e) && _0x4a625e.toLowerCase().includes(this.filterStr.toLowerCase());
                });
            }
        },
        showSearch () {
            return Object.keys(this.com).length > 10;
        },
        checkVisible () {
            if (this.com.isCC_COM && !this.com.isScene) {
                return "visible";
            } else {
                return "hidden";
            }
        }
    },
    methods: {
        showMenu2 () {
            compId = this.com.uuid;
            compCid = this.com.cid;
            compName = this.comName;
            let _0x1f4ba4 = this.com.__methods___;
            if (_0x1f4ba4.length > 0) {
                let _0x2458aa = this;
                let _0x5832a1 = Menu.buildFromTemplate(comMenu.items);
                _0x5832a1.append(new MenuItem({
                    type: "separator"
                }));
                _0x1f4ba4.forEach(_0x3425be => {
                    _0x5832a1.append(new MenuItem({
                        label: _0x3425be + "()",
                        click: function () {
                            _0x2458aa.execCompMethod(_0x3425be);
                        }
                    }));
                });
                _0x5832a1.popup(remote.getCurrentWindow());
                return;
            } else {
                comMenu.popup(remote.getCurrentWindow());
            }
        },
        showProMenu (_0x5e726c) {
            if (typeof _0x5e726c == "number") {
                return;
            }
            compName = this.com.name.split("<")[1].slice(0, -1);
            propertyName = _0x5e726c;
            compCid = this.com.cid;
            proMenu.popup(remote.getCurrentWindow());
        },
        execCompMethod (_0x214f46) {
            wv.executeJavaScript("__execCompMethod('" + v.selectedNode + "','" + this.com.uuid + "','" + _0x214f46 + "')");
        },
        toggleComp () {
            wv.executeJavaScript("__toggleComp('" + v.selectedNode + "','" + this.com.uuid + "')");
        },
        setKV (_0x5c7a4c, _0x2f9eaa, _0x5af667) {
            this.com[_0x5c7a4c][0] = _0x2f9eaa;
            _0x2f9eaa = typeof _0x2f9eaa == "string" ? "`" + _0x2f9eaa + "`" : _0x2f9eaa;
            if (this.com.isScene) {
                wv.executeJavaScript("__setSceneComAttr('" + this.com.name + "','" + _0x5c7a4c + "'," + _0x2f9eaa + ")");
                return;
            }
            wv.executeJavaScript("__setComAttr('" + v.selectedNode + "','" + this.com.uuid + "','" + _0x5c7a4c + "'," + _0x2f9eaa + "," + _0x5af667 + ")");
        }
    },
    template: `
    <div class="Component">        
        <div style="height:1em;"></div>
        <div class="nodeName">
            <label>
                <!-- @change="syncNode('active')" -->
                <input :style="{visibility:checkVisible}" @change="toggleComp" type="checkbox"  v-model="com.enabled" />
                {{comName}}       
            </label>
            <!-- @click.stop="toggleNode()" :style="iconTransform" -->
            <span style="flex:1"></span>
            <span v-if="com.isCC_COM && !com.isScene" @click.prevent="showMenu2" class="iconfont icon-menu"></span>
        </div>
        <!-- <hr> -->
        <!-- @change="syncNode('active')"  -->
        <input v-if="!com.isScene" :placeholder="setting.useChinese?'过滤属性':'filter properties'" type="search" v-model="filterStr" v-if="showSearch"/>
        <com-property v-for="k in afterFilters" :showProMenu="showProMenu" :param="com[k][2]" :setKV="setKV" :k="k" :val="com[k][0]" :t="com[k][1]" :isc="com.isCC_COM" :key="com+k"></com-property>                            
    </div>
    `
});
Vue.component("ComProperty", {
    props: ["k", "val", "t", "isc", "setKV", "param", "showProMenu"],
    created () {
        this.vl = this.val;
        if (this.isEnum) {
            this.vl = this.param.find(_0x5dbcbf => {
                return _0x5dbcbf.value == this.val.value;
            });
        }
        this.link = this.canLink();
        if (this.isArray && this.vl.length <= setting.openArrayLimit) {
            this.arrayClose = false;
        }
    },
    data () {
        return {
            link: null,
            vl: null,
            numberEdit: false,
            arrayClose: true
        };
    },
    methods: {
        canLink () {
            let _0x5a21c0 = this.vl;
            if (typeof _0x5a21c0 == "string") {
                if (_0x5a21c0.includes(":@") && _0x5a21c0.includes("|")) {
                    if (_0x5a21c0.includes("||")) {
                        let _0x442b85 = _0x5a21c0.split("||");
                        let _0x201cab = _0x442b85[0].split(":@")[0];
                        let _0x280485 = _0x442b85[0].split(":@")[1];
                        let _0x2b9354 = _0x442b85[1];
                        if (_0x201cab == "MaterialVariant") {
                            _0x201cab = "Material";
                        }
                        if (_0x201cab == "TTFFont") {
                            _0x201cab = "TtfFont";
                        }
                        if (_0x201cab != "Asset" && _0x201cab.endsWith("Asset")) {
                            _0x201cab = _0x201cab.replace("Asset", "");
                        }
                        let _0x4262f9 = _0x201cab.replace(/([A-Z])/g, function (_0x24b006) {
                            return "-" + _0x24b006;
                        }).slice(1).toLowerCase();
                        if (_0x201cab == "Texture2D" || _0x201cab == "SpriteFrame") {
                            _0x4262f9 = "image";
                        }
                        return {
                            icon: _0x4262f9,
                            name: _0x280485,
                            uuidPath: _0x2b9354,
                            type: "asset",
                            subType: _0x201cab
                        };
                    } else {
                        let _0x12f160 = _0x5a21c0.split("|");
                        let _0x269e0e = _0x12f160[0];
                        let _0x43c0a8 = _0x12f160[1].split("//");
                        if (_0x43c0a8.slice(-1)[0] == v.selectedNode) {
                            let _0x17dfcc = _0x269e0e.split(":@");
                            _0x17dfcc.pop();
                            _0x17dfcc.push("[self]");
                            _0x269e0e = _0x17dfcc.join(":@");
                        }
                        if (this.t != "comp") {
                            _0x269e0e = _0x269e0e.split(":@")[1];
                            return {
                                icon: v.bigThan3_8_0 ? "coordinates-local" : "cube",
                                name: _0x269e0e,
                                uuidPath: _0x43c0a8,
                                type: this.t
                            };
                        } else {
                            return {
                                icon: "component",
                                iconValue: _0x269e0e.split(":@")[0],
                                name: _0x269e0e,
                                uuidPath: _0x43c0a8,
                                type: this.t
                            };
                        }
                    }
                }
            }
            return null;
        },
        toggleArray () {
            this.arrayClose = !this.arrayClose;
        },
        onIconErr () {
            this.link.icon = "file";
        },
        locate () {
            switch (this.link.type) {
                case "node":
                case "comp":
                    v.locateNode(this.link.uuidPath);
                    break;
                case "asset":
                    ipcRenderer.send(PKG_NAME + ":focusAsset", this.link.uuidPath);
                    break;
            }
        },
        clickBool () {
            if (!this.isc) {
                return;
            }
            this.vl = !this.vl;
            this.setKV(this.k, this.vl);
        },
        changeColor () {
            this.setKV(this.k, this.vl);
        },
        changeEnum () {
            this.setKV(this.k, this.vl.value);
        },
        changeNumber () {
            this.setKV(this.k, Number(this.vl));
        },
        changeString () {
            this.setKV(this.k, this.vl);
        },
        setArrayKV (_0x1b61ef, _0x105cd7) {
            if (this.isArray && typeof _0x1b61ef == "number") {
                this.setKV(this.k, _0x1b61ef, _0x105cd7);
            }
        },
        closeNumberEdit () {
            this.numberEdit = false;
        },
        openNumberEdit () {
            this.numberEdit = true;
            this.$nextTick().then(() => {
                this.$refs.numInput?.focus();
            });
        }
    },
    computed: {
        iconTransform () {
            let _0x46d007 = this.arrayClose ? "transform:rotate(90deg)" : "transform:rotate(180deg)";
            return "display: inline-block;" + _0x46d007;
        },
        isColor () {
            if (this.t == "color") {
                return true;
            }
            if (typeof this.vl != "string") {
                return false;
            }
            return this.vl.startsWith("Color:rgba(");
        },
        isEnum () {
            return this.t == "enum";
        },
        isArray () {
            return this.t == "array";
        },
        color () {
            return "background:" + this.vl;
        },
        isBool () {
            return typeof this.vl == "boolean";
        },
        isTrue () {
            return this.vl === true;
        },
        isFalse () {
            return this.vl === false;
        },
        isNumber () {
            return this.t == "number";
        },
        isString () {
            return this.t == "string";
        },
        transStr () {
            return this.vl.replace(/\n/g, "\\n");
        },
        isNormal () {
            return !this.isString && !this.isNumber && !this.isEnum && !this.isColor && !this.isBool && !this.link && !this.isArray;
        },
        boolIcon () {
            if (this.isTrue) {
                return "iconfont icon-right";
            } else {
                return "iconfont icon-wrong2";
            }
        },
        linkTitle () {
            if (this.link.uuidPath == "null") {
                if (this.link.type == "asset") {
                    if (setting.useChinese) {
                        return this.link.subType + "类型属性值为空";
                    } else {
                        return "value of property:" + this.link.subType + " is null";
                    }
                } else {
                    if (this.link.type == "node") {
                        if (setting.useChinese) {
                            return "此节点类型属性值为空";
                        } else {
                            return "value of property:node is null";
                        }
                    }
                    if (this.link.type == "comp") {
                        if (setting.useChinese) {
                            return "此" + this.link.name.split(":@")[0] + "类型属性值为空";
                        } else {
                            return "value of property:" + this.link.name.split(":@")[0] + " is null";
                        }
                    }
                }
            }
            if (this.link.type == "node") {
                if (setting.useChinese) {
                    return "点击可在节点树中定位此节点类型属性";
                } else {
                    return "click to locate node in tree";
                }
            }
            if (this.link.type == "comp") {
                if (setting.useChinese) {
                    return "点击可在节点树中定位此组件所在节点";
                } else {
                    return "click to locate component's node in tree";
                }
            }
            if (this.link.type == "asset") {
                if (setting.useChinese) {
                    return "点击可在CocosCreator中定位此" + this.link.subType + "资源";
                } else {
                    return "click to select the " + this.link.subType + " asset in editor";
                }
            }
        },
        splitTitle () {
            const _0x45215a = this.k;
            if (typeof _0x45215a == "number") {
                return _0x45215a;
            }
            return _0x45215a[0].toUpperCase() + _0x45215a.slice(1);
            const _0x4b70f8 = _0x45215a[0];
            _0x45215a = _0x45215a.slice(1);
            return _0x4b70f8.toUpperCase() + _0x45215a.replace(/([A-Z])/g, function (_0x4daad1) {
                return "" + _0x4daad1;
            });
        },
        pcls () {
            return "comProperty " + (setting.propertyAlignLeft ? "alignLeft" : "alignRight");
        },
        linkIconCls () {
            return "asset-icon asset-icon-" + this.link.icon;
        },
        iconSvg () {
            if (v.bigThan3_8_0) {
                if (v.iconMap[this.link.icon]) {
                    return v.iconMap[this.link.icon];
                } else {
                    ipcRenderer.send(PKG_NAME + ":fetchIcon", this.link.icon);
                    return "";
                }
            } else {
                return "";
            }
        },
        isNullLink () {
            return this.link && this.link.uuidPath == "null";
        },
        isLink () {
            return this.link && this.link.uuidPath != "null";
        }
    },
    template: `
    <div :class="pcls">
        <div class="nodePropertyTitle" @contextmenu.stop="showProMenu(k)">{{splitTitle}}</div>   
        <!-- <spacer /> -->
        <div v-if="isColor" class="nodePropertySubTitle">                        
            <span v-if="!isc" :style="color" class="colorRect"></span>
            <input v-if="isc" @input="changeColor" type="color" v-model="vl" />
            <span >{{vl}}</span>   
        </div>
        <div v-if="isEnum && isc" class="nodePropertySubTitle">   
            <select v-model="vl" @change="changeEnum">
                <option v-for="p in param" :value="p">{{p.name}}</option>
            </select>
        </div>
        <div v-if="isEnum && !isc" class="nodePropertySubTitle prewrap">{{vl.value}}</div>
        <div v-if="isNumber" class="nodePropertySubTitle" >     
            <div v-if="!numberEdit" @click.stop="openNumberEdit" style="color:lightblue">{{vl}}</div> 
            <input ref="numInput" @blur="closeNumberEdit" @keyup.esc.stop="closeNumberEdit" @keyup.enter.stop="closeNumberEdit" v-if="numberEdit" type="number" v-model="vl" @input="changeNumber" />
        </div>

        <div v-if="isString" class="nodePropertySubTitle" >     
            <span v-if="!numberEdit" @click.stop="openNumberEdit">{{ transStr }}</span> 
            <!-- <input ref="numInput" @blur="closeNumberEdit" @keyup.esc.stop="closeNumberEdit" @keyup.enter.stop="closeNumberEdit" v-if="numberEdit" type="text" v-model="vl" @input="changeString" /> -->
            <textarea ref="numInput" @blur="closeNumberEdit" @keyup.esc.stop="closeNumberEdit" v-if="numberEdit" v-model="vl" @input="changeString" ></textarea>
        </div>

        <div v-if="isBool" class="nodePropertySubTitle" @click.stop="clickBool">     
            <span :class="boolIcon" ></span> 
        </div>
        <div v-if="isNormal" class="nodePropertySubTitle prewrap">{{String(vl)}}</div>
        <a v-if="isLink" :title="linkTitle"  class="nodePropertySubTitle prewrap" @click.stop="locate()"><span color="true" :class="linkIconCls" @error="onIconErr" v-html="iconSvg"></span>{{link.name}}</a>
        <span v-if="isNullLink" :title="linkTitle" style="color:gray"><span color="true" :class="linkIconCls" @error="onIconErr" v-html="iconSvg"></span>{{link.name}}</span>
        <div class="nodePropertySubTitle" v-if="isArray" >
            <div style="cursor:pointer" @click.stop="toggleArray()" :title="setting.useChinese?'点击可开关数组':'click to toggle Array'">array[{{vl.length}}]
                <span :style="iconTransform"  class="nodearrow iconfont icon-shangsanjiao"></span>
            </div>            
            <div class="arrayItems" v-if="isArray && !arrayClose">
            <com-property v-for="(vi,idx) in vl" :showProMenu="showProMenu" :param="vi[2]" :setKV="setArrayKV" :k="idx" :val="vi[0]" :t="vi[1]" :isc="isc" :key="vi+idx"></com-property>
            </div>
        </div> 
    </div>
    `
});
Vue.component("Ad", {
    computed: {
        isMac () {
            return os.type().toLowerCase() == "darwin";
        },
        linkAddr () {
            if (remote.app.getLocale() == "zh-CN") {
                return "https://apps.apple.com/cn/app/id1644620502?mt=12&l=zh";
            } else {
                return "https://apps.apple.com/app/id1644620502?mt=12&l=en";
            }
        },
        title () {
            if (remote.app.getLocale() == "zh-CN") {
                return "船神浏览器";
            }
            return "Browser Chuan";
        }
    },
    methods: {
        clickAd () {
            remote.shell.openExternal(this.linkAddr);
        }
    },
    template: `
    <div v-show="isMac" style="font-size: 12px;">
    <!-- <div style="font-size: 12px;margin-top: auto;color: rgba(28, 150, 249, 0.579);">ad: 船神浏览器</div> -->
    ad:<a @click.stop="clickAd" style="color: gray">{{title}}</a>
    </div>
    `
});
let opset = new Set(["+", "-", "/", "*"]);
Vue.component("NodeDetailView", {
    props: {
        detail: Object
    },
    data () {
        return {
            close: false,
            nanStr: "",
            inputingK: "",
            left: 0,
            top: 0
        };
    },
    computed: {
        iconTransform () {
            let _0x3bc5b5 = this.close ? "transform:rotate(90deg)" : "transform:rotate(180deg)";
            return "display: inline-block;" + _0x3bc5b5;
        },
        nanStrStyle () {
            return "position:fixed;left:" + this.left + ";top:" + this.top + ";";
        },
        nodePropertyTitle () {
            return "nodePropertyTitle " + (setting.propertyAlignLeft ? "alignLeft" : "alignRight");
        }
    },
    methods: {
        toggleNode () {
            this.close = !this.close;
        },
        onKeydown (_0x19f88a) {
            let _0x317760 = _0x19f88a.target;
            let _0x378561 = _0x317760.offsetParent;
            this.left = _0x317760.offsetLeft + _0x378561.offsetLeft;
            this.top = _0x317760.offsetTop + _0x378561.offsetTop - _0x317760.offsetHeight;
            if (opset.has(_0x19f88a.key)) {
                this.nanStr += _0x19f88a.key;
                _0x19f88a.preventDefault();
                return false;
            }
            if (this.nanStr.length > 0) {
                if (_0x19f88a.key == "Enter") {
                    this.calc();
                    _0x19f88a.preventDefault();
                    return false;
                }
                if (_0x19f88a.key == "Backspace") {
                    this.nanStr = this.nanStr.slice(0, this.nanStr.length - 2);
                } else if (!isNaN(_0x19f88a.key) || _0x19f88a.key == ".") {
                    this.nanStr += _0x19f88a.key;
                }
                _0x19f88a.preventDefault();
                return false;
            }
        },
        calc () {
            if (this.nanStr.length == 0) {
                return;
            }
            let _0x17dc25 = this.inputingK.split(".");
            let _0x2af332 = _0x17dc25.length > 1 ? this.detail[_0x17dc25[0]][_0x17dc25[1]] : this.detail[_0x17dc25[0]];
            let _0x57a94c = eval(_0x2af332 + this.nanStr);
            if (!isNaN(_0x57a94c)) {
                if (_0x17dc25.length > 1) {
                    this.detail[_0x17dc25[0]][_0x17dc25[1]] = _0x57a94c;
                } else {
                    this.detail[_0x17dc25[0]] = _0x57a94c;
                }
                this.syncNode(this.inputingK);
            }
            this.nanStr = "";
        },
        startInput (_0x16e211) {
            this.inputingK = _0x16e211;
        },
        endInput () {
            this.inputingK = "";
            this.nanStr = "";
        },
        syncNode (_0x47518f, _0x509e15) {
            this.nanStr = "";
            let _0x1685e5 = _0x47518f.split(".");
            let _0x52a296 = _0x1685e5.length > 1 ? this.detail[_0x1685e5[0]][_0x1685e5[1]] : this.detail[_0x1685e5[0]];
            let _0x2bc409 = this.detail.id;
            if (typeof _0x52a296 == "string") {
                _0x52a296 = "'" + _0x52a296 + "'";
            }
            wv.executeJavaScript("__syncNode('" + _0x2bc409 + "','" + _0x47518f + "'," + _0x52a296 + ")");
        }
    },
    template: `
    <div class="nodeDetail" >
    <div class="nanStr" :style="nanStrStyle" v-show="nanStr.length>0">{{nanStr}}</div>
        <div class="nodeName" v-if="detail.isScene">
            <label>                
            {{setting.useChinese?"场景：":"Scene:"}} {{detail.name}}   
            </label>
        </div>
        <div class="nodeName" v-if="!detail.isScene">
            <label>
                <input @change="syncNode('active')" type="checkbox" value="detail.name" v-model="detail.active" />
                {{setting.useChinese?"节点：":"Node:"}} {{detail.name}} {{setting.displayAsFairyTree&&detail.gobjName?":"+detail.gobjName:""}}         
            </label>
            <span style="flex:1"></span>
            <span @click.stop="toggleNode()" :style="iconTransform"  class="nodearrow iconfont icon-shangsanjiao"></span>
        </div>
    
    <!-- <hr> -->
    <div v-show="!close" class="nodeProperties" v-if="!detail.isScene">
    <div class="nodeProperty">
        <div :class="nodePropertyTitle">Position</div>
        <div class="nodePropertySubTitle">X</div>
        <!-- <input @input="syncNode('position.x',event)" @blur="endInput" @focus="startInput('position.x')" @keydown="onKeydown(event)" step="0.02" type="number" v-model.number="detail.position.x" /> -->
        ` + createInput("position.x", 0.02) + `
        <div class="nodePropertySubTitle">Y</div>
        <!-- <input @input="syncNode('position.y')" step="0.02" type="number" v-model="detail.position.y" /> -->
        ` + createInput("position.y", 0.02) + `
        <div class="nodePropertySubTitle">Z</div>
        <!-- <input @input="syncNode('position.z')" step="0.02" type="number" v-model="detail.position.z" /> -->
        ` + createInput("position.z", 0.02) + `
    </div>
    <div class="nodeProperty">
        <div :class="nodePropertyTitle">Rotation</div>
        <div class="nodePropertySubTitle">X</div>
        <!-- <input @input="syncNode('eulerAngles.x')" step="5" type="number" v-model="detail.eulerAngles.x" /> -->
        ` + createInput("eulerAngles.x", 5) + `
        <div class="nodePropertySubTitle">Y</div>
        <!-- <input @input="syncNode('eulerAngles.y')" step="5" type="number" v-model="detail.eulerAngles.y" /> -->
        ` + createInput("eulerAngles.y", 5) + `
        <div class="nodePropertySubTitle">Z</div>
        <!-- <input @input="syncNode('eulerAngles.z')" step="5" type="number" v-model="detail.eulerAngles.z" /> -->
        ` + createInput("eulerAngles.z", 5) + `
    </div>
    <div class="nodeProperty">
        <div :class="nodePropertyTitle">Scale</div>
        <div class="nodePropertySubTitle">X</div>
        <!-- <input @input="syncNode('scale.x')" step="0.02" type="number" v-model="detail.scale.x" /> -->
        ` + createInput("scale.x", 0.02) + `
        <div class="nodePropertySubTitle">Y</div>
        <!-- <input @input="syncNode('scale.y')" step="0.02" type="number" v-model="detail.scale.y" /> -->
        ` + createInput("scale.y", 0.02) + `
        <div class="nodePropertySubTitle">Z</div>
        <!-- <input @input="syncNode('scale.z')" step="0.02" type="number" v-model="detail.scale.z" /> -->
        ` + createInput("scale.z", 0.02) + `
    </div>
    
    <hr>
    
    <!-- <div class="nodeProperty">
        <div :class="nodePropertyTitle">Opacity</div>
        <input @input="syncNode('opacity')" min="0" max="255" type="range" v-model="detail.opacity" />
    </div> -->
    <div class="nodeProperty">
        <div :class="nodePropertyTitle">Layer</div>
        <div class="nodePropertySubTitle">{{detail.layer}}</div>
    </div>
    </div>
    </div>
    <
    `
});
function createInput (_0x44cf2e, _0x16039d) {
    return "<input @input=\"syncNode('" + _0x44cf2e + "')\" @blur=\"endInput\" @focus=\"startInput('" + _0x44cf2e + "')\" @keydown=\"onKeydown(event)\" step=\"" + _0x16039d + "\" type=\"number\" v-model.number=\"detail." + _0x44cf2e + "\" />";
}
Vue.component("CalcInput", {
    props: {
        detail: Function
    },
    template: `
    <input @input="syncNode('position.x')" step="0.02" type="number" v-model="detail.position.x" />
    `
});
let searchVm;
Vue.component("SearchPanel", {
    data () {
        return {
            exactMatch: false,
            n: null,
            searchStr: "",
            list: [],
            includeInvisible: true,
            kd: null,
            hideBuildin: false
        };
    },
    watch: {
        n: function (_0x2fedd8, _0x3720ab) {
            this.startSearch(this.searchStr);
        }
    },
    methods: {
        onChange () {
            if (this.searchStr.trim() == "") {
                this.list = [];
                return;
            }
            let _0x4befc5 = _0x407b22 => {
                this.list = _0x407b22 || [];
            };
            if (highElectron) {
                wv.executeJavaScript("__searchComs('" + this.searchStr.trim() + "', '" + (this.n ? this.n.id : "") + "')").then(_0x4befc5);
            } else {
                wv.executeJavaScript("__searchComs('" + this.searchStr.trim() + "', '" + (this.n ? this.n.id : "") + "')", _0x4befc5);
            }
        },
        locate (_0x5442cd) {
            v.locateNode(_0x5442cd);
        },
        clearSearch () {
            this.n = null;
            this.searchStr = "";
            this.list.length = 0;
        },
        startSearch (_0x1f97bb) {
            this.searchStr = _0x1f97bb;
            this.onChange();
            this.$refs.tf.focus();
        },
        searchInputContext () {
            v.showInputMenu();
        }
    },
    computed: {
        calcName () {
            if (setting.displayAsFairyTree) {
                return this.n.gobjName || this.n.name;
            } else {
                return this.n.name;
            }
        },
        prefabColor () {
            if (!this.n.isPrefab) {
                return "color:rgb(189, 189, 189);";
            }
            if (this.n.isLinkedPrefab) {
                return "color:#3FC345;";
            } else {
                return "color:rgb(52, 146, 235);";
            }
        },
        filteredList () {
            return this.list.filter(_0x2efdce => {
                if (this.hideBuildin && _0x2efdce.name.startsWith("cc.")) {
                    return false;
                }
                if (!this.includeInvisible && !_0x2efdce.visible) {
                    return false;
                }
                if (this.exactMatch) {
                    return _0x2efdce.name.toLowerCase() == this.searchStr.toLowerCase();
                } else {
                    return true;
                }
            });
        }
    },
    created () {
        this.kd = _0x17e56e => {
            if ((_0x17e56e.key == 27 || _0x17e56e.keyCode == 27) && this.searchStr.trim() != "") {
                this.clearSearch();
                _0x17e56e.stopImmediatePropagation();
                _0x17e56e.stopPropagation();
            }
            if (_0x17e56e.key == "p" && (_0x17e56e.metaKey || _0x17e56e.ctrlKey)) {
                _0x17e56e.stopImmediatePropagation();
                _0x17e56e.stopPropagation();
                _0x17e56e.preventDefault();
                v.openDevToolsTab(true);
            }
        };
        document.addEventListener("keydown", this.kd, true);
        searchVm = this;
    },
    beforeDestroy () {
        document.removeEventListener("keydown", this.kd, true);
    },
    template: `
    <div class="searchPanel">
        <div class="searchTitle" v-show="list.length>0">
            <!-- {{setting.useChinese ? "结果": "Result"}}: -->
            <label>{{filteredList.length}}/{{list.length}}</label>
            <div style="flex:1"></div>
            <label><input type="checkbox" v-model="exactMatch" />{{setting.useChinese ? "完全匹配": "Exact Match"}}   </label>  
            <label><input type="checkbox" v-model="hideBuildin" />{{setting.useChinese ? "隐藏内建组件": "Hide Built-In"}}   </label>  
            <label><input type="checkbox" v-model="includeInvisible" />{{setting.useChinese ? "包含不可见节点": "Includes Invisible"}}   </label>            
            <span class="iconfont icon-shanchu" @click="clearSearch"></span>
        </div>        
        <div class="searchList" v-show="list.length>0">
            <div class="searchItem" @mouseover="v.overNode(c.nodeUuid, c.uuidPath)" @mouseout="v.outNode" v-for="(c,i) in filteredList" >
                <hr>
                <span>{{c.name}}</span>
                
                <span v-if="!c.visible" >{{setting.useChinese ? "不可见": "invisible"}}</span>
                <br>
                <a @click="locate(c.uuidPath)">
                <!-- <span class="iconfont icon-dingwei"></span> -->
                    <span class="itemPath">{{c.path}}</span>
                </a>
            </div>
            <hr v-show="n!=null">
        </div>
        <div class="searchTitle" v-if="n!=null">
            {{setting.useChinese?"在节点:":"Search from Node:"}}
            <a @click="v.selectNode(n.id)">[<span :style="prefabColor">{{calcName}}</span>]</a>
            {{setting.useChinese?"中搜索":""}}
            <a @click="n=null"><span class="iconfont icon-wrong2" ></span></a>
            <div style="flex:1"></div>
        </div>
        <div class="searchBox">
            <span class="iconfont icon-sousuo"></span>
            <input ref="tf" @contextmenu="searchInputContext" @input="onChange" type="search" :placeholder="setting.useChinese?'搜索组件':'search components'" v-model="searchStr" />
        </div>
    </div>
    `
});
Vue.component("NodeView", {
    props: {
        n: Object,
        deep: Number
    },
    data () {
        return {
            bold: false,
            close: !(this.n.name == "Canvas" && this.deep == 1) && !v.openNodes.has(this.n.id),
            selected: this.n.id == v.selectedNode
        };
    },
    watch: {
        close: function (_0x254a12, _0x2ee3db) {
            if (!_0x254a12 && this.n.isFairyCom && setting.displayAsFairyTree && setting.hideFairyComContainer) {
                v.syncOpenFcom(this.n.id);
            }
        }
    },
    computed: {
        needUseChildChilren () {
            return setting.displayAsFairyTree && setting.hideFairyComContainer && this.n.isFairyCom && this.n.children.length == 1 && this.n.children[0].name == "Container" || v.hide3dRootNode && this.n.children.length == 1 && this.n.children[0].name == "RootNode" && this.n.children[0].children[0]?.isMeshRender;
        },
        children () {
            if (this.needUseChildChilren) {
                return this.n.children[0].children;
            } else {
                return this.n.children;
            }
        },
        realDeep () {
            return this.deep;
        },
        isShowLine () {
            return v.dragingEN?.id == this.n.id;
        }
    },
    created () {
        v.$on("selectedNode_changed", this.updateSelected);
        v.$on("locateNode", this.onLocateNode);
        this.bold = v.openNodes.has(this.n.id);
        if (this.n.name == "Canvas") {
            v.syncOpen(this.n.id, !this.close);
        }
    },
    beforeDestroy () {
        v.$off("locateNode", this.onLocateNode);
        v.$off("selectedNode_changed", this.updateSelected);
    },
    methods: {
        onLocateNode (_0x34c40c) {
            if (_0x34c40c.has(this.n.id)) {
                this.close = false;
            }
            this.bold = _0x34c40c.has(this.n.id);
        },
        updateSelected () {
            this.selected = this.n.id == v.selectedNode;
        },
        dragstart (_0x15d2a6) {
            v.dragingSN = _0x15d2a6;
        },
        dragenter (_0x25c0b2) {
            v.pushLog(new Date().toLocaleTimeString(), "consoleLog", _0x25c0b2.name);
            v.dragingEN = _0x25c0b2;
        },
        dragend () {
            wv.executeJavaScript("__swapPos('" + v.dragingSN.id + "','" + v.dragingEN.id + "')");
            v.dragingEN = null;
            v.dragingSN = null;
        }
    },
    template: `
    <div class="node" draggable 
        @dragstart.stop="dragstart(n)" @dragenter.stop="dragenter(n)" @dragend.stop="dragend">
        <hr v-if="isShowLine">
        <node-view-title :bold="bold" :selected="selected" :n="n" :childCount="n.childCount" v-model="close" :deep="deep"></node-view-title>
        <node-view v-if="!close"  v-for="sn in children" :n="sn" :deep="realDeep+1" :key="sn.id">
        </node-view>
    
    </div>`
});
Vue.component("NodeViewTitle", {
    props: ["n", "bold", "deep", "close", "selected", "childCount"],
    model: {
        prop: "close",
        event: "change"
    },
    template: `
        <div :id="refName" @mouseover="overNode" @mouseout="outNode" class="nodeTitle" @click="selectNode()" :style="nodePadding+selectedBg+isBold" @contextmenu.stop="onContextMenu">
            <!-- <span :style="nodePadding" v-if="children.length==0"></span> -->
            <span @click.stop="toggleNode()" :style="iconTransform" v-if="childCount>0" class="nodearrow iconfont icon-shangsanjiao"></span>
            <span :style="disable" >{{nodeName}}</span><span class="dcDesc" :style="selectedDc">{{dcDesc}}</span>
            <a v-if="!n.autoUpdate" @click.stop="forceUpdateTree" class="iconfont icon-shuaxin"></a>
            <span v-if="isLockedDragNode" class="iconfont icon-drag"></span>
        </div>
    `,
    watch: {
        childCount: function (_0x3495da, _0x20dd0e) {
            if (this.deep == 1) {
                this.$el.style = this.nodePadding + this.selectedBg + this.isBold;
            }
        }
    },
    computed: {
        isLockedDragNode () {
            return v.lockNode == this.n.id;
        },
        isBold () {
            return "";
        },
        calcName () {
            if (setting.displayAsFairyTree) {
                return this.n.gobjName || this.n.name;
            } else {
                return this.n.name;
            }
        },
        nodeName () {
            return this.pre + this.calcName + this.childrenCount + (this.n.prefabChanged ? " *" : "");
        },
        childrenCount () {
            let _0x525963 = this.n.childCount;
            if (setting.showChildrenCount && _0x525963 > 0) {
                return " [" + _0x525963 + "]";
            } else {
                return "";
            }
        },
        pre () {
            if (this.n.breaks) {
                return "⭕️";
            } else {
                return "";
            }
        },
        iconTransform () {
            let _0x5513f2 = this.close ? "transform:rotate(90deg)" : "transform:rotate(180deg)";
            return "display: inline-block;" + _0x5513f2;
        },
        refName () {
            if (this.selected) {
                return "selectedNode";
            } else {
                return "";
            }
        },
        nodePadding () {
            let _0x1351c1 = this.n.childCount > 0 ? 21 : 0;
            return "padding-left:" + (this.deep * 20 - _0x1351c1) + "px;";
        },
        prefabColor () {
            if (!this.n.isPrefab) {
                if (this.selected) {
                    return "color:black;";
                } else {
                    return "";
                }
            }
            if (this.n.isLinkedPrefab) {
                if (this.selected) {
                    return "color:#0aab10;";
                } else {
                    return "color:#3FC345;";
                }
            } else if (this.selected) {
                return "color:#0070ff;";
            } else {
                return "color:rgb(52, 146, 235);";
            }
        },
        bold () {
            if (this.n.isPrefabRoot) {
                return "font-weight:bolder;font-size:" + setting.prefabFontSize + "em;";
            } else {
                return "font-weight:normal;";
            }
        },
        txtShadow () {
            if (this.n.isPrefab == "") {
                return "";
            } else {
                return "text-shadow: black 1px 1px 2px;";
            }
        },
        background () {
            if (this.selected) {
                return "background-color:rgba(204, 204, 204, 1);";
            } else {
                return "";
            }
        },
        selectedBg () {
            if (setting.glass) {
                if (this.selected) {
                    return "color:black;background-color:rgba(255, 255, 255, 0.5);";
                } else {
                    return "";
                }
            }
            return "" + this.bold + this.prefabColor + this.background;
        },
        selectedDc () {
            if (this.selected) {
                return "color:rgb(14, 127, 233)";
            } else {
                return "";
            }
        },
        nodeNameMargin () {
            if (this.n.isPrefabRoot) {
                return "margin-left:-" + (setting.prefabFontSize - 1) / 3 + "em;";
            } else {
                return "";
            }
        },
        disable () {
            if (this.n.activeInHierarchy && this.n.opacityInHierarchy) {
                return "" + this.nodeNameMargin;
            } else {
                return this.nodeNameMargin + "opacity:0.5;";
            }
        },
        rtypeDesc () {
            let _0x5afea2 = [];
            const _0x41325a = this.n.rtype;
            for (let _0x25e520 in _0x41325a) {
                _0x5afea2.push(_0x25e520 + ":" + _0x41325a[_0x25e520]);
            }
            return _0x5afea2.join(",");
        },
        dcDesc () {
            if (this.n.dc == undefined) {
                return "";
            }
            if (this.n.rtype && Object.keys(this.n.rtype).length > 0) {
                return " " + this.n.dc + " + " + this.rtypeDesc;
            } else {
                if (this.n.dc == 0) {
                    return "";
                }
                return " " + this.n.dc;
            }
        }
    },
    methods: {
        forceUpdateTree () {
            v.forceUpdateTree();
        },
        toggleNode () {
            v.syncOpen(this.n.id, this.close);
            this.$emit("change", !this.close);
        },
        selectNode () {
            v.selectNode(this.n.id);
        },
        onContextMenu () {
            menuId = this.n.id;
            menuNode = this.n;
            nodeMenu.items.shift();
            remote.getCurrentWindow().focus();
            nodeMenu.popup(remote.getCurrentWindow());
        },
        overNode () {
            wv.executeJavaScript("if(window[\"__drawRect\"])__drawRect('" + this.n.id + "')");
        },
        outNode () {
            wv.executeJavaScript("if(window[\"__clearRect\"])__clearRect()");
        }
    }
});
Vue.component("ExtensionPanel", {
    data () {
        return {
            example: ""
        };
    },
    methods: {
        onSelectedFile () { },
        async chooseFile () {
            let _0x5cde08 = await remote.dialog.showOpenDialog({
                filters: [{
                    extensions: "json",
                    name: "configFile"
                }]
            });
            if (!_0x5cde08 || _0x5cde08.canceled) {
                return;
            }
            _0x5cde08 = _0x5cde08.filePaths[0];
            if (_0x5cde08 && _0x5cde08.trim() != "") {
                setting.extensionFile = _0x5cde08;
                setting.saveToStorage();
            }
        }
    },
    created () {
        let _0x16f7a0 = fs_1.readFileSync(path.join(__dirname, "plugins.json"), {
            encoding: "utf-8"
        });
        this.example = JSON.stringify(JSON.parse(_0x16f7a0), null, "\t");
    },
    template: `
    <div class="extensionPanel">
        <label>
            <input @change="setting.saveToStorage" type="checkbox" v-model="setting.enableExtension">
            {{setting.useChinese?"开启扩展":"Enable Extension"}}
        </label>
        <span class="settingDesc">{{setting.useChinese?"修改后重新打开插件生效":"need reopen cocos inspector after change"}}</span>
        <hr>
        <div>{{setting.useChinese?"当前扩展文件":"Current Extension File"}}:<br>
        <span class="settingDesc">{{setting.extensionFile||(setting.useChinese?"未选择文件":"no file choosed")}}</span>
        </div>
        <button @click="chooseFile">{{setting.useChinese?"选择文件":"Choose File"}}</button>
        <hr>
        <div>{{setting.useChinese?"扩展文件范例":"Example"}}:</div>
        <textarea readonly v-once>{{example}}</textarea>
    </div>
    `
});
Vue.component("Spacer", {
    template: `
    <div class="flex1"></div>
    `
});
let consoleMenu = new Menu();
consoleMenu.append(new MenuItem({
    label: "Clear Logs",
    click: function () {
        v.logs = [];
    }
}));
Vue.component("ConsolePanel", {
    data () {
        return {
            type: "All",
            types: ["All", "Log", "Error", "Warn"],
            filterStr: "",
            code: "",
            codeTip: [],
            tipIndex: 0,
            atBottom: true
        };
    },
    computed: {
        logs () {
            if (this.type == "All") {
                return v.bigLogs.filter(_0x4827ba => {
                    return _0x4827ba.d.toLowerCase().includes(this.filterStr.toLowerCase());
                });
            }
            return v.bigLogs.filter(_0xaafe5e => {
                return _0xaafe5e.t.endsWith(this.type) && _0xaafe5e.d.includes(this.filterStr);
            });
        }
    },
    mounted () {
        this.scrollLogToBottom();
    },
    updated () {
        this.scrollLogToBottom();
    },
    methods: {
        checkBottom () {
            let _0x32c256 = this.$refs.logsMain;
            this.atBottom = _0x32c256.scrollHeight - _0x32c256.clientHeight == _0x32c256.scrollTop;
        },
        showMenu () {
            consoleMenu.popup(remote.getCurrentWindow());
        },
        clearLogs () {
            v.logs = [];
        },
        scrollLogToBottom () {
            if (!this.atBottom) {
                return;
            }
            let _0x398ce1 = this.$refs.logsMain;
            this.$nextTick(function () {
                _0x398ce1.scrollTop = _0x398ce1.scrollHeight;
            });
        },
        gotoStore () {
            remote.shell.openExternal("https://store.cocos.com/app/detail/2940");
        },
        gotoScM () {
            remote.shell.openExternal("https://forum.cocos.org/t/topic/116310");
        },
        exec () {
            this.codeTip = [];
            if (this.code.trim() != "") {
                let _0x534e0f = this.code;
                v.pushLog(new Date().toLocaleTimeString(), "consoleLog", "> " + _0x534e0f + ":");
                if (!_0x534e0f.startsWith("let ") && !_0x534e0f.startsWith("var ") && !_0x534e0f.startsWith("console.") && !_0x534e0f.startsWith("cc.log")) {
                    _0x534e0f = "console.log(" + _0x534e0f + ")";
                }
                let _0x573607 = _0xc1ffbe => {
                    if (_0xc1ffbe != null) {
                        v.pushLog(new Date().toLocaleTimeString(), "consoleLog", "" + _0xc1ffbe);
                    }
                    this.code = "";
                };
                if (highElectron) {
                    wv.executeJavaScript(_0x534e0f).then(_0x573607);
                } else {
                    wv.executeJavaScript(_0x534e0f, _0x573607);
                }
            }
        },
        up () {
            if (this.tipIndex == 0) {
                this.tipIndex = this.codeTip.length - 1;
            } else {
                this.tipIndex--;
            }
            this.$nextTick().then(() => {
                let _0x19f15a = this.$refs.selected[0];
                if (_0x19f15a) {
                    _0x19f15a.scrollIntoViewIfNeeded(false);
                }
            });
        },
        down () {
            if (this.tipIndex == this.codeTip.length - 1) {
                this.tipIndex = 0;
            } else {
                this.tipIndex++;
            }
            this.$nextTick().then(() => {
                let _0x93110d = this.$refs.selected[0];
                if (_0x93110d) {
                    _0x93110d.scrollIntoViewIfNeeded(false);
                }
            });
        },
        esc () {
            this.codeTip = [];
        },
        tab () {
            let _0x375d41 = this.codeTip[this.tipIndex][0];
            let _0xb7ed05 = this.code.split(".");
            _0xb7ed05.pop();
            if (!isNaN(_0x375d41)) {
                this.code = _0xb7ed05.join(".") + "[" + _0x375d41 + "]";
            } else {
                _0xb7ed05.push(_0x375d41);
                this.code = _0xb7ed05.join(".");
            }
            this.codeTip = [];
            return false;
        },
        getTip () {
            if (this.code.trim() == "") {
                this.codeTip = [];
            } else {
                let _0x2568bb = "__codeTip('" + this.code + "')";
                let _0x88e5e1 = _0x492e7c => {
                    this.tipIndex = 0;
                    this.codeTip = _0x492e7c;
                };
                if (highElectron) {
                    wv.executeJavaScript(_0x2568bb).then(_0x88e5e1);
                } else {
                    wv.executeJavaScript(_0x2568bb, _0x88e5e1);
                }
            }
        },
        splitMsg (_0x4e259a) {
            let _0x2c81b9 = RegExp("(" + this.filterStr + ")", "i");
            return _0x4e259a.split(_0x2c81b9);
        }
    },
    template: `
    <div class="consolePanel">
        <div class="topMenu">
            <!-- <a @click="clearLogs" title="clear logs">
                <span class="iconfont icon-wrong2"></span>
            </a> -->
            <input placeholder="type to filter logs" type="search" v-model="filterStr" />
            <label v-for="t in types"><input type="radio" :value="t" v-model="type">{{t}}</label>

            <label><input @change="setting.saveToStorage()" type="checkbox" v-model="setting.clearLogAfterRefresh" />clearLogAfterRefresh</label>
            <a @click="gotoStore">Useful? 5 stars?</a>
            new:<a @click="gotoScM">Shortcuts Manager</a>
        </div>
        <hr>
        <div class="logs flex1" ref="logsMain" @contextmenu.stop="showMenu" @scroll="checkBottom">
            <div class="logItem" v-for="l in logs" :style="{color:v.logColor(l.t)}">
                <span class="logTime">{{l.time}}:</span>
                <!-- {{l.d}} -->
                <span v-if="filterStr.trim()==''">{{l.d}}</span>
                <span v-if="filterStr.trim()!=''" v-for="d in splitMsg(l.d)" :class="{filter:d.toLowerCase()==filterStr.toLowerCase()}">{{d}}</span>
            </div>
        </div>
        <input @keydown.tab.prevent="tab" @keyup.esc.stop="esc" @keydown.up.prevent="up" @keydown.down.prevent="down" @keyup.enter="exec" @input="getTip" placeholder="type code here" type="text" v-model="code"/>
        <div class="codeTips" v-show="codeTip.length>0">
            <div class="helpCon">
                <span class="help"><b>TAB</b>: choose&fill</span>  
                <span class="help"><b>UP/DOWN</b>: switch</span> 
                <span class="help"><b>ENTER</b>: execute</span>
            </div>
            <hr>
            <div class="tipsCon">
                <div :ref="tipIndex==i?'selected':null" :class="{tipItem:true,selected:tipIndex==i}" v-for="(t,i) in codeTip" :key="t">
                    <b>{{t[0]}}</b>:<span>{{t[1]}}</span>                
                </div>
            </div>
        </div>
    </div>
    `
});
Vue.component("LocalStoragePanel", {
    data () {
        return {
            lcStorage: {}
        };
    },
    computed: {
        keys () {
            return Object.keys(this.lcStorage);
        }
    },
    created () {
        let _0xf3b956 = `
        var o2 = {}
        Object.keys(cc.sys.localStorage).forEach(function(k){
            o2[k] = cc.sys.localStorage[k]
        })
        o2
        `;
        let _0x155ccc = _0x5072de => {
            this.lcStorage = _0x5072de;
        };
        if (highElectron) {
            wv.executeJavaScript(_0xf3b956).then(_0x155ccc);
        } else {
            wv.executeJavaScript(_0xf3b956, _0x155ccc);
        }
    },
    methods: {
        del (_0x1c4ce1) {
            let _0x4b8de1 = "cc.sys.localStorage.removeItem('" + _0x1c4ce1 + "')";
            if (highElectron) {
                wv.executeJavaScript(_0x4b8de1);
            } else {
                wv.executeJavaScript(_0x4b8de1);
            }
            Vue.delete(this.lcStorage, _0x1c4ce1);
        }
    },
    template: `
    <div>
        <br>
        <div class="topSticky">{{setting.useChinese?"本地存储":"Local Storage"}}</div>
        <!-- <hr> -->
        <div class="localStorageCon">
            <span v-for="k in keys" :key="k" class="varItem" style="color:white">
                {{k}}: 
                <span class="varItemValue">{{lcStorage[k]}}</span>
                <a @click.stop="del(k)"><span class="iconfont icon-wrong2"></span></a>
            </span>
        </div>
    </div>`
});
Vue.component("StatisticPanel", {
    methods: {
        toggle () {
            v.toggleStatistic();
        }
    },
    computed: {
        btnLabel () {
            if (v.statisticing) {
                return "Stop";
            } else {
                return "Start";
            }
        }
    },
    template: `
    <div class="cocosPanel">
        <button @click="toggle">{{btnLabel}}</button>
    </div>
    `
});
let _filterSet = new Set(["CollisionManager", "Collision_DebugDraw", "isDynamicAtlasDebugShow"]);
Vue.component("CocosPanel", {
    data () {
        return {
            ccVars: {},
            lcStorage: {}
        };
    },
    computed: {
        keys () {
            return Object.keys(this.ccVars).sort().filter(_0x32f65f => {
                return !_filterSet.has(_0x32f65f);
            });
        }
    },
    created () {
        this.refreshVars();
    },
    methods: {
        refreshVars () {
            let _0x454a8c = `
            var o = {}
            for(let k in window){
                if(k.startsWith("CC_")){
                    o[k] = window[k]
                }
            }
            if(cc){
                for(let k in cc.sys){
                    if(k.startsWith("is")){
                        if(typeof cc.sys[k] != "function"){
                            o[k] = cc.sys[k]
                        }
                    }
                }
                try{
                o["enabledDynamicAtlas"] = cc.dynamicAtlasManager?.enabled
                }catch(e){
                }
                try{
                    o["isDynamicAtlasDebugShow"] = cc.find("DYNAMIC_ATLAS_DEBUG_NODE") != null
                }catch(e){
                }
                
                try{
                    o["enabledRetina"] = cc.view.isRetinaEnabled()
                }catch(e){
                }
            
                try{
                    o["ENGINE_VERSION"] = cc.ENGINE_VERSION
                }catch(e){
                }

                try{
                    o["CollisionManager"] = cc.director.getCollisionManager?.().enabled
                }catch(e){
                }

                try{
                    o["Collision_DebugDraw"] = cc.director.getCollisionManager?.().enabledDebugDraw
                }catch(e){
                }
            
            }
            
            o
            `;
            let _0x13adca = _0x59cdd1 => {
                this.ccVars = _0x59cdd1;
            };
            if (highElectron) {
                wv.executeJavaScript(_0x454a8c).then(_0x13adca);
            } else {
                wv.executeJavaScript(_0x454a8c, _0x13adca);
            }
        },
        getStyle (_0x1243fe) {
            if (this.ccVars[_0x1243fe]) {
                return "color:white;";
            } else {
                return "color:grey;";
            }
        },
        syncColEnable () {
            wv.executeJavaScript("cc.director.getCollisionManager().enabled = " + this.ccVars.CollisionManager);
        },
        syncColDebugDraw () {
            wv.executeJavaScript("cc.director.getCollisionManager().enabledDebugDraw = " + this.ccVars.Collision_DebugDraw);
        },
        toggleDynamicAtlasShow () {
            let _0x509ab9 = "cc.dynamicAtlasManager.showDebug(" + this.ccVars.isDynamicAtlasDebugShow + ");" + this.ccVars.isDynamicAtlasDebugShow;
            wv.executeJavaScript(_0x509ab9);
        }
    },
    template: `
    <div class="cocosPanel">
        <div class="topSticky"> {{setting.useChinese?"引擎版本":"ENGINE_VERSION"}}: {{ccVars.ENGINE_VERSION}}</div>
        <!-- <hr> -->
        <div class="varsCon">
            <span v-for="k in keys" :key="k" class="varItem" :style="getStyle(k)">{{k}}: {{ccVars[k]}}</span>
        </div>
        <!-- <hr> -->
        <div class="varsCon">
                <!-- <label class="varItem">
                    <input @change="syncColEnable" type="checkbox" v-model="ccVars.CollisionManager" />
                    CollisionManager
                </label>
                <label class="varItem">
                    <input @change="syncColDebugDraw" type="checkbox" v-model="ccVars.Collision_DebugDraw" />
                    Collision_DebugDraw
                </label>
                <label class="varItem" v-if="ccVars.enabledDynamicAtlas && ccVars.CC_PREVIEW">
                    <input @change="toggleDynamicAtlasShow" type="checkbox" v-model="ccVars.isDynamicAtlasDebugShow" />
                    Show DynamicAtlas
                </label> -->
        </div>
        <!-- <hr> -->
        <local-storage-panel></local-storage-panel>
    </div>
    `
});
Vue.component("DebugPanel", {
    data () {
        return {
            originItems: [],
            items: [],
            useFixedOrder: false,
        };
    },
    methods: {
        buttonClicked (btn, key, value) {
            console.log(`Button: ${btn}, Key: ${key}, Value: ${value}`);
            const currentDate = new Date();
            const dateOnlyTimestamp = new Date(currentDate.setHours(0, 0, 0, 0)).toISOString();
            localStorage.setItem(key, dateOnlyTimestamp);
            const code = `${key} = "${value}";`;
            wv.executeJavaScript(code);
        },
        toggleOrder () {
            this.items = this.useFixedOrder ? [...this.originItems] : this.sortItemsByLastUsed();
        },
        sortItemsByLastUsed () {
            return this.originItems.map(item => {
                const lastClicked = localStorage.getItem(item.key) || new Date(0).toISOString();
                return { ...item, lastClicked };
            }).sort((a, b) => new Date(b.lastClicked) - new Date(a.lastClicked));
        }
    },
    mounted () {
        let dataPath = path.join(__dirname, '../../assets/inspector-data.json');
        try {
            const data = fs_1.readFileSync(dataPath, 'utf8');
            this.originItems = JSON.parse(data);
            this.items = this.sortItemsByLastUsed();
        } catch (err) {
            console.error('Error reading the file:', err);
        }

        const style = document.createElement('style');
        style.textContent = `
          .debugPanel {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #fff;
            padding: 20px;
            background-color: #333;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
          }
          .debugPanel .orderToggle {
            margin-bottom: 15px;
          }
          .debugPanel .orderToggle label {
            color: #fff;
            font-size: 14px;
          }
          .debugPanel .item {
            margin-bottom: 10px;
            border-bottom: 1px solid #555;
            padding-bottom: 10px;
          }
          .debugPanel h2 {
            margin: 0 0 5px 0;
            color: #aaa;
          }
          .debugPanel .buttons {
            margin-bottom: 5px;
          }
          .debugPanel button {
            margin-right: 5px;
            padding: 6px 12px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s;
          }
          .debugPanel button:hover {
            background-color: #0056b3;
          }
        `;
        document.head.appendChild(style);
    },
    template: `
    <div class="debugPanel">
      <div class="orderToggle">
        <label>
          <input type="checkbox" v-model="useFixedOrder" @change="toggleOrder">
          Use Fixed Order
        </label>
      </div>
      <div v-for="(item, index) in items" :key="index" class="item">
        <h2>{{ item.title ? item.title : item.key }}</h2>
        <div class="buttons">
          <button v-for="(btn, btnIndex) in item.desc.split(',')" :key="btnIndex" @click="buttonClicked(btn, item.key, item.value[btnIndex])">
            {{ btn }}
          </button>
        </div>
      </div>
    </div>
  `
});

Vue.component("ResolutionResizer", {
    data () {
        return {
            size: [320, 480],
            isPortrait: false
        };
    },
    created () {
        this.syncSettingValues();
        let _0x1af7fe = this;
        setting.$on("settingSize_change", () => {
            _0x1af7fe.syncSettingValues();
        });
    },
    computed: {
        w () {
            if (this.isPortrait) {
                return this.size[0];
            } else {
                return this.size[1];
            }
        },
        h () {
            if (this.isPortrait) {
                return this.size[1];
            } else {
                return this.size[0];
            }
        },
        resizeStyle () {
            return "resize:both;overflow:auto;";
        },
        whStyle () {
            return "width:" + this.w + "px;height:" + this.h + "px;";
        }
    },
    methods: {
        syncSettingValues () {
            this.size = setting.size;
            this.isPortrait = setting.isPortrait;
            this.$forceUpdate();
        },
        onResize1 () {
            let {
                width: _0x2d6edf,
                height: _0x4d1c43
            } = this.$el.style;
            let _0x2f6d99 = Number(_0x2d6edf.slice(0, -2));
            let _0x5adc44 = Number(_0x4d1c43.slice(0, -2));
            if (_0x2f6d99 == 0 || _0x5adc44 == 0) {
                return;
            }
            setting.isPortrait = _0x2f6d99 < _0x5adc44;
            this.setSize([_0x2f6d99, _0x5adc44]);
        },
        setSize (_0xf4f528) {
            if (_0xf4f528[0] == 0 || _0xf4f528[1] == 0) {
                return;
            }
            _0xf4f528.sort((_0x245fcf, _0x10308e) => _0x245fcf - _0x10308e);
            if (_0xf4f528.join(",") == setting.size.join(",")) {
                return;
            }
            setting.size = _0xf4f528;
            this.$nextTick().then(() => {
                wv.executeJavaScript("setTimeout(__resizeCvn,70)");
                v.syncBv();
            });
        },
        addBg () {
            wv.style.pointerEvents = "none";
            if (dwv) {
                dwv.style.pointerEvents = "none";
            }
            window.addEventListener("mousemove", this.onResize1, true);
            window.addEventListener("mouseup", this.removeBg, true);
        },
        removeBg () {
            this.onResize1();
            wv.style.pointerEvents = "unset";
            if (dwv) {
                dwv.style.pointerEvents = "unset";
            }
            window.removeEventListener("mousemove", this.onResize1, true);
            window.removeEventListener("mouseup", this.removeBg, true);
            setting.saveToStorage();
            let _0x2af813 = this.$el;
            _0x2af813.removeAttribute("style");
        }
    },
    template: `
    <div class="ResolutionResizer"  @mousedown="addBg" >
        <div :style="whStyle"></div>
        <!-- <div ref="cover" class="movingCover" @mousemove="onResize1" @mouseup="removeBg"></div> -->
    </div>
    `
});
Vue.component("ResolutionSelector", {
    data () {
        return {
            sizes: [{
                name: "2560*1600",
                s: [1600, 2560]
            }, {
                name: "1280*800",
                s: [800, 1280]
            }, {
                name: "640*400",
                s: [400, 640]
            }, {
                name: "iPhone 7 Plus",
                s: [414, 736]
            }, {
                name: "iPhone X",
                s: [375, 812]
            }, {
                name: "iPad",
                s: [768, 1024]
            }, {
                name: "HW P9",
                s: [540, 960]
            }, {
                name: "HW Mate9 Pro",
                s: [720, 1280]
            }],
            showCustom: false,
            costomSize: {
                name: "custom",
                s: [640, 960]
            }
        };
    },
    created () {
        setting.extraSizes = setting.extraSizes.filter(_0x11f215 => {
            return !Array.isArray(_0x11f215);
        });
    },
    methods: {
        isCurrSize (_0x105194) {
            return setting.size.join(",") == _0x105194.join(",");
        },
        setSize (_0x165534) {
            setting.size = _0x165534;
            setting.saveToStorage();
            this.$nextTick().then(() => {
                wv.executeJavaScript("setTimeout(__resizeCvn,100)");
            });
            v.showResolutionSelector = false;
        },
        addCustom () {
            let _0x39c30c = this.costomSize.s.concat();
            _0x39c30c.sort((_0x35eced, _0x2f424b) => _0x35eced - _0x2f424b);
            setting.extraSizes.push({
                name: this.costomSize.name,
                s: _0x39c30c
            });
            setting.saveToStorage();
            this.showCustom = false;
        },
        delSize (_0x2f921f) {
            setting.extraSizes.splice(_0x2f921f, 1);
            setting.saveToStorage();
        }
    },
    template: `
    <div class="ResolutionSelector" @click.stop>
        <label>
            <input @change="setting.syncPortrait" type="checkbox"  v-model="setting.isPortrait" />
            {{setting.useChinese ? "竖屏": "isPortrait"}}
        </label>
        <hr>

        <div @click="setSize(s.s)" class="resoItem" v-for="s in sizes" :key="s" >
            <span class="sizeName">
                {{s.name}}
                <spacer />
                {{s.s.join("*")}}
            </span>
            <span class="iconfont icon-right" v-if="isCurrSize(s.s)"></span>
            <span class="flex1"></span>
        </div>
        <hr v-if="setting.extraSizes.length>0">
        <div @click="setSize(s.s)" class="resoItem" v-for="(s,i) in setting.extraSizes" :key="s" >
            <span class="sizeName">
                {{s.name}}
                <spacer />
                {{s.s.join("*")}}
            </span>
            <span class="iconfont icon-right" v-if="isCurrSize(s.s)"></span>
            <!-- <span class="flex1"></span> -->
            <a @click.stop="delSize(i)"><span class="iconfont icon-wrong2"></span></a>
        </div>
        <span class="settingDesc">
            {{setting.useChinese ? "拖拽游戏区域右下角可自动调节分辨率":"you can try to drag the right-bottom corner of the game to adjust resolution"}}
        </span>
        <hr>
        <a v-show="!showCustom" @click.stop="showCustom=true">
            {{setting.useChinese ? "添加自定义分辨率": "+Custom"}}
        </a>
        <div v-show="showCustom" style="display:flex;flex-direction:column;">
            {{setting.useChinese ? "名称": "name"}}:<input type="text" v-model="costomSize.name" />
            {{setting.useChinese ? "宽度": "width"}}:<input type="number" v-model.number="costomSize.s[0]" />
            
            {{setting.useChinese ? "高度": "height"}}:<input type="number" v-model.number="costomSize.s[1]" />
            
            <div style="display:flex">
                <a @click.stop="addCustom()">{{setting.useChinese ? "确认": "Confirm"}}</a>
                <spacer />
                <a @click.stop="showCustom=false">{{setting.useChinese ? "取消": "Cancel"}}</a>
            </div>
        </div>
    </div>`
});
Vue.component("MyHelp", {
    data () {
        let _0x216c3c = remote.app.getLocale() == "zh-CN" ? "cn" : "en";
        return {
            show: false,
            lang: _0x216c3c
        };
    },
    computed: {
        isCN () {
            return this.lang == "cn";
        }
    },
    watch: {
        show: function (_0x23d276, _0x4330b9) {
            v.syncBv();
        }
    },
    template: `
    <div class="helpPanel setting" v-show="show">
    <div class="settingHeader">
        <span class="iconfont icon-shanchu" @click="show=false" style="font-size: 1.5em;"></span>
        <div class="settingTitle" v-show="!isCN">Help</div>
        <div class="settingTitle" v-show="isCN">帮助</div>
        <a @click="lang='cn'" v-show="!isCN">Chinese</a>
        <a @click="lang='en'" v-show="isCN">English</a>
    </div>
    <div v-show="lang=='en'">
        <h1>DrawCall</h1>
        <ul>
            <li>
                <div class="helpTitle">How to open</div>
                right click scene name Tab
            </li>
            <li>
                <div class="helpTitle">Why not accurate?</div>
                number + mk + gh + ot is total drawcall, not only number;
                <br>
                and now is beta, only calculate Sprite and label, in AutoAtlas, DynamicAtlas,Static Atlas.
                <br>
                Shader and Material still not calculate;
            </li>
            <li>
                <div class="helpTitle">What's the means of: mk, gh, ot?</div>
                mk is Mask, gh is Graphics, ot is other RenderComponents;
                <br>
                they have many different cases about DrawCall, so now only mark them in node Tree
            </li>
        </ul>
        <hr>
        <h1>Video Tutorial</h1>
        <ul>
            <li>
                <div class="helpTitle">Plugin Version</div>
                In Recording
                <a @click="remote.shell.openExternal('https://www.bilibili.com/video/BV1Nh411h72h')" >https://www.bilibili.com/video/BV1Nh411h72h</a>
            </li>
            <li>
                <div class="helpTitle">Mac Native Version</div>
                not same as Plugin Version
                <a @click="remote.shell.openExternal('https://www.bilibili.com/video/BV1KK4y1R7L1')" >https://www.bilibili.com/video/BV1Nh411h72h</a>
            </li>
        </ul>
        </div>
        <div v-show="lang=='cn'">
        <h1>DrawCall分析</h1>
        <ul>
            <li>
                <div class="helpTitle">怎么打开DrawCall分析</div>
                在场景名称上右键
            </li>
            <li>
                <div class="helpTitle">为什么有时不太准确?</div>
                drawcall包含 数字 + mk + gh + ot， 不仅仅是数字;
                <br>
                目前仅计算了Sprite和Label(包含自动图集，动态图集，静态图集等因素)
                <br>
                Shader，Meterial产生的DrawCall暂时并未包含                
            </li>
            <li>
                <div class="helpTitle">mk, gh, ot是什么意思?</div>
                mk 是 Mask, gh 是 Graphics, ot is 其他渲染组件;
                <br>
                他们有很多因素来影响DrawCall，暂时不方便计算，所以现在仅仅在节点树标记出来，方便知道影响DrawCall的可能因素
            </li>
        </ul>
        <hr>
        <h1>FGUI支持</h1>
        <ul>
            <li>
                <div class="helpTitle">为什么节点没有显示成FGUI结构</div>
                首先要在设置开启fairyGUI，其次，ccc3.x版本要保证window["fgui"]可以访问
            </li>
        </ul>
        <hr>
        <h1>视频教程</h1>
        <ul>
            <li>
                <div class="helpTitle">插件版</div>
                录制中...
                <a @click="remote.shell.openExternal('https://www.bilibili.com/video/BV1Nh411h72h')" >https://www.bilibili.com/video/BV1Nh411h72h</a>
            </li>
            <li>
                <div class="helpTitle">Mac原生版本</div>
                跟插件版不一样，仅供参考
                <a @click="remote.shell.openExternal('https://www.bilibili.com/video/BV1KK4y1R7L1')" >https://www.bilibili.com/video/BV1Nh411h72h</a>
            </li>
        </ul>
        </div>
    </div>
    `
});
Vue.component("ValidatePanel", {
    data () {
        return {
            show: false,
            pass: false,
            orderNum: setting.orderNum,
            checking: false,
            error: ""
        };
    },
    created () {
        let _0x30e9d1 = document.createElement("style");
        _0x30e9d1.innerText = `
        .validatePanel{
            position: fixed;
            top: 0;
            left: 0;
            right:0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.699);
            display: flex;       
            z-index: 1000; 
        }
        .validatePanel label{
            font-weight:bold;
            white-space:pre;
        }
        .validatePanel .error{
            color:red;
        }
        .validatePanel .center{
            margin: auto;
        }`;
        document.head.appendChild(_0x30e9d1);
        let _0x373c64 = this;
        window.addEventListener("online", function () {
            if (_0x373c64.pass) {
                return;
            }
            _0x373c64.initCheck();
        });
        if (!navigator.onLine) {
            return;
        }
        this.initCheck();
        // TOLOOK
        // setInterval(() => {
        //     if (!_0x373c64.pass && navigator.onLine) {
        //         let _0x5edb24 = document.querySelector(".validatePanel");
        //         if (!_0x5edb24) {
        //             v.$el.remove();
        //         } else {
        //             let _0x18ad5c = getComputedStyle(_0x5edb24);
        //             if (_0x18ad5c.zIndex != "1000") {
        //                 v.$el.remove();
        //             }
        //             if (_0x5edb24.clientWidth < window.innerWidth || _0x5edb24.clientHeight < window.innerHeight) {
        //                 v.$el.remove();
        //             }
        //             if (_0x5edb24.style.display == "none" || _0x5edb24.style.visibility == "hidden") {
        //                 v.$el.remove();
        //             }
        //         }
        //     }
        // }, 10000);
    },
    computed: {
        isShowing () {
            if (this.pass) {
                return false;
            }
            return this.show;
        }
    },
    methods: {
        initCheck () {
            if (setting.orderNum.trim() != "") {
                this.checkOrder(setting.orderNum);
            } else {
                this.onPass(false);
            }
        },
        check () {
            this.checking = true;
            this.checkOrder(this.orderNum);
        },
        onPass (_0x129c99 = false, _0x3a8748 = "") {
            this.checking = false;
            this.pass = _0x129c99;
            this.error = _0x3a8748;
            if (!_0x129c99) {
                this.show = true;
            }
            setting.orderNum = this.orderNum;
            setting.saveToStorage();
        },
        async checkOrder (_0x311a46) {
            // let _0x4e14a6 = "http://175.178.125.68:3000";
            // let _0x38785f = await this.callApi(_0x4e14a6 + "/cc-validate", {
            //     userId: Number(cocos_uid),
            //     userName: nickname,
            //     orderNum: _0x311a46,
            //     accToken: access_token
            // });
            this.onPass(true, "");
        },
        copyIdAndOrder () {
            remote.clipboard.writeText("cocos_uid: " + cocos_uid + ", order_number: " + this.orderNum);
        },
        async callApi (_0xf00780, _0x8e0689 = null, _0x499e57 = true) {
            this.loading = true;
            let _0x310dd3 = await fetch(_0xf00780, {
                method: "post",
                body: JSON.stringify(_0x8e0689 || {}),
                headers: {
                    "Content-Type": "application/json"
                }
            });
            this.loading = false;
            if (_0x310dd3.status != 200) {
                return {};
            }
            if (_0x499e57) {
                return await _0x310dd3.json();
            }
            return await _0x310dd3.text();
        }
    },
    template: `
    <div class="validatePanel" ref="vp" v-show="isShowing" @click.stop @keyup.stop @keydown.stop @contextmenu="if(!debug) event.stopPropagation()">
        <div class="center">
            <label>{{setting.useChinese ? "用户名" :"User"}}: </label>{{nickname}}
            <br>
            <label>{{setting.useChinese ? "订单号" :"Order Number"}}: </label>
            <input type="text" style="width:20em;" v-model="orderNum" :placeholder="setting.useChinese ? '请输入您的订单号' :'please type your order number'" :disable="checking"/>
            <button @click="check" :disable="checking">{{checking?(setting.useChinese ? "验证中..." :'Validating'):(setting.useChinese ? "验证" :'Validate')}}</button>
            <div class="error" v-show="!pass">{{error}}</div>
            <br><br>
            <hr>
            <br>
                <label>{{setting.useChinese ? "帮助" :"Help"}}:</label><a
                            @click="remote.shell.openExternal('https://store-my.cocos.com/#/buyer/history')"
                            target="_blank">{{setting.useChinese ? "查找订单号" :"Find Order Number"}}</a>
            <br>
                <label>{{setting.useChinese ? "自动验证可能会失效," :"Automatic verification may not work,"}}</label>
                <a @click="copyIdAndOrder">{{setting.useChinese ? "点击这里复制当前cocos_uid与订单号" :"Click here to copy the current cocos_uid and order number"}}</a>

            <br>
                <label>{{setting.useChinese ? "联系方式" :"Contact"}}:</label>
                <a href="mailto:bytetalking@qq.com">email</a> <a href="mailto:bytetalking@gmail.com">gmail</a>
            <br>
                <label>{{setting.useChinese ? "订阅号：": "WeChat Offical Account: "}}</label>
                ByteTalking
            <br>
                <label>{{setting.useChinese ? "二维码：": "QRCode: "}}</label>
                <img src="wechatOC.jpeg" style="max-width: 150px;max-height: 150px;">
            <hr>
            
        </div>
    </div>
    `
});
let __tempNodeTree = null;
let __lastNodeSet = new Set();
let __tempLogs = [];
let bv;
let wc;
let v = new Vue({
    el: "#app",
    mounted: function () {
        document.addEventListener("keydown", _0x4e6089 => {
            if ((_0x4e6089.key == 27 || _0x4e6089.keyCode == 27) && this.showResolutionSelector) {
                this.showResolutionSelector = false;
            } else if (_0x4e6089.key == 32 || _0x4e6089.keyCode == 32) {
                if (!setting.spaceToPause) {
                    return;
                }
                if (_0x4e6089.target instanceof HTMLInputElement) {
                    return;
                }
                if (_0x4e6089.target instanceof HTMLButtonElement) {
                    return;
                }
                if (_0x4e6089.target instanceof HTMLTextAreaElement) {
                    return;
                }
                if (_0x4e6089.target instanceof HTMLLinkElement) {
                    return;
                }
                this.playOrPause();
            } else if (_0x4e6089.key == "," && (_0x4e6089.metaKey || _0x4e6089.ctrlKey)) {
                this.showSetting();
            } else if (_0x4e6089.key == "f" && (_0x4e6089.metaKey || _0x4e6089.ctrlKey)) {
                searchVm.startSearch(searchVm.searchStr);
                _0x4e6089.preventDefault();
            }
        }, true);
        let _0x7a3768 = this.$refs.wv;
        let _0x173840 = this.$refs.devtools;
        wv = _0x7a3768;
        wv.addEventListener("did-frame-navigate", _0x19385e => {
            if (_0x19385e.httpResponseCode != 404 || !_0x19385e.isMainFrame) {
                return;
            }
            if (this.mode == 1) {
                this.pushWarnLog(this.useChinese ? "还未构建web-mobile" : "The [web-mobile] page has not been built");
            }
            if (this.mode == 3) {
                this.pushWarnLog(this.useChinese ? "还未构建web-desktop" : "The [web-desktop] page has not been built");
            }
        });
        wv.addEventListener("dom-ready", async () => {
            wv.executeJavaScript("var __logCount=" + setting.logCount + ";var __showDevToolInTab=" + setting.showDevToolInTab);
            wv.executeJavaScript(str);
            setting.initMv({
                __lockDragNode: this.lockNode,
                __hover: this.hover,
                __designMode: this.designMode
            });
            wc = wv.getWebContents ? wv.getWebContents() : remote.webContents.fromId(wv.getWebContentsId());
            setting?.setProxy?.();
            wc.setAudioMuted(setting.isMuted);
            if (!this.showDevToolInTab) {
                return;
            }
            if (wc.devToolsWebContents) {
                return;
            }
            if (!bv) {
                var _0x5c450f = (_0x173840.getWebContents ? _0x173840.getWebContents() : remote.webContents.fromId(_0x173840.getWebContentsId())).getWebPreferences();
                bv = new BrowserView({
                    backgroundColor: "#2e2c29",
                    webPreferences: _0x5c450f
                });
                bv.setBounds({
                    x: _0x173840.offsetLeft,
                    y: _0x173840.offsetTop,
                    width: _0x173840.offsetWidth,
                    height: _0x173840.offsetHeight
                });
                window.addEventListener("resize", () => {
                    v.syncBv();
                });
            }
            dwv = _0x173840;
            let _0x5045bb = bv.webContents;
            window.dwc = _0x5045bb;
            wc.setDevToolsWebContents(_0x5045bb);
            wc.openDevTools();
            // TOLOOK
            wc.debugger.attach();
            // TOLOOK
            wc.debugger.on("message", async function (_0x125d65, _0x42da33, _0x5d6414) {
                if (_0x42da33 == "Debugger.paused") {
                    v.openDevToolsTab();
                    if (!(await _0x5045bb.executeJavaScript("Common.settings.moduleSetting('disablePausedStateOverlay').get()"))) {
                        _0x5045bb.executeJavaScript("Common.settings.moduleSetting('disablePausedStateOverlay').set(true)");
                    }
                } else { }
            });
            // TOLOOK
            await wc.debugger.sendCommand("Debugger.enable");
            // TOLOOK
            await wc.debugger.sendCommand("Debugger.setBreakpointsActive", {
                active: false
            });
            // TOLOOK
            setTimeout(async () => {
                _0x5045bb.executeJavaScript("Common.settings.moduleSetting('breakpointsActive').set(true)");
            }, 1000);
        });
        wv.addEventListener("did-finish-load", () => {
            v.clearTree();
        });
        function _0x2f89e5 (_0x5a1562) {
            if (!bv || !setting.showDevToolInTab) {
                return;
            }
            let _0x18d845 = bv.webContents;
            let _0x3bb471 = `(async function(){
                let sdk;
                try{
                    sdk = await import("devtools://devtools/bundled/core/sdk/sdk.js");
                    
                }catch(e){
                    if(!sdk){
                        sdk = await import("devtools://devtools/bundled/sdk/sdk.js");
                    }
                }
                let n = sdk.NetworkManager;
                SDK.multitargetNetworkManager.setNetworkConditions(n["` + _0x5a1562 + `"]);
            })()
            `;
            _0x18d845.executeJavaScript(_0x3bb471);
        }
        wv.addEventListener("ipc-message", _0x15f913 => {
            const {
                args: _0x5715d2,
                channel: _0x43afd5
            } = _0x15f913;
            switch (_0x43afd5) {
                case "switchFast3G":
                    _0x2f89e5("Fast3GConditions");
                    break;
                case "switchSlow3G":
                    _0x2f89e5("Slow3GConditions");
                    break;
                case "switchOffline":
                    _0x2f89e5("OfflineConditions");
                    break;
                case "switchOnline":
                    _0x2f89e5("NoThrottlingConditions");
                    break;
                case "gameState":
                    this.gamePaused = _0x5715d2[0];
                    break;
                case "locateNode":
                    if (setting.simpleMode) {
                        setting.toggleSimpleMode();
                    }
                    this.locateNode(_0x5715d2[0]);
                    break;
                case "consoleLog":
                case "consoleError":
                case "consoleWarn":
                    this.pushLog(new Date().toLocaleTimeString(), _0x43afd5, _0x5715d2[0]);
                    break;
                case "canUpdateTree":
                    this.canUpdateTree = _0x5715d2[0];
                    break;
                case "updateTree":
                    __tempNodeTree = _0x5715d2[0];
                    this.treeUpdate = 0;
                    break;
                case "sendStatistic":
                    this.statistics = _0x5715d2[0];
                    break;
                case "showNodeDetail":
                    if (this.nodeDetail) {
                        delete this.nodeDetail.gobjName;
                        Object.assign(this.nodeDetail, _0x5715d2[0]);
                    } else {
                        this.nodeDetail = _0x5715d2[0];
                    }
                    break;
            }
        });
    },
    data: {
        bigThan3_8_0: false,
        iconMap: {},
        treeUpdate: 0,
        logUpdate: 0,
        gamePaused: false,
        canUpdateTree: false,
        logs: [],
        nodeTree: null,
        openNodes: new Set(),
        selectedNode: "",
        needScrollOneTime: false,
        nodeDetail: null,
        port: null,
        showResolutionSelector: false,
        designMode: false,
        tab: 0,
        mode: 0,
        urlParams: "",
        hover: 0,
        hide3dRootNode: false,
        dragingSN: null,
        dragingEN: null,
        lockNode: null,
        isMuted: false,
        showSceneDetail: false
    },
    watch: {
        tab: function (_0x4e7f41, _0x15f3be) {
            this.syncBv();
        }
    },
    computed: {
        useChinese () {
            return setting.useChinese;
        },
        showDevToolInTab () {
            return setting.showDevToolInTab;
        },
        designBtnStyle () {
            if (this.designMode) {
                return "position:relative;color:rgb(52, 146, 235);";
            } else {
                return "position:relative;";
            }
        },
        hoverBtnStyle () {
            if (this.hover) {
                return "position:relative;color:rgb(52, 146, 235);";
            } else {
                return "position:relative;";
            }
        },
        resolutionBtnStyle () {
            if (this.showResolutionSelector) {
                return "color:rgb(52, 146, 235);";
            } else {
                return "";
            }
        },
        hoverMark () {
            switch (this.hover) {
                case 0:
                    return "";
                case 1:
                    return "2D";
                case 2:
                    return "3D";
            }
        },
        disableWebSec () {
            return setting.disableWebSec;
        },
        winTitle () {
            let _0x406adf = "Cocos Inspector v" + PKG_VERSION;
            let _0x2da9f6 = {
                0: "preview Mode",
                1: "build Mobile Mode",
                2: "Custom Page",
                3: "build Desktop Mode"
            }[this.mode];
            return _0x406adf + " - " + _0x2da9f6;
        },
        gameUrl () {
            if (this.mode == 2 && setting.customUrl) {
                return setting.customUrl;
            }
            let _0x3155e6 = "";
            if (this.mode > 0) {
                _0x3155e6 = this.mode == 1 ? "web-mobile/web-mobile/index.html" : "web-desktop/web-desktop/index.html";
            }
            let _0x4e9b6a = this.urlParams.trim();
            if (_0x4e9b6a != "") {
                _0x3155e6 += _0x4e9b6a.startsWith("?") ? _0x4e9b6a : "?" + _0x4e9b6a;
            }
            return "http://localhost:" + this.port + "/" + _0x3155e6;
        },
        pauseIcon () {
            return "iconfont " + (this.gamePaused ? "icon-bofangsanjiaoxing" : "icon-iconfront-");
        },
        showRefreshTreeBtn () {
            return this.canUpdateTree && !setting.autoUpdateTree;
        },
        sceneName () {
            if (this.nodeTree) {
                return this.nodeTree.name;
            } else {
                return "";
            }
        },
        smallLogs () {
            if (setting.logCount == 0) {
                return [];
            }
            return this.logs.slice(-setting.logCount);
        },
        bigLogs () {
            return this.logs.slice(-100);
        }
    },
    created () {
        this.checkUrlParams();
        let _0x4e6f35 = location.search.slice(1).split("&");
        this.port = _0x4e6f35[0].split("=")[1];
        this.mode = _0x4e6f35[1].split("=")[1];
        this.switchMode(this.mode);
        this.$nextTick().then(() => {
            this.$el.style.visibility = "visible";
        });
        requestAnimationFrame(this.everyFrame);
        this.$nextTick().then(() => {
            let _0x3bb851 = document.querySelector(".validatePanel");
            if (!_0x3bb851) {
                alert("remove")
                this.$el.remove();
            }
            this.pushNormalLog(this.useChinese ? "Cocos Inspector v" + PKG_VERSION + "启动完成" : "Cocos Inspector v" + PKG_VERSION + " launched");
        });
    },
    methods: {
        openDevToolsTab (_0x327930 = false) {
            this.tab = 1;
            if (_0x327930) {
                try {
                    dwc?.executeJavaScript?.("UI.actionRegistry.action('quickOpen.show').execute()");
                    this.$nextTick().then(function () {
                        dwc?.focus?.();
                    });
                } catch (_0x439a43) { }
            }
        },
        overNode (_0x148b5d, _0x559101 = []) {
            wv.executeJavaScript("if(window[\"__drawRect\"])__drawRect('" + _0x148b5d + "', " + JSON.stringify(_0x559101) + ")");
        },
        outNode () {
            wv.executeJavaScript("if(window[\"__clearRect\"])__clearRect()");
        },
        syncBv () {
            if (bv && this.tab == 1 && setting.showDevToolInTab && dwv && !setting.show && !this.$refs.help.show && setting.orderNum) {
                remote.getCurrentWindow().addBrowserView(bv);
                bv.setBounds({
                    x: 0,
                    y: 0,
                    width: 2,
                    height: 2
                });
                this.$nextTick().then(() => {
                    this.$nextTick().then(() => {
                        bv.setBounds({
                            x: dwv.offsetLeft,
                            y: dwv.offsetTop,
                            width: dwv.offsetWidth,
                            height: dwv.offsetHeight
                        });
                    });
                });
            } else {
                remote.getCurrentWindow().removeBrowserView(bv);
            }
        },
        toggleSceneDetail () {
            this.showSceneDetail = true;
            this.selectNode("");
            wv.executeJavaScript("__getSceneDetail()");
        },
        toggleDrag (_0x4150e7) {
            if (this.lockNode != _0x4150e7) {
                this.lockNode = _0x4150e7;
            } else {
                this.lockNode = null;
            }
            if (this.lockNode && !this.designMode) {
                this.toggleDesignMode();
            }
            wv.executeJavaScript("__toggleDrag('" + this.lockNode + "')");
        },
        async syncOpenFcom (_0x3d24c4) {
            return await wv.executeJavaScript("__syncOpenFcom('" + _0x3d24c4 + "')");
        },
        syncOpen (_0x104ac0, _0x347edd, _0x364107 = true) {
            if (_0x347edd) {
                this.openNodes.add(_0x104ac0);
            } else {
                this.openNodes.delete(_0x104ac0);
            }
            wv.executeJavaScript("__syncOpen('" + _0x104ac0 + "', " + _0x347edd + ", " + _0x364107 + ")");
        },
        toggleSnd () {
            setting.toggleSnd();
        },
        everyFrame () {
            if (!this.simpleMode && this.treeUpdate == 1 && __tempNodeTree) {
                this.nodeTree = __tempNodeTree;
                if (this.needScrollOneTime) {
                    this.$nextTick().then(() => {
                        let _0x384386 = document.querySelector("#selectedNode");
                        if (_0x384386) {
                            _0x384386.firstElementChild.scrollIntoViewIfNeeded();
                        }
                    });
                    this.needScrollOneTime = false;
                }
                __tempNodeTree = null;
            }
            if (__tempLogs.length > 0) {
                this.logs.push(...__tempLogs);
                this.scrollLogToBottom();
                __tempLogs.length = 0;
            }
            requestAnimationFrame(this.everyFrame);
            if (this.treeUpdate < 1) {
                this.treeUpdate++;
            }
            if (this.logUpdate < 1) {
                this.logUpdate++;
            }
        },
        checkUrlParams () {
            if (setting.urlParams != this.urlParams) {
                this.urlParams = setting.urlParams;
                return true;
            } else {
                return false;
            }
        },
        showAppMenu (_0x583718) {
            if (_0x583718.target instanceof HTMLInputElement) {
                return;
            }
            if (_0x583718.target instanceof HTMLButtonElement) {
                return;
            }
            remote.getCurrentWindow().focus();
            appMenu.popup(remote.getCurrentWindow());
        },
        showMenu () {
            remote.getCurrentWindow().focus();
            treeMenu.popup(remote.getCurrentWindow());
        },
        switchMode (_0x20a8af) {
            this.mode = _0x20a8af;
            remote.getCurrentWindow().title = this.winTitle;
            if (_0x20a8af == 2 && !setting.customUrl) {
                this.pushWarnLog(this.useChinese ? "还未设置自定义页面" : "The custom page has not been set up");
            }
        },
        pushLog (_0x474874, _0x59f59b, _0x579fa3) {
            if (!_0x474874) {
                _0x474874 = new Date().toLocaleTimeString();
            }
            __tempLogs.push({
                time: _0x474874,
                t: _0x59f59b,
                d: _0x579fa3
            });
            this.logUpdate = 0;
        },
        pushNormalLog (_0x4f999d) {
            this.pushLog(null, "consoleLog", _0x4f999d);
        },
        pushWarnLog (_0xbddf1) {
            this.pushLog(null, "consoleWarn", _0xbddf1);
        },
        scrollLogToBottom () {
            let _0x5e8170 = this.$refs.logs;
            this.$nextTick(function () {
                _0x5e8170.scrollTop = _0x5e8170.scrollHeight;
            });
        },
        forceUpdateTree () {
            this.canUpdateTree = false;
            wv.executeJavaScript("__updateTree()");
        },
        selectNode (_0x335340, _0x38fbbb = true) {
            this.selectedNode = _0x335340;
            this.$emit("selectedNode_changed");
            if (!_0x38fbbb) {
                return;
            }
            if (_0x335340 == "") {
                return;
            }
            wv.executeJavaScript("__getNodeDetail('" + _0x335340 + "')");
        },
        locateNode (_0xe620cb) {
            this.tab = 0;
            let _0x4c1275 = _0xe620cb.slice(-1)[0];
            let _0x23bbe8 = new Set(_0xe620cb);
            _0x23bbe8.delete(_0x4c1275);
            _0x23bbe8.forEach(_0x2a9aa1 => {
                this.openNodes.add(_0x2a9aa1);
            });
            this.needScrollOneTime = true;
            wv.executeJavaScript("__locateNode([" + _0xe620cb.map(_0x34cc2e => "\"" + _0x34cc2e + "\"") + "])");
            __lastNodeSet = _0x23bbe8;
            this.$emit("locateNode", _0x23bbe8);
            this.selectNode(_0x4c1275, false);
        },
        toggleNode (_0x5c4796) {
            if (this.openNodes.has(_0x5c4796)) {
                this.openNodes.delete(_0x5c4796);
            } else {
                this.openNodes.add(_0x5c4796);
            }
        },
        logColor (_0x3467f4) {
            switch (_0x3467f4) {
                case "consoleLog":
                    return "unset";
                case "consoleError":
                    return "red";
                case "consoleWarn":
                    return "#cc9138";
            }
        },
        playOrPause () {
            if (this.gamePaused) {
                wv.executeJavaScript("cc.game.resume()");
            } else {
                wv.executeJavaScript("cc.game.pause()");
            }
        },
        refresh () {
            if (!v.checkUrlParams()) {
                wv.reloadIgnoringCache();
            }
            this.clearTree();
        },
        clearTree () {
            this.nodeTree = null;
            this.selectedNode = null;
            this.nodeDetail = null;
            this.openNodes.clear();
            __lastNodeSet?.clear();
        },
        toggleFps () {
            setting.toggleFps();
        },
        toggleDesignMode () {
            this.designMode = !this.designMode;
            wv.executeJavaScript("__toggleDesignMode(" + this.designMode + ")");
        },
        toggleHover () {
            this.hover = this.hover == 0 ? 1 : 0;
            wv.executeJavaScript("__setHover(" + this.hover + ")");
        },
        toggle3dHover () {
            this.hover = this.hover == 0 ? 2 : 0;
            wv.executeJavaScript("__setHover(" + this.hover + ")");
        },
        compile () {
            this.pushLog(new Date().toLocaleTimeString(), "consoleLog", "reCompiling...");
            wv.executeJavaScript("__reCompile()");
        },
        openWvDevTool () {
            wv.openDevTools();
        },
        showSetting () {
            setting.show = !setting.show;
        },
        showHelp () {
            v.$refs.help.show = true;
        }
    }
});
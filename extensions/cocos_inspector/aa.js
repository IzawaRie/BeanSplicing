if (!window.__initLogListeners) {
    var __nd = {};
    var __lastAtlasId = null;
    var __dc = false;
    var __showFps = false;
    function __toggleDC () {
        __dc = !__dc;
        __readyUpdateTree();
    }
    function __getGobjName (_0x39bc9e) {
        let _0x357bcf = _0x39bc9e.name;
        if (!_0x357bcf) {
            if (_0x39bc9e.packageItem) {
                _0x357bcf = _0x39bc9e.packageItem.name;
            } else if (_0x39bc9e.constructor) {
                _0x357bcf = _0x39bc9e.constructor.name;
            }
        }
        return _0x357bcf;
    }
    var __et = null;
    var __nodeEvents = null;
    function __aa (_0x7a4b06, _0x2c9b76, _0x42f9eb = 255, _0x160577 = true) {
        if (!__et) {
            __et = cc.Node.EventType;
        }
        if (!__nodeEvents) {
            __nodeEvents = [__et.TRANSFORM_CHANGED, __et.SIZE_CHANGED, __et.COLOR_CHANGED];
        }
        let _0x4d886d = _0x2c9b76 instanceof cc.Scene;
        _0x7a4b06.name = _0x2c9b76.name;
        _0x7a4b06.id = _0x2c9b76._id;
        _0x7a4b06.isFairyCom = false;
        _0x7a4b06.breaks = __breakPoints[_0x7a4b06.id];
        _0x7a4b06.autoUpdate = !__donotAutoUpdates[_0x7a4b06.id];
        _0x7a4b06.isPrefab = _0x2c9b76._prefab != null;
        if (_0x7a4b06.isPrefab && _0x2c9b76._prefab.root) {
            _0x7a4b06.isLinkedPrefab = _0x2c9b76._prefab.root._prefab.asset != null;
            try {
                _0x7a4b06.isPrefabRoot = _0x2c9b76._prefab.root == _0x2c9b76;
            } catch (_0x4f8300) { }
            if (_0x7a4b06.isPrefabRoot && __prefabModifyDict[_0x7a4b06.id]) {
                _0x7a4b06.prefabChanged = true;
            }
        }
        if (_0x2c9b76.$gobj && window.fgui) {
            let _0x46ca23 = _0x2c9b76.$gobj;
            _0x7a4b06.gobjName = __getGobjName(_0x46ca23);
            _0x7a4b06.isFairyCom = _0x46ca23 instanceof fgui.GComponent;
        }
        _0x7a4b06.active = _0x4d886d ? true : _0x2c9b76.active;
        if (_0x7a4b06.name.length == 0 && _0x2c9b76 instanceof cc.Scene) {
            _0x7a4b06.name = "CurrentScene";
        }
        _0x7a4b06.selected = false;
        let _0x1d218f = true;
        _0x7a4b06.activeInHierarchy = _0x2c9b76 instanceof cc.Scene ? true : _0x2c9b76.activeInHierarchy;
        let _0x4c3b6f = _0x7a4b06.opacityInHierarchy = Number(_0x42f9eb && (_0x2c9b76._uiProps?.opacity || 1));
        if (!_0x4d886d) {
            _0x7a4b06.isMeshRender = cc.js.getClassName(_0x2c9b76.getComponent(cc.RenderableComponent)) == "cc.MeshRenderer";
        }
        if (!_0x4d886d && __dc && _0x7a4b06.activeInHierarchy && _0x2c9b76._uiProps.opacity && !(_0x2c9b76 instanceof cc.Scene)) {
            let _0x54db7a = _0x2c9b76.getComponent(cc.RenderableComponent);
            if (!_0x54db7a) {
                _0x54db7a = _0x2c9b76.getComponent("cc.UIRenderer");
            }
            if (_0x54db7a && _0x54db7a.enabled) {
                if (_0x54db7a instanceof cc.SpriteComponent) {
                    if (_0x54db7a.spriteFrame) {
                        let _0x59c60b = _0x54db7a.spriteFrame._texture;
                        if (_0x59c60b) {
                            _0x7a4b06.atlasId = _0x59c60b._id;
                        }
                    }
                } else if (_0x54db7a instanceof cc.LabelComponent) {
                    if (_0x54db7a._texture && _0x54db7a.string.length > 0) {
                        let _0x189f03 = _0x54db7a._texture._texture;
                        if (_0x189f03) {
                            _0x7a4b06.atlasId = _0x189f03._id;
                        }
                    }
                } else if (_0x54db7a instanceof cc.GraphicsComponent) {
                    if (_0x54db7a._impl || _0x54db7a.impl) {
                        _0x7a4b06.rtype = {
                            gh: 1
                        };
                        _0x7a4b06.atlasId = _0x54db7a._id;
                        _0x1d218f = false;
                    }
                } else if (_0x54db7a instanceof cc.Mask) {
                    _0x7a4b06.rtype = {
                        mk: 1
                    };
                    _0x7a4b06.atlasId = _0x54db7a._id;
                    _0x1d218f = false;
                } else {
                    _0x7a4b06.rtype = {
                        ot: 1
                    };
                }
            }
        }
        __checkNode(_0x2c9b76);
        let _0x243fb7 = 0;
        if (__dc && _0x4c3b6f && _0x7a4b06.activeInHierarchy) {
            if (_0x7a4b06.atlasId && __lastAtlasId != _0x7a4b06.atlasId) {
                if (_0x1d218f) {
                    _0x243fb7++;
                }
                __lastAtlasId = _0x7a4b06.atlasId;
            }
        }
        _0x7a4b06.childCount = _0x2c9b76.children.length;
        if (_0x160577 || __dc || __checkAllOneTime) {
            let _0x4c8a4d = _0x4d886d || __openedNodes[_0x7a4b06.id] != undefined;
            if (!__checkAllOneTime && !__dc && !_0x4c8a4d) {
                _0x7a4b06.children = [];
            } else {
                _0x7a4b06.children = _0x2c9b76.children.map(_0x47103d => {
                    __nd[_0x47103d._id] = _0x47103d;
                    return __aa({}, _0x47103d, _0x4c3b6f, _0x4c8a4d);
                });
            }
        } else {
            _0x7a4b06.children = [];
        }
        if (__dc) {
            if (_0x4c3b6f && _0x7a4b06.activeInHierarchy) {
                _0x7a4b06.children.forEach(_0x5192ab => {
                    _0x243fb7 += _0x5192ab.dc;
                });
                _0x7a4b06.dc = _0x243fb7;
                _0x7a4b06.rtype = _0x7a4b06.children.reduce((_0x486a22, _0xbc6637) => {
                    if (_0xbc6637.rtype) {
                        for (let _0x22aa32 in _0xbc6637.rtype) {
                            _0x486a22[_0x22aa32] = (_0x486a22[_0x22aa32] ?? 0) + _0xbc6637.rtype[_0x22aa32];
                        }
                    }
                    return _0x486a22;
                }, _0x7a4b06.rtype ?? {});
            } else {
                _0x7a4b06.dc = 0;
            }
        }
        if (!_0x160577) {
            _0x7a4b06.children = [];
        }
        return _0x7a4b06;
    }
    function __isNodeChecked (_0x54f4e) {
        return !_0x54f4e.__listened || _0x54f4e._eventProcessor && !_0x54f4e._eventProcessor.hasEventListener("__haha__");
    }
    var __checkAllOneTime = false;
    function __getNodeByUuidPath (_0x21f0a4, _0x13f0a7 = false) {
        let _0x3f07fa;
        for (let _0x308d3c of _0x21f0a4) {
            let _0x528647 = __nd[_0x308d3c];
            if (!_0x528647 && _0x3f07fa) {
                _0x528647 = _0x3f07fa.getChildByUuid(_0x308d3c);
                __nd[_0x308d3c] = _0x528647;
            }
            if (_0x528647) {
                _0x3f07fa = _0x528647;
                if (_0x13f0a7) {
                    __checkNode(_0x528647);
                    __syncOpen(_0x308d3c, true, false);
                }
            }
        }
        return _0x3f07fa;
    }
    function __locateNode (_0x3e90ad) {
        let _0x5a3753 = __getNodeByUuidPath(_0x3e90ad, true);
        if (_0x5a3753) {
            __readyUpdateTree();
            __getNodeDetail(_0x5a3753.uuid);
        }
    }
    function __checkNode (_0x22ac83) {
        if (__isNodeChecked(_0x22ac83)) {
            _0x22ac83.off(__et.MOUSE_ENTER, __onHoverNode);
            _0x22ac83.off(__et.MOUSE_LEAVE, __onHoverNode);
            if ((_0x22ac83.getComponent(cc.RenderableComponent) || _0x22ac83.getComponent("cc.UIRenderer")) && _0x22ac83.getComponent(cc.UITransformComponent)) {
                _0x22ac83.on(__et.MOUSE_ENTER, __onHoverNode);
                _0x22ac83.on(__et.MOUSE_LEAVE, __onHoverNode);
            }
            let _0x2392fc = function (_0x2b159a) {
                if (__hasBreakPoint(_0x22ac83._id, _0x2b159a)) {
                    // TOLOOK
                    debugger;
                }
            };
            let _0x44aaa7 = function (_0x44ec43) {
                _0x2392fc(_0x44ec43);
                if (__syncNodeDetail && _0x22ac83 == __lastDetalNode) {
                    __readyGetNodeDetail();
                }
            };
            __nodeEvents.forEach(_0x354569 => {
                _0x22ac83.on(_0x354569, function (_0x2e8bb6) {
                    _0x44aaa7(_0x354569 == __et.TRANSFORM_CHANGED ? cc.Node.TransformBit[_0x2e8bb6] : _0x354569);
                });
            });
            _0x22ac83.on(__et.CHILD_REMOVED, function (_0x14ccd9) {
                __deleteFromDt(_0x14ccd9);
                __readyUpdateTree(false, _0x22ac83);
                _0x2392fc(__et.CHILD_REMOVED);
            });
            _0x22ac83.on(__et.CHILD_ADDED, function (_0x3eab10) {
                __readyUpdateTree(false, _0x22ac83);
                _0x2392fc(__et.CHILD_ADDED);
            });
            _0x22ac83.on(__et.LAYER_CHANGED, function () {
                _0x2392fc(__et.LAYER_CHANGED);
            });
            _0x22ac83.on(__et.SIBLING_ORDER_CHANGED, function (_0x51e5e6) {
                __readyUpdateTree(false, _0x22ac83);
                _0x2392fc(__et.SIBLING_ORDER_CHANGED);
            });
            _0x22ac83.on("__haha__", __readyUpdateTree);
            _0x22ac83.on("active-in-hierarchy-changed", function (_0x251c95) {
                if (_0x22ac83.parent) {
                    __readyUpdateTree(false, _0x22ac83);
                }
                _0x44aaa7("active-in-hierarchy-changed");
                if (__statistic) {
                    __nodeLogs.push([Date.now(), [_0x251c95._id, _0x251c95.name]]);
                }
            });
            _0x22ac83.__listened = true;
        }
    }
    var __statistic = false;
    var __nodeLogs = [];
    function __initLogListeners () { }
    var __lockDragNode = null;
    function __toggleDrag (_0x3dfe17) {
        __lockDragNode = _0x3dfe17;
    }
    var __donotAutoUpdates = {};
    function __donotAutoUpdate (_0x1b2dad) {
        if (__donotAutoUpdates[_0x1b2dad]) {
            delete __donotAutoUpdates[_0x1b2dad];
        } else {
            __donotAutoUpdates[_0x1b2dad] = true;
        }
        __readyUpdateTree();
    }
    var __breakPoints = {};
    function __setBreakPoint (_0x25d1a6, _0x59fcfe, _0x2705b4) {
        if (!__breakPoints[_0x25d1a6]) {
            __breakPoints[_0x25d1a6] = {};
        }
        __breakPoints[_0x25d1a6][_0x2705b4 || _0x59fcfe] = true;
        __readyUpdateTree();
    }
    function __hasBreakPoint (_0x487164, _0x339920) {
        if (!__breakPoints[_0x487164]) {
            return false;
        }
        return __breakPoints[_0x487164][_0x339920];
    }
    function __removeBreakPoint (_0x30198c) {
        delete __breakPoints[_0x30198c];
        __readyUpdateTree();
    }
    function __removeAllBreakPoint () {
        __breakPoints = {};
        __readyUpdateTree();
    }
    var retryTime = 0;
    function __initSf (_0x24d9ed = false) {
        if (!window.cc) {
            if (retryTime < 30) {
                // TOLOOK
                setTimeout(() => {
                    __initSf(true);
                }, 100);
                retryTime++;
                return;
            }
            if (_0x24d9ed) {
                console.error("maybe this is not a CocosCreator Game");
            }
            return;
        }
        cc.log = console.log;
        cc.warn = console.warn;
        cc.error = console.error;
        if (cc.ENGINE_VERSION.startsWith("3.")) {
            cc.Sprite = cc.SpriteComponent;
            cc.Label = cc.LabelComponent;
            cc.Widget = cc.WidgetComponent;
            cc.Layout = cc.LayoutComponent;
        }
        if (CC_PREVIEW && !cc.ENGINE_VERSION.startsWith("1.")) {
            window.addEventListener("resize", function (_0x5bc6a4) {
                __resizeCvn();
            }, {
                capture: true
            });
        }
        cc.director.on(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
            __checkHover();
            __removeOtherNodes();
            __readyUpdateTree(true);
            // TOLOOK
            setTimeout(() => {
                let _0x4576c2 = cc.view.getDesignResolutionSize();
                cc.view.setDesignResolutionSize(_0x4576c2.width, _0x4576c2.height, cc.view.getResolutionPolicy());
            }, 0);
            sendGameState(cc.game.isPaused());
            __toggleFps(__showFps);
        });
        if (cc.director.getScene()) {
            __readyUpdateTree(true);
        }
        let _0x4a92b5 = cc.game.pause;
        cc.game.pause = function () {
            _0x4a92b5.call(cc.game);
            sendGameState(cc.game.isPaused());
        };
        let _0x3b2828 = cc.game.resume;
        cc.game.resume = function () {
            _0x3b2828.call(cc.game);
            sendGameState(cc.game.isPaused());
        };
        cc._isContextMenuEnable = true;
    }
    var __designMode = false;
    function __toggleDesignMode (_0x4c62b4) {
        __designMode = _0x4c62b4;
        __checkHover();
        if (!_0x4c62b4) {
            __clearRect();
        }
    }
    var __setHover = _0x33bf3c => {
        __hover = _0x33bf3c;
        __checkHover();
        if (!_0x33bf3c) {
            __clearRect();
        }
    };
    var __checkHover = () => {
        if (!__moreThen3_4_0()) {
            __unRegisterHover(cc.director.getScene());
        }
        __unRegisterHover(cc.director.getScene()?.getComponentInChildren(cc.CanvasComponent)?.node);
        if (__hover || __designMode) {
            if (!__moreThen3_4_0()) {
                __registerHover(cc.director.getScene());
            }
            __registerHover(cc.director.getScene()?.getComponentInChildren(cc.CanvasComponent)?.node);
        }
        __checkAllOneTime = true;
        __readyUpdateTree();
    };
    var __moreThen3_6_0 = () => {
        let _0x5240d1 = cc.ENGINE_VERSION.split(".");
        return _0x5240d1[0] >= 3 && _0x5240d1[1] >= 6;
    };
    var __moreThen3_4_0 = () => {
        let _0x19358c = cc.ENGINE_VERSION.split(".");
        return _0x19358c[0] >= 3 && _0x19358c[1] >= 4;
    };
    var __registerHover = _0x46d750 => {
        if (!_0x46d750) {
            return;
        }
        if (!__et) {
            __et = cc.Node.EventType;
        }
        _0x46d750.on(__et.TOUCH_CANCEL, __hoverF, null, true);
        _0x46d750.on(__et.TOUCH_MOVE, __hoverF, null, true);
        _0x46d750.on(__et.TOUCH_START, __hoverF, null, true);
        _0x46d750.on(__et.MOUSE_MOVE, __mouseMove, null, true);
        _0x46d750.on(__et.TOUCH_END, __touchHover, null, true);
    };
    var __unRegisterHover = _0x5dc3d9 => {
        if (!_0x5dc3d9) {
            return;
        }
        if (!__et) {
            __et = cc.Node.EventType;
        }
        _0x5dc3d9.off(__et.TOUCH_CANCEL, __hoverF, null, true);
        _0x5dc3d9.off(__et.TOUCH_MOVE, __hoverF, null, true);
        _0x5dc3d9.off(__et.TOUCH_START, __hoverF, null, true);
        _0x5dc3d9.off(__et.MOUSE_MOVE, __mouseMove, null, true);
        _0x5dc3d9.off(__et.TOUCH_END, __touchHover, null, true);
    };
    var __onHoverNode = _0x59595f => {
        if (_0x59595f.type == cc.Node.EventType.MOUSE_LEAVE) {
            __clearRect();
            __lastHoverNode = null;
            return;
        }
        if (__hover == 1 || __designMode) {
            if (__designMode && __lastDesignNode) {
                return;
            }
            let _0x58cfc1 = _0x59595f.target;
            if (__designMode) {
                _0x58cfc1 = __nd[__lockDragNode] || _0x58cfc1;
            }
            __drawRect(_0x58cfc1.uuid);
            __lastHoverNode = _0x58cfc1;
            _0x59595f.propagationStopped = true;
            _0x59595f.propagationImmediateStopped = true;
            return;
        }
    };
    var __ray;
    var __mouseMove = _0x57f302 => {
        if (__hover == 2) {
            if (!__ray) {
                __ray = new cc.geometry.Ray();
            }
            let _0x5bba63 = cc.director.getScene().getComponentInChildren(cc.CameraComponent);
            let _0x467624 = _0x57f302.getLocation();
            _0x5bba63.screenPointToRay(_0x467624.x, _0x467624.y, __ray);
            let _0x185b4d = cc.director.getScene().getComponentsInChildren(cc.ModelComponent || "cc.MeshRenderer").filter(_0x3f20ad => {
                return _0x3f20ad.model && _0x3f20ad.node.activeInHierarchy;
            }).map(_0x563b78 => {
                return [_0x563b78, cc.geometry.intersect.rayModel(__ray, _0x563b78.model)];
            }).filter(_0x38722c => _0x38722c[1] > 0);
            let _0x121de7 = _0x185b4d.sort((_0x4634ea, _0x29345f) => {
                return _0x4634ea[1] - _0x29345f[1];
            })[0];
            if (_0x121de7) {
                __lastHoverNode = _0x121de7[0].node;
                __drawRect(__lastHoverNode.uuid);
            }
        }
    };
    var __touchHover = _0x5c638f => {
        if (__hover || __designMode) {
            if (__hover && __lastHoverNode) {
                let {
                    uuidPath: _0x31310c
                } = __getPath(__lastHoverNode);
                locateNode(_0x31310c);
            }
            if (__designMode && __lastDesignNode) {
                let {
                    uuidPath: _0x264550
                } = __getPath(__lastDesignNode);
                locateNode(_0x264550);
                __drawRect(__lastDesignNode.uuid);
                __lastDesignNode = null;
            }
            if (_0x5c638f) {
                _0x5c638f.propagationStopped = true;
                _0x5c638f.propagationImmediateStopped = true;
            }
            return;
        }
    };
    var __lastHoverNode = null;
    var __lastDesignNode = null;
    var __hoverF = _0x58ef78 => {
        if (__hover || __designMode) {
            _0x58ef78.propagationStopped = true;
            _0x58ef78.propagationImmediateStopped = true;
            if (__designMode) {
                if (!__et) {
                    __et = cc.Node.EventType;
                }
                switch (_0x58ef78.type) {
                    case __et.TOUCH_START:
                        __lastDesignNode = __lastHoverNode;
                        if (__lastDesignNode && __lastDesignNode.isValid) {
                            if (__lastDesignNode.parent) {
                                let _0x582ea6 = __lastDesignNode.parent.getComponent(cc.LayoutComponent);
                                if (_0x582ea6) {
                                    _0x582ea6.enabled = false;
                                }
                            }
                            let _0xb1a0f6 = __lastDesignNode.getComponent(cc.WidgetComponent);
                            if (_0xb1a0f6) {
                                _0xb1a0f6.enabled = false;
                            }
                        }
                        break;
                    case __et.TOUCH_MOVE:
                        if (!__lastDesignNode.isValid) {
                            return;
                        }
                        let _0xb669f0 = _0x58ef78.getUIDelta();
                        let _0x3a2090 = __lastDesignNode?.position;
                        if (!_0x3a2090) {
                            break;
                        }
                        _0x3a2090.add3f(_0xb669f0.x, _0xb669f0.y, 0);
                        __lastDesignNode?.setPosition(_0x3a2090);
                        break;
                    case __et.TOUCH_CANCEL:
                        __touchHover();
                        break;
                }
            }
            return;
        }
    };
    function __updateResize () {
        if (!CC_PREVIEW) {
            return;
        }
        let _0x572801 = cc.director.getScene();
        if (!_0x572801) {
            return;
        }
        cc.director.getScene().getComponentsInChildren(cc.WidgetComponent).forEach(_0x5af97d => {
            if (_0x5af97d.isValid) {
                if (cc.WidgetComponent.AlignMode) {
                    if (_0x5af97d.alignMode == cc.WidgetComponent.AlignMode.ON_WINDOW_RESIZE) {
                        _0x5af97d.updateAlignment();
                    }
                } else if (_0x5af97d.enabledInHierarchy) {
                    _0x5af97d.updateAlignment();
                }
            }
        });
    }
    var __hover = 0;
    function __removeOtherNodes () {
        let _0x20b1d2 = document.querySelector("#content");
        let _0x5ef928 = _0x20b1d2?.querySelector(".footer");
        _0x5ef928?.remove();
        let _0x1fe644 = _0x20b1d2?.querySelector(".error");
        _0x1fe644?.remove();
        if (_0x20b1d2 && _0x20b1d2.parentElement != document.body) {
            document.body.append(_0x20b1d2);
        }
        let _0x3eea2a = document.querySelector(".wrapper");
        if (_0x3eea2a) {
            _0x3eea2a.style.border = "none";
        }
        let _0x50129b = document.querySelector(".contentWrap");
        if (_0x50129b) {
            _0x50129b.style.overflow = "hidden";
            _0x50129b.style.height = "100vh";
            _0x50129b.style.width = "100vw";
        }
        let _0xda2ec2 = document.createElement("div");
        _0xda2ec2.style.display = "none";
        document.body.append(_0xda2ec2);
        let _0x21d66e = Array.from(document.body.children);
        let _0x30fab9 = null;
        for (let _0x5547b5 = 0; _0x5547b5 < _0x21d66e.length; _0x5547b5++) {
            let _0x303ab6 = _0x21d66e[_0x5547b5];
            if (_0x303ab6 != _0xda2ec2) {
                if (!_0x303ab6.contains(cc.game.canvas)) {
                    _0xda2ec2.append(_0x303ab6);
                } else {
                    _0x30fab9 = _0x303ab6;
                }
            }
        }
        if (_0x30fab9) { }
        __resizeCvn();
    }
    function __resizeCvn () {
        if (CC_BUILD) {
            return;
        }
        let _0x46fab6 = cc.game.canvas;
        if (_0x46fab6) {
            __needRelocateGraphics = true;
            if (__moreThen3_4_0()) {
                cc.screen.windowSize = cc.size(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
                return;
            }
            if (!cc.ENGINE_VERSION.startsWith("1.") && cc.view.setFrameSize) {
                cc.view.setFrameSize(window.innerWidth, window.innerHeight);
                let _0x5099df = cc.view.getDesignResolutionSize();
                cc.view.setDesignResolutionSize(_0x5099df.width, _0x5099df.height, cc.view.getResolutionPolicy());
                __updateResize();
            } else {
                _0x46fab6.style.height = window.innerHeight + "px";
                _0x46fab6.style.width = window.innerWidth + "px";
            }
        }
    }
    function __reCompile () {
        let _0x4c8a09 = window.location.href + "update-db";
        let _0x2f3b23 = new XMLHttpRequest();
        _0x2f3b23.onreadystatechange = function () {
            if (_0x2f3b23.readyState === 4 && _0x2f3b23.status === 200) { }
        };
        _0x2f3b23.open("GET", _0x4c8a09, true);
        _0x2f3b23.send(null);
    }
    function __deleteFromDt (_0x4070b) {
        delete __nd[_0x4070b._id];
        if (_0x4070b.children) {
            _0x4070b.children.forEach(_0x4f8dcd => {
                __deleteFromDt(_0x4f8dcd);
            });
        }
    }
    function __toggleNode (_0x3c66e7) {
        let _0xe01b57 = __nd[_0x3c66e7];
        if (_0xe01b57) {
            _0xe01b57.active = !_0xe01b57.active;
        }
        if (_0xe01b57._prefab && _0xe01b57._prefab.root._prefab.asset) {
            __savePrefabInfo(_0xe01b57, "active", _0xe01b57.active);
        }
        __readyUpdateTree();
    }
    var stopSyncDetailOneTime = false;
    var __prefabModifyDict = {};
    function __getPrefabNode (_0x31f5dd) {
        let _0x184e2c = _0x31f5dd._prefab;
        let _0x24726c = _0x184e2c.root._id;
        if (!__prefabModifyDict[_0x24726c]) {
            __prefabModifyDict[_0x24726c] = {};
        }
        let _0x559870 = __prefabModifyDict[_0x24726c];
        if (!_0x559870[_0x184e2c.fileId]) {
            _0x559870[_0x184e2c.fileId] = {};
        }
        let _0x3074d9 = _0x559870[_0x184e2c.fileId];
        if (!_0x3074d9.nodeDetail) {
            _0x3074d9.nodeDetail = {};
        }
        return _0x3074d9;
    }
    function __savePrefabInfo (_0x142b2a, _0x237b67, _0x3c85af) {
        let _0x1c74db = _0x142b2a._prefab.root;
        var _0x106ab9 = !__prefabModifyDict[_0x1c74db.uuid];
        let _0x3e05bf = __getPrefabNode(_0x142b2a);
        _0x3e05bf.nodeDetail[_0x237b67] = _0x3c85af;
        return _0x106ab9;
    }
    function __getPrefabChanges (_0xfee077) {
        let _0x4775ea = __nd[_0xfee077];
        if (!_0x4775ea) {
            return {};
        }
        if (_0x4775ea._prefab && _0x4775ea._prefab.asset) {
            let _0x466329 = _0x4775ea._prefab.asset.data;
            if (!__prefabModifyDict[_0xfee077]) {
                return {};
            }
            let _0x2f3a06 = {};
            let _0x8bebb = _0x4775ea._prefab.asset._uuid;
            _0x2f3a06[_0x8bebb] = __prefabModifyDict[_0xfee077];
            return _0x2f3a06;
        }
        return {};
    }
    function __savePrefabComp (_0x3359c7, _0x3e1d45, _0x4caf55) {
        let _0x31596e = _0x3359c7.node;
        if (!_0x31596e) {
            return false;
        }
        let _0x5f0c4d = _0x31596e._prefab.root;
        var _0x569004 = !__prefabModifyDict[_0x5f0c4d.uuid];
        let _0x15a9db = __getPrefabNode(_0x31596e);
        let _0x205de0 = cc.js.getClassName(_0x3359c7);
        if (!_0x15a9db[_0x205de0]) {
            _0x15a9db[_0x205de0] = {};
        }
        let _0x60525a = _0x15a9db[_0x205de0];
        let _0x3747b3 = _0x31596e.getComponents(_0x3359c7.constructor).indexOf(_0x3359c7);
        if (!_0x60525a[_0x3747b3]) {
            _0x60525a[_0x3747b3] = {};
        }
        _0x60525a[_0x3747b3][_0x3e1d45] = _0x4caf55;
        return _0x569004;
    }
    function __getPrefabUuid (_0x1651d1) {
        let _0x2417c7 = __nd[_0x1651d1];
        if (!_0x2417c7) {
            return null;
        }
        if (_0x2417c7._prefab && _0x2417c7._prefab.asset) {
            return _0x2417c7._prefab.asset._uuid;
        }
        return null;
    }
    function __syncNode (_0x8d67c3, _0x3e4f43, _0x275a5b) {
        let _0x1ab9ec = __nd[_0x8d67c3];
        if (!_0x1ab9ec) {
            return;
        }
        stopSyncDetailOneTime = true;
        let _0x3a3c18 = _0x3e4f43.split(".");
        _0x275a5b = Number(_0x275a5b);
        let _0x37cfee = _0x3a3c18.length > 1 ? _0x1ab9ec[_0x3a3c18[0]][_0x3a3c18[1]] : _0x1ab9ec[_0x3e4f43];
        if (_0x37cfee != _0x275a5b) {
            let _0x2ec789 = false;
            if (_0x1ab9ec._prefab && _0x1ab9ec._prefab.root._prefab.asset) {
                _0x2ec789 = __savePrefabInfo(_0x1ab9ec, _0x3e4f43, _0x275a5b);
            }
            if (_0x3a3c18.length > 1) {
                _0x1ab9ec[_0x3a3c18[0]][_0x3a3c18[1]] = _0x275a5b;
                _0x1ab9ec[_0x3a3c18[0]] = _0x1ab9ec[_0x3a3c18[0]];
            } else {
                _0x1ab9ec[_0x3e4f43] = _0x275a5b;
            }
            if (_0x2ec789) {
                __readyUpdateTree(false, _0x1ab9ec);
            }
        }
        stopSyncDetailOneTime = false;
    }
    function __syncNodeColor (_0x343fd2, _0x45666d) {
        let _0x3488bf = __nd[_0x343fd2];
        _0x45666d = _0x45666d.map(_0x1811cd => _0x1811cd * 255);
        if (_0x3488bf) {
            _0x3488bf.color = cc.color(..._0x45666d);
        }
    }
    function __toggleFps (_0x48b70c) {
        if (!cc.debug) {
            cc.director.setDisplayStats(_0x48b70c);
            return;
        }
        cc.debug.setDisplayStats(_0x48b70c);
    }
    function __removeNode (_0x206a59) {
        let _0x1f8fce = __nd[_0x206a59];
        if (_0x1f8fce) {
            _0x1f8fce.removeFromParent();
        }
    }
    if (!window.fgui && window.System) {
        System.import("fairygui-cc", location.origin + "/scripting/x/mods/").then(_0x423c66 => {
            window.fgui = _0x423c66;
        }).catch(_0x391254 => { });
    }
    var __fcom = null;
    if (!__fcom && window.fgui) {
        try {
            __fcom = new fgui.GComponent();
        } catch (_0x8e2900) { }
    }
    function getComponentMethodNames (_0x375d3b) {
        let _0x3731e6 = Object.keys(_0x375d3b.__proto__);
        return _0x3731e6.filter(_0x4cd664 => {
            if (_0x4cd664 in cc.RenderableComponent.prototype || _0x4cd664.startsWith("_") || _0x4cd664.startsWith("get")) {
                return false;
            }
            let _0x42915c = _0x375d3b[_0x4cd664];
            return typeof _0x42915c == "function" && _0x42915c.length == 0 && _0x42915c.name != "warn";
        });
    }
    function __getSceneDetail () {
        __lastDesignNode = null;
        let _0x3aa5b5 = cc.director.getScene();
        if (!_0x3aa5b5) {
            return;
        }
        let _0x942140 = {
            name: _0x3aa5b5.name,
            isScene: true
        };
        let _0x91e05c = Object.keys(_0x3aa5b5._globals);
        _0x942140.coms = _0x91e05c.map(_0x43f2ab => {
            let _0x1c647b = _0x3aa5b5._globals[_0x43f2ab];
            if (typeof _0x1c647b == "object") {
                let _0x3ad9bf = __getComDetail(_0x1c647b, true);
                _0x3ad9bf.name = _0x43f2ab;
                _0x3ad9bf.isScene = true;
                return _0x3ad9bf;
            }
        });
        _0x942140.coms = _0x942140.coms.filter(_0x5530e6 => _0x5530e6 != undefined);
        _0x942140.includeComps = true;
        showNodeDetail(_0x942140);
    }
    function __getPropertyDetail (_0x39ee36, _0x22ff36, _0x3fefb9, _0x2d5c53 = false, _0x412bf8 = "") {
        let _0x4e6f8c = typeof _0x3fefb9;
        let _0x4ed454 = _0x39ee36.constructor.__attrs__;
        if (_0x4e6f8c != "function" && _0x4e6f8c != "object") {
            if (_0x4ed454 && (_0x4ed454[_0x22ff36 + "$_$type"] == "Enum" || _0x4ed454[_0x412bf8 + "$_$type"] == "Enum")) {
                return [(_0x4ed454[_0x22ff36 + "$_$enumList"] || _0x4ed454[_0x412bf8 + "$_$enumList"]).find(_0x893377 => {
                    return _0x893377.value == _0x3fefb9;
                }), "enum", _0x4ed454[_0x22ff36 + "$_$enumList"] || _0x4ed454[_0x412bf8 + "$_$enumList"]];
            } else {
                return [_0x3fefb9, _0x4e6f8c];
            }
        } else {
            if (_0x3fefb9 == null || _0x3fefb9 == undefined) {
                if (_0x4ed454) {
                    if (cc.js.isChildClassOf(_0x4ed454[_0x22ff36 + "$_$ctor"], cc.Asset)) {
                        return [cc.js.getClassName(_0x4ed454[_0x22ff36 + "$_$ctor"]).slice(3) + ":@null||null", "asset"];
                    }
                    if (cc.js.isChildClassOf(_0x4ed454[_0x22ff36 + "$_$ctor"], cc.Node)) {
                        return [cc.js.getClassName(_0x4ed454[_0x22ff36 + "$_$ctor"]).slice(3) + ":@null|null", "node"];
                    }
                    if (cc.js.isChildClassOf(_0x4ed454[_0x22ff36 + "$_$ctor"], cc.Component)) {
                        return [cc.js.getClassName(_0x4ed454[_0x22ff36 + "$_$ctor"]) + ":@null|null", "comp"];
                    }
                }
                return [_0x3fefb9];
            }
            if (_0x3fefb9 instanceof cc.Component) {
                if (!_0x3fefb9.node) {
                    return [cc.js.getClassName(_0x3fefb9) + ":@" + _0x3fefb9.uuid, "comp"];
                }
                const {
                    uuidPath: _0x3e379f
                } = __getPath(_0x3fefb9.node);
                return [cc.js.getClassName(_0x3fefb9) + ":@" + (_0x3fefb9.node ? _0x3fefb9.node.name : _0x3fefb9.node) + "|" + _0x3e379f.join("//"), "comp"];
            } else if (_0x3fefb9 instanceof cc.Asset) {
                let _0x36679e = _0x3fefb9._uuid;
                let _0x3c8e9e = _0x3fefb9.name;
                if (_0x3fefb9 instanceof cc.Material && _0x3c8e9e == "" && _0x36679e.length < 30) {
                    _0x3c8e9e = _0x36679e;
                    if (_0x3c8e9e == "" && _0x3fefb9.parent) {
                        _0x3c8e9e = _0x3fefb9.parent._uuid;
                    }
                }
                if (_0x3fefb9 instanceof cc.Prefab && _0x3c8e9e == "") {
                    _0x3c8e9e = _0x3fefb9.data.name;
                }
                return [cc.js.getClassName(_0x3fefb9).slice(3) + ":@" + _0x3c8e9e + "||" + _0x36679e, "asset"];
            } else if (_0x3fefb9 instanceof cc.Color) {
                return ["#" + _0x3fefb9.toHEX("#rrggbb"), "color"];
            } else if (_0x3fefb9 instanceof cc.ValueType) {
                return [_0x3fefb9.constructor.name + ":" + _0x3fefb9.toString(), "value"];
            } else if (_0x3fefb9.constructor == cc.Node) {
                const {
                    uuidPath: _0x215e10
                } = __getPath(_0x3fefb9);
                if (_0x22ff36 != "node") {
                    return ["Node:@" + _0x3fefb9.name + "|" + _0x215e10.join("//"), "node"];
                }
            } else if (!(_0x3fefb9 instanceof Function)) {
                if (window.fgui && _0x3fefb9 instanceof fgui.GObject) {
                    const {
                        uuidPath: _0x10601b
                    } = __getPath(_0x3fefb9.node);
                    if (_0x22ff36 != "node") {
                        return ["Node:@" + __getGobjName(_0x3fefb9) + "|" + _0x10601b.join("//"), "node"];
                    }
                } else if (Array.isArray(_0x3fefb9) && !_0x2d5c53) {
                    return [_0x3fefb9.map((_0x27d826, _0x3710ca) => {
                        return __getPropertyDetail(_0x39ee36, _0x3710ca, _0x27d826, true);
                    }), "array"];
                } else {
                    return ["$" + (_0x3fefb9.constructor ? _0x3fefb9.constructor.name : "object"), "obj"];
                }
            } else {
                return ["$" + (_0x3fefb9.constructor ? _0x3fefb9.constructor.name : "object"), "obj"];
            }
        }
    }
    function __getComDetail (_0x52518b, _0x31f8f3 = false) {
        let _0xa68607 = {};
        let _0x1c38a6 = _0x31f8f3 ? _0x52518b.constructor.__props__ : Object.keys(_0x52518b);
        for (let _0xc9cba9 of _0x1c38a6) {
            let _0x3dd91a = _0xc9cba9;
            if (_0x31f8f3) {
                if (CC_PREVIEW && _0xc9cba9.startsWith("_")) {
                    continue;
                }
                if (_0xc9cba9.startsWith("_") && _0x52518b[_0xc9cba9] === _0x52518b[_0xc9cba9.slice(1)]) {
                    _0xc9cba9 = _0xc9cba9.slice(1);
                }
                _0xa68607.isCC_COM = true;
            } else {
                _0xa68607.isCC_COM = false;
            }
            if (CC_BUILD && _0xc9cba9 in __buildFilter) {
                continue;
            }
            if (!(_0xc9cba9 in {
                name: "",
                uuid: "",
                enabled: ""
            }) && _0xc9cba9 in cc.Component.prototype) {
                continue;
            }
            _0xa68607[_0xc9cba9] = __getPropertyDetail(_0x52518b, _0xc9cba9, _0x52518b[_0xc9cba9], false, _0x3dd91a);
        }
        return _0xa68607;
    }
    var __buildFilter = {
        _prefab: "",
        _visFlags: "",
        _editorExtras__: "",
        __prefab: "",
        _name: "",
        _objFlags: "",
        _scriptAsset: ""
    };
    var __lastDetalNode;
    function __getNodeDetail (_0x3b944b, _0x51d927 = true) {
        if (!__fcom && window.fgui) {
            __fcom = new fgui.GComponent();
        }
        let _0x4fd00d = __nd[_0x3b944b];
        if (_0x4fd00d) {
            __lastDetalNode = _0x4fd00d;
            let {
                name: _0x4222b1,
                active: _0x4b07c6
            } = _0x4fd00d;
            let _0x558fed = _0x4fd00d.scale;
            let _0xda84c5 = {
                id: _0x3b944b,
                active: _0x4b07c6,
                isScene: false,
                name: _0x4222b1,
                position: _0x4fd00d.position,
                scale: _0x558fed,
                eulerAngles: _0x4fd00d.eulerAngles,
                opacity: _0x4fd00d._uiProps?.opacity || 1,
                layer: cc.Layers.Enum[_0x4fd00d.layer] || _0x4fd00d.layer
            };
            if (_0x51d927) {
                let _0x2d2ba8 = null;
                if (_0x4fd00d.$gobj) {
                    let _0x54ec04 = _0x4fd00d.$gobj;
                    let _0x11007f = Object.assign({}, _0x54ec04);
                    for (let _0x56f2e5 in __fcom) {
                        delete _0x11007f[_0x56f2e5];
                    }
                    _0x11007f.name = _0x54ec04.constructor.name;
                    _0x2d2ba8 = _0x11007f;
                    _0xda84c5.gobjName = __getGobjName(_0x54ec04);
                }
                let _0x4adf79 = _0x4fd00d._components.concat();
                if (_0x2d2ba8) {
                    _0x4adf79.unshift(_0x2d2ba8);
                }
                _0xda84c5.coms = _0x4adf79.map(_0x228ab6 => {
                    let _0x4657ae = __getComDetail(_0x228ab6, _0x228ab6 instanceof cc.Component);
                    if (_0x228ab6 instanceof cc.UITransformComponent) {
                        let {
                            width: _0x11bf07,
                            height: _0x1301af,
                            anchorX: _0x2626b2,
                            anchorY: _0x1c1f1e,
                            priority: _0x206735
                        } = _0x228ab6;
                        delete _0x4657ae.anchorPoint;
                        delete _0x4657ae.contentSize;
                        const _0x276a97 = {
                            width: _0x11bf07,
                            height: _0x1301af,
                            anchorX: _0x2626b2,
                            anchorY: _0x1c1f1e,
                            priority: _0x206735
                        };
                        for (let _0x177502 in _0x276a97) {
                            _0x4657ae[_0x177502] = [_0x276a97[_0x177502], typeof _0x276a97[_0x177502]];
                        }
                    }
                    if (_0x228ab6 instanceof cc.ButtonComponent) {
                        if (_0x228ab6.transition != cc.ButtonComponent.Transition.SPRITE) {
                            delete _0x4657ae.hoverSprite;
                            delete _0x4657ae.pressedSprite;
                            delete _0x4657ae.disabledSprite;
                            delete _0x4657ae.normalSprite;
                        }
                        if (_0x228ab6.transition != cc.ButtonComponent.Transition.COLOR) {
                            delete _0x4657ae.hoverColor;
                            delete _0x4657ae.pressedColor;
                            delete _0x4657ae.disabledColor;
                            delete _0x4657ae.normalColor;
                        }
                        if (_0x228ab6.transition != cc.ButtonComponent.Transition.SCALE) {
                            delete _0x4657ae.zoomScale;
                        }
                    }
                    if (_0x228ab6 instanceof cc.SpriteComponent && _0x228ab6.type != cc.SpriteComponent.Type.FILLED) {
                        delete _0x4657ae.fillType;
                        delete _0x4657ae.fillRange;
                        delete _0x4657ae.fillStart;
                        delete _0x4657ae.fillCenter;
                    }
                    if (_0x228ab6 instanceof cc.LayoutComponent) {
                        if (_0x228ab6.type == cc.LayoutComponent.Type.NONE) {
                            delete _0x4657ae.horizontalDirection;
                            delete _0x4657ae.verticalDirection;
                            delete _0x4657ae.startAxis;
                            delete _0x4657ae.spacingX;
                            delete _0x4657ae.spacingY;
                            delete _0x4657ae.cellSize;
                            if (_0x228ab6.resizeMode == cc.LayoutComponent.ResizeMode.NONE) {
                                delete _0x4657ae.paddingBottom;
                                delete _0x4657ae.paddingTop;
                                delete _0x4657ae.paddingLeft;
                                delete _0x4657ae.paddingRight;
                            }
                        }
                        if (_0x228ab6.type == cc.LayoutComponent.Type.HORIZONTAL) {
                            delete _0x4657ae.spacingY;
                            delete _0x4657ae.verticalDirection;
                            delete _0x4657ae.paddingBottom;
                            delete _0x4657ae.paddingTop;
                        }
                        if (_0x228ab6.type == cc.LayoutComponent.Type.VERTICAL) {
                            delete _0x4657ae.spacingX;
                            delete _0x4657ae.horizontalDirection;
                            delete _0x4657ae.paddingLeft;
                            delete _0x4657ae.paddingRight;
                        }
                        if (_0x228ab6.resizeMode != cc.LayoutComponent.ResizeMode.CHILDREN) {
                            delete _0x4657ae.cellSize;
                        }
                        if (_0x228ab6.type != cc.LayoutComponent.Type.GRID) {
                            delete _0x4657ae.startAxis;
                        }
                    }
                    if (_0x228ab6 instanceof cc.WidgetComponent) {
                        if (cc.WidgetComponent.AlignMode) { }
                        delete _0x4657ae.isStretchHeight;
                        delete _0x4657ae.isStretchWidth;
                        delete _0x4657ae.isAbsoluteHorizontalCenter;
                        delete _0x4657ae.isAbsoluteVerticalCenter;
                        delete _0x4657ae.isAbsoluteTop;
                        delete _0x4657ae.isAbsoluteBottom;
                        delete _0x4657ae.isAbsoluteRight;
                        delete _0x4657ae.isAbsoluteLeft;
                        let _0x1d99c7 = Object.keys(_0x4657ae);
                        _0x1d99c7.forEach(_0x58cf71 => {
                            if (_0x58cf71.startsWith("editor")) {
                                delete _0x4657ae[_0x58cf71];
                            }
                        });
                    }
                    if (_0x228ab6 instanceof cc.LabelComponent) { }
                    _0x4657ae.name = _0x228ab6.name;
                    _0x4657ae.uuid = _0x228ab6.uuid;
                    _0x4657ae.enabled = _0x228ab6.enabled;
                    _0x4657ae.cid = _0x228ab6.__cid__;
                    try {
                        _0x4657ae.__methods___ = getComponentMethodNames(_0x228ab6);
                    } catch (_0x44efc1) {
                        _0x4657ae.__methods___ = [];
                    }
                    return _0x4657ae;
                });
                _0x4adf79.length = 0;
            }
            _0xda84c5.includeComps = _0x51d927;
            showNodeDetail(_0xda84c5);
        }
    }
    function __setSceneComAttr (_0x53c07c, _0x5c1e5b, _0x32ffcb) {
        let _0x122879 = cc.director.getScene();
        if (!_0x122879) {
            return;
        }
        let _0x51ff16 = _0x122879._globals[_0x53c07c];
        if (_0x51ff16) {
            if (_0x51ff16[_0x5c1e5b] instanceof cc.Color) {
                _0x32ffcb = cc.Color.BLACK.clone().fromHEX(_0x32ffcb);
            }
            _0x51ff16[_0x5c1e5b] = _0x32ffcb;
        }
    }
    function __setComAttr (_0x310c7f, _0x1cf3ef, _0x37437a, _0x14bf55, _0x5a9012) {
        let _0x3bce69 = __nd[_0x310c7f];
        if (_0x3bce69) {
            let _0x2f0a4b = _0x3bce69._components.find(_0x324f75 => {
                return _0x324f75.uuid == _0x1cf3ef;
            });
            if (_0x2f0a4b) {
                if (_0x2f0a4b[_0x37437a] instanceof cc.Color) {
                    _0x14bf55 = cc.Color.BLACK.clone().fromHEX(_0x14bf55);
                }
                if (Array.isArray(_0x2f0a4b[_0x37437a]) && typeof _0x14bf55 == "number") {
                    _0x2f0a4b[_0x37437a][_0x14bf55] = _0x5a9012;
                } else {
                    _0x2f0a4b[_0x37437a] = _0x14bf55;
                    if (_0x3bce69._prefab && _0x3bce69._prefab.root._prefab.asset) {
                        __savePrefabComp(_0x2f0a4b, _0x37437a, _0x14bf55);
                    }
                }
                if (__dc) {
                    __readyUpdateTree();
                }
                if (_0x2f0a4b instanceof cc.ButtonComponent && _0x37437a == "transition") {
                    __getNodeDetail(_0x310c7f);
                }
            }
        }
    }
    function __execCompMethod (_0xebc44a, _0x3a0a4c, _0x3367bd) {
        let _0x18d996 = __nd[_0xebc44a];
        if (_0x18d996) {
            let _0x46522b = _0x18d996._components.filter(_0x51540f => {
                return _0x51540f.uuid == _0x3a0a4c;
            });
            if (_0x46522b[0] && _0x46522b[0][_0x3367bd]) {
                _0x46522b[0][_0x3367bd]();
            }
        }
    }
    function __toggleComp (_0x459be8, _0x2f572a) {
        let _0x163471 = __nd[_0x459be8];
        if (_0x163471) {
            let _0x11232b = _0x163471._components.filter(_0x313727 => {
                return _0x313727.uuid == _0x2f572a;
            });
            if (_0x11232b[0]) {
                _0x11232b[0].enabled = !_0x11232b[0].enabled;
                let _0x2f92be = false;
                if (_0x163471._prefab && _0x163471._prefab.root._prefab.asset) {
                    _0x2f92be = __savePrefabComp(_0x11232b[0], "enabled", _0x11232b[0].enabled);
                }
                __getNodeDetail(_0x459be8);
                if (__dc || _0x2f92be) {
                    __readyUpdateTree();
                }
            }
        }
    }
    function __swapPos (_0xf9a155, _0x1933c3) {
        let _0x4adf51 = __nd[_0xf9a155];
        let _0x3245de = __nd[_0x1933c3];
        if (!_0x3245de || !_0x4adf51) {
            return;
        }
        let _0x5c34ee = _0x3245de.parent;
        let _0x5176cb = _0x3245de.getSiblingIndex();
        _0x4adf51.parent = _0x5c34ee;
        _0x4adf51.setSiblingIndex(_0x5176cb);
    }
    function __removeComp (_0x35b9be, _0x2ac06a) {
        let _0x5c66a1 = __nd[_0x35b9be];
        if (_0x5c66a1) {
            let _0x7653d2 = _0x5c66a1._components.filter(_0x3aab59 => {
                return _0x3aab59.uuid == _0x2ac06a;
            });
            if (_0x7653d2[0]) {
                _0x5c66a1.removeComponent(_0x7653d2[0]);
                getSchedule().scheduleOnce(() => {
                    __getNodeDetail(_0x35b9be);
                    if (__dc) {
                        __readyUpdateTree();
                    }
                });
            }
        }
    }
    function getSchedule () {
        if (cc.ENGINE_VERSION.startsWith("3.")) {
            return cc.director.getScene()?.getComponentInChildren(cc.Camera);
        } else {
            return cc.Canvas.instance;
        }
    }
    var __syncNodeDetail = false;
    var __getDetailFun;
    function __readyGetNodeDetail () {
        if (__getDetailFun) {
            return;
        }
        if (stopSyncDetailOneTime) {
            stopSyncDetailOneTime = false;
            return;
        }
        if (!__syncNodeDetail) {
            return;
        }
        __getDetailFun = () => {
            __getDetailFun = null;
            if (!__syncNodeDetail) {
                return;
            }
            __getNodeDetail(__lastDetalNode._id, false);
        };
        getSchedule().scheduleOnce(__getDetailFun);
    }
    var __openedNodes = {};
    function __syncOpen (_0x2b37a3, _0x6f6b77, _0x124692 = true) {
        if (_0x6f6b77) {
            __openedNodes[_0x2b37a3] = true;
            if (_0x124692) {
                __readyUpdateTree();
            }
        } else {
            delete __openedNodes[_0x2b37a3];
        }
    }
    function __syncOpenFcom (_0x59d756) {
        let _0x5d77c6 = __nd[_0x59d756];
        if (_0x5d77c6.children.length == 1 && _0x5d77c6.children[0].name == "Container") {
            __syncOpen(_0x5d77c6.children[0]._id, true, true);
        }
    }
    function __readyUpdateTree (_0x2102c7 = false, _0x57fa9d = null) {
        if (_0x57fa9d && !__dc) {
            const _0x2b839d = _0x57fa9d._id;
            if (__donotAutoUpdates[_0x2b839d]) {
                return;
            }
            for (let _0x8bc61c in __donotAutoUpdates) {
                if (_0x57fa9d.isChildOf(__nd[_0x8bc61c])) {
                    return;
                }
            }
        }
        if (!__autoUpdateTree && !_0x2102c7) {
            canUpdateTree();
            return;
        }
        getSchedule()?.unschedule(__updateTree);
        if (Date.now() - __lastTreeTime > 2000) {
            __updateTree();
            return;
        }
        if (cc.game.isPaused()) {
            // TOLOOK
            setTimeout(() => {
                __updateTree();
            }, 100);
        } else {
            getSchedule()?.scheduleOnce(__updateTree, 0.1);
        }
    }
    var __lastTreeTime = 0;
    function __updateTree () {
        let _0x3061a0 = cc.director.getScene();
        if (!_0x3061a0) {
            return;
        }
        __lastAtlasId = null;
        __lastTreeTime = Date.now();
        sendTree(__aa({}, _0x3061a0));
        __checkAllOneTime = false;
    }
    var __autoUpdateTree = true;
    __initLogListeners();
    __initSf();
    function __codeTip (_0x27d458) {
        if (_0x27d458.startsWith("__")) {
            return [];
        }
        let _0x8eac02 = _0x27d458.split(".");
        let _0x3ca820 = _0x8eac02.pop();
        if (_0x3ca820.includes("(")) {
            _0x3ca820 = _0x3ca820.split("(")[0];
        }
        _0x3ca820 = _0x3ca820.toLowerCase();
        let _0x584ba5 = window[_0x8eac02.shift()] || window;
        if (!_0x584ba5) {
            return [];
        }
        while (_0x8eac02.length > 0) {
            let _0x374d23 = _0x8eac02.shift();
            if (!_0x584ba5) {
                return [];
            }
            _0x584ba5 = _0x584ba5[_0x374d23];
        }
        if (!_0x584ba5) {
            return [];
        }
        let _0x4447c9 = [];
        let _0x5c9c5f = _0x584ba5 == cc || _0x584ba5 == window ? [] : Object.getOwnPropertyNames(_0x584ba5);
        if (_0x584ba5.constructor && _0x584ba5.constructor.__props__) {
            _0x5c9c5f.push(..._0x584ba5.constructor.__props__);
        }
        let _0x5af2e8 = new Set(_0x5c9c5f);
        for (let _0x30bc5c in _0x584ba5) {
            _0x5af2e8.add(_0x30bc5c);
        }
        _0x5c9c5f = Array.from(_0x5af2e8);
        for (let _0x5946c5 of _0x5c9c5f) {
            if (_0x5946c5.startsWith("__")) {
                continue;
            }
            let _0x5750d9 = _0x584ba5[_0x5946c5];
            if (_0x3ca820 != "" && !_0x5946c5.toLowerCase().includes(_0x3ca820)) {
                continue;
            }
            if (typeof _0x5750d9 == "function") {
                let _0x561803 = _0x5750d9;
                if (_0x561803.length == 0) {
                    _0x4447c9.push([_0x5946c5, "function()"]);
                } else {
                    let _0x150133 = _0x561803.toString();
                    let _0x21b61a = _0x150133.split("\n").shift();
                    let _0x3acab4 = _0x150133.includes("[native code]");
                    _0x21b61a = _0x21b61a.replace("function " + _0x561803.name, "function");
                    if (!_0x21b61a.endsWith("{")) {
                        let _0x240258 = _0x21b61a.indexOf("){");
                        let _0x5d440c = _0x21b61a.indexOf(") {");
                        if (_0x240258 > _0x5d440c) {
                            _0x21b61a = _0x21b61a.slice(0, _0x240258 + 1);
                        } else {
                            _0x21b61a = _0x21b61a.slice(0, 3);
                        }
                    } else {
                        _0x21b61a = _0x21b61a.replace("{", "");
                    }
                    if (_0x3acab4 && _0x21b61a == "function()") {
                        _0x21b61a = "function(";
                        let _0x1df7a1 = [];
                        for (let _0x5bef9c = 1; _0x5bef9c <= _0x561803.length; _0x5bef9c++) {
                            _0x1df7a1.push("arg" + _0x5bef9c);
                        }
                        _0x21b61a += _0x1df7a1.join(",") + ")";
                    }
                    _0x4447c9.push([_0x5946c5, _0x21b61a]);
                }
            } else if (typeof _0x5750d9 == "object") {
                if (Array.isArray(_0x5750d9)) {
                    _0x4447c9.push([_0x5946c5, "[](length:" + _0x5750d9.length + ")"]);
                } else {
                    _0x4447c9.push([_0x5946c5, _0x5750d9 == null ? "null" : _0x5750d9.constructor ? _0x5750d9.constructor.name : "object"]);
                }
            } else {
                _0x5750d9 = typeof _0x5750d9 == "string" ? _0x5750d9 : String(_0x5750d9);
                if (_0x5750d9.length > 100) {
                    _0x5750d9 = _0x5750d9.slice(0, 100) + "...";
                }
                _0x4447c9.push([_0x5946c5, "\"" + _0x5750d9 + "\""]);
            }
        }
        _0x4447c9.sort();
        _0x4447c9.sort((_0x3eef98, _0x30ab96) => {
            return _0x3eef98[0].toLowerCase().indexOf(_0x3ca820) - _0x30ab96[0].toLowerCase().indexOf(_0x3ca820);
        });
        return _0x4447c9;
    }
    function __searchComs (_0x33ce67, _0x4821af) {
        let _0x146bfc = __nd[_0x4821af];
        if (!_0x146bfc) {
            _0x146bfc = cc.director.getScene();
        }
        _0x33ce67 = _0x33ce67.toLowerCase();
        let _0x4199f6 = _0x146bfc.getComponentsInChildren(cc.Component);
        _0x4199f6 = _0x4199f6.filter(_0x19c102 => cc.js.getClassName(_0x19c102).toLowerCase().includes(_0x33ce67));
        return _0x4199f6.map(_0x1b434b => {
            let {
                uuid: _0x3f6d54
            } = _0x1b434b;
            let _0x3ad6c2 = cc.js.getClassName(_0x1b434b);
            let _0x4039b4 = _0x1b434b.node.activeInHierarchy && (!_0x1b434b.getComponent("cc.UIOpacity") || _0x1b434b.getComponent("cc.UIOpacity").opacity > 0);
            let {
                path: _0x237b79,
                uuidPath: _0x214d54
            } = __getPath(_0x1b434b.node);
            return {
                name: _0x3ad6c2,
                uuid: _0x3f6d54,
                visible: _0x4039b4,
                path: _0x237b79,
                uuidPath: _0x214d54,
                nodeUuid: _0x1b434b.node.uuid
            };
        });
    }
    function __printPath (_0x7066c5) {
        let _0x479f1a = __getPathByid(_0x7066c5);
        console.log(_0x479f1a);
        return _0x479f1a;
    }
    function __getPathByid (_0x280a85) {
        let _0x24745d = __nd[_0x280a85];
        if (_0x24745d) {
            let {
                path: _0x5224ee
            } = __getPath(_0x24745d);
            return _0x5224ee;
        } else {
            return "";
        }
    }
    function __storeCompInGlobal (_0x125cbc, _0x24a76e) {
        let _0x142b63 = __getComp(_0x125cbc, _0x24a76e);
        if (_0x142b63) {
            window.comp1 = _0x142b63;
            let _0x55a937 = "component: " + _0x142b63.name + ", store in comp1 already!";
            console.log(_0x55a937);
            return _0x55a937;
        }
        return "";
    }
    function __getComp (_0x5db248, _0x21e0b7) {
        let _0x4af74d = __nd[_0x5db248];
        if (!_0x4af74d) {
            return null;
        }
        let _0x4752a0 = _0x4af74d._components.filter(_0xc50da3 => {
            return _0xc50da3.uuid == _0x21e0b7;
        });
        return _0x4752a0[0];
    }
    function __storeInGlobal (_0x528ef0) {
        let _0x3d3d8b = __nd[_0x528ef0];
        if (_0x3d3d8b) {
            window.temp1 = _0x3d3d8b;
            let _0x2e7f30 = "node: " + _0x3d3d8b.name + ", store in temp1 already!";
            console.log(_0x2e7f30);
            return _0x2e7f30;
        }
        return "";
    }
    function __getUuidPathByPath (_0x3c77d7) {
        let _0x2d64d6 = cc.find(_0x3c77d7);
        if (_0x2d64d6) {
            let {
                uuidPath: _0x2579db
            } = __getPath(_0x2d64d6);
            return _0x2579db;
        }
        return [];
    }
    function __getPath (_0x540978) {
        let _0x2bd117 = [_0x540978.name];
        let _0x42e352 = [_0x540978.uuid];
        while (_0x540978.parent && !(_0x540978.parent instanceof cc.Scene)) {
            _0x2bd117.push(_0x540978.parent.name);
            _0x42e352.push(_0x540978.parent.uuid);
            _0x540978 = _0x540978.parent;
        }
        return {
            path: _0x2bd117.reverse().join("/"),
            uuidPath: _0x42e352.reverse()
        };
    }
    function __clearRect () {
        if (__g && __g.node) {
            __g.clear();
        }
    }
    var __lowElectron = false;
    var __g = null;
    var __v2 = null;
    var __needRelocateGraphics = true;
    function __drawRect (_0x401097, _0x26a2c1) {
        if (!window.cc) {
            return;
        }
        if (!cc.director.getScene()) {
            return;
        }
        let _0x1a9f8c = cc.director.getScene().getComponentInChildren(cc.CanvasComponent)?.node;
        if (!_0x1a9f8c) {
            let _0xf5d8d1 = cc.director.getScene();
            _0x1a9f8c = new cc.Node();
            _0x1a9f8c.addComponent(cc.CanvasComponent);
            _0xf5d8d1.addChild(_0x1a9f8c);
        }
        if (!__v2) {
            __v2 = cc.v3();
        }
        if (!cc.director.getScene()) {
            return;
        }
        if (!__g || !__g.node) {
            let _0x4d4c6b = new cc.Node("INSPECTOR-NODE");
            _0x4d4c6b.layer = cc.Layers.Enum.UI_2D;
            __g = _0x4d4c6b.addComponent(cc.GraphicsComponent);
            let _0x518f2a = _0x4d4c6b.getComponent(cc.UITransformComponent);
            _0x518f2a.setContentSize(cc.Size.ZERO);
            __g.strokeColor = cc.Color.WHITE.clone().fromHEX("#35b0fd");
        }
        if (!__g.node.parent) {
            _0x1a9f8c.addChild(__g.node);
        }
        __g?.node?.setPosition(cc.Vec3.ZERO);
        let _0x2763c3 = 1;
        if (__g.node.parent.children.slice(-1)[0]?.name == "PHYSICS_2D_DEBUG_DRAW") {
            _0x2763c3 = 2;
        }
        __g.node.setSiblingIndex(__g.node.parent.children.length - _0x2763c3 || 0);
        let _0x3c4928 = __nd[_0x401097];
        if (!_0x3c4928 && _0x26a2c1 && _0x26a2c1.length > 0) {
            _0x3c4928 = __getNodeByUuidPath(_0x26a2c1);
            if (!_0x3c4928 || _0x3c4928.uuid != _0x401097) {
                return;
            }
        }
        if (_0x3c4928 && _0x3c4928.isValid) {
            _0x3c4928.getWorldPosition(__v2);
            __v2.subtract(_0x1a9f8c.position);
            let _0x57da15 = _0x3c4928.getComponent(cc.UITransformComponent);
            let _0x16be5b = 0;
            let _0x5ad5e8 = 0;
            let _0x4d76a1 = 0.5;
            let _0x46fd63 = 0.5;
            if (_0x57da15) {
                _0x16be5b = _0x57da15.width;
                _0x5ad5e8 = _0x57da15.height;
                _0x4d76a1 = _0x57da15.anchorX;
                _0x46fd63 = _0x57da15.anchorY;
            } else {
                let _0x4672b2 = _0x3c4928.getComponent(cc.RenderableComponent);
                if (_0x4672b2 && _0x4672b2.model?.modelBounds) {
                    let _0x8c9bec = _0x4672b2.model;
                    let _0x56eacf = _0x8c9bec?.modelBounds;
                    let _0x3c4a5d = cc.v3();
                    let _0x9befbc = cc.v3();
                    _0x56eacf.getBoundary(_0x3c4a5d, _0x9befbc);
                    let _0x23caaa = [_0x3c4a5d, _0x3c4a5d.clone().add(cc.v3(0, 0, _0x56eacf.halfExtents.z * 2)), _0x9befbc.clone().add(cc.v3(0, -_0x56eacf.halfExtents.y * 2, 0)), _0x3c4a5d.clone().add(cc.v3(_0x56eacf.halfExtents.x * 2, 0, 0))];
                    let _0x366d52 = [_0x3c4a5d.clone().add(cc.v3(0, _0x56eacf.halfExtents.y * 2, 0)), _0x9befbc.clone().add(cc.v3(-_0x56eacf.halfExtents.x * 2, 0, 0)), _0x9befbc, _0x9befbc.clone().add(cc.v3(0, 0, -_0x56eacf.halfExtents.z * 2))];
                    let _0xdec718 = _0x3c4928.worldMatrix;
                    let _0x4b7d06 = cc.director.getScene().getComponentsInChildren(cc.Camera).find(_0x15e07c => {
                        return _0x15e07c;
                    });
                    _0x23caaa = _0x23caaa.map(_0x3c988b => {
                        return _0x4b7d06.convertToUINode(_0x3c988b.transformMat4(_0xdec718), __g.node);
                    });
                    _0x366d52 = _0x366d52.map(_0x1fe522 => {
                        return _0x4b7d06.convertToUINode(_0x1fe522.transformMat4(_0xdec718), __g.node);
                    });
                    __g.clear();
                    __g.lineWidth = 4;
                    let _0x1aeec2 = __g.strokeColor.clone();
                    __g.strokeColor._set_a_unsafe(180);
                    _0x23caaa.forEach((_0x464160, _0x460bba) => {
                        if (_0x460bba == 0) {
                            __g.moveTo(_0x464160.x, _0x464160.y);
                        } else {
                            __g.lineTo(_0x464160.x, _0x464160.y);
                        }
                    });
                    let _0x3c7be9 = _0x23caaa[0];
                    __g.lineTo(_0x3c7be9.x, _0x3c7be9.y);
                    _0x366d52.forEach((_0x2fb198, _0x31133c) => {
                        if (_0x31133c == 0) {
                            __g.moveTo(_0x2fb198.x, _0x2fb198.y);
                        } else {
                            __g.lineTo(_0x2fb198.x, _0x2fb198.y);
                        }
                    });
                    _0x3c7be9 = _0x366d52[0];
                    __g.lineTo(_0x3c7be9.x, _0x3c7be9.y);
                    _0x366d52.forEach((_0xc60d5d, _0x392607) => {
                        let _0x4a5500 = _0x23caaa[_0x392607];
                        __g.moveTo(_0xc60d5d.x, _0xc60d5d.y);
                        __g.lineTo(_0x4a5500.x, _0x4a5500.y);
                    });
                    __g.stroke();
                    __g.strokeColor = _0x1aeec2;
                    return;
                } else if (_0x4672b2 && _0x4672b2.model?.worldBounds) {
                    let _0x27d528 = _0x4672b2.model;
                    let _0x2fef0a = _0x27d528?.worldBounds;
                    let _0x3ab043 = cc.v3();
                    let _0x4a12d9 = cc.v3();
                    _0x2fef0a.getBoundary(_0x3ab043, _0x4a12d9);
                    let _0x20203e = cc.director.getScene().getComponentsInChildren(cc.Camera).find(_0x43ea1c => {
                        return _0x43ea1c;
                    });
                    _0x20203e.convertToUINode(_0x3ab043, __g.node, _0x3ab043);
                    _0x20203e.convertToUINode(_0x4a12d9, __g.node, _0x4a12d9);
                    __g.clear();
                    __g.lineWidth = 4;
                    let _0x3a0ad0 = __g.strokeColor.clone();
                    __g.strokeColor._set_a_unsafe(200);
                    __g.moveTo(_0x3ab043.x, _0x3ab043.y);
                    __g.lineTo(_0x4a12d9.x, _0x4a12d9.y);
                    __g.stroke();
                    __g.strokeColor = _0x3a0ad0;
                    return;
                }
                return;
            }
            __v2.multiplyScalar(0);
            if (_0x4d76a1 != 0.5) {
                __v2.x += _0x16be5b * (0.5 - _0x4d76a1);
            }
            if (_0x46fd63 != 0.5) {
                __v2.y += _0x5ad5e8 * (0.5 - _0x46fd63);
            }
            let _0x174821 = __g.strokeColor.clone();
            __g.clear();
            __g.lineWidth = __moreThen3_4_0() ? 4 : cc.view.isRetinaEnabled() ? 3 : 5;
            let _0x85dc74 = _0x1a9f8c.getComponent(cc.UITransformComponent);
            if (_0x16be5b < 4 || _0x5ad5e8 < 4) {
                _0x57da15.convertToWorldSpaceAR(__v2, __v2);
                __v2.subtract(cc.v3(_0x85dc74.width / 2, _0x85dc74.height / 2));
                __g.strokeColor = cc.Color.BLACK;
                __g.circle(__v2.x, __v2.y, 13);
                __g.stroke();
                __g.strokeColor = _0x174821;
                __g.circle(__v2.x, __v2.y, 10);
            } else {
                let _0x35035e = [cc.v3(__v2.x - _0x16be5b / 2, __v2.y - _0x5ad5e8 / 2), cc.v3(__v2.x + _0x16be5b / 2, __v2.y - _0x5ad5e8 / 2), cc.v3(__v2.x + _0x16be5b / 2, __v2.y + _0x5ad5e8 / 2), cc.v3(__v2.x - _0x16be5b / 2, __v2.y + _0x5ad5e8 / 2)];
                _0x35035e.forEach(function (_0x2abd3a) {
                    _0x57da15.convertToWorldSpaceAR(_0x2abd3a, _0x2abd3a);
                    _0x2abd3a.subtract(cc.v3(_0x85dc74.width / 2, _0x85dc74.height / 2));
                });
                let _0x1bbc34 = _0x35035e.shift();
                _0x35035e.push(_0x1bbc34);
                __g.moveTo(_0x1bbc34.x, _0x1bbc34.y);
                __g.strokeColor = cc.Color.WHITE;
                _0x35035e.forEach(function (_0x2aa4c3) {
                    __g.lineTo(_0x2aa4c3.x, _0x2aa4c3.y);
                });
            }
            __g.fillColor = cc.Color.BLUE.clone()._set_a_unsafe(20);
            __g.stroke();
            __g.fill();
        }
    }
}
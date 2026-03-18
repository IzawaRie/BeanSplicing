"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.assetHandlers = exports.configs = exports.unload = exports.load = undefined;
const load = function () {
    console.debug(`${PACKAGE_NAME} load`);
};
exports.load = load;
const unload = function () {
    console.debug(`${PACKAGE_NAME} unload`);
};
exports.unload = unload;
const PACKAGE_NAME = "inspector_hacked";
exports.configs = {
    "*": {
        hooks: "./hooks",
        options: {
            Push2Device: {
                label: '构建完成推送到设备',
                description: '构建完成推送到设备',
                default: false,
                render: {
                    ui: 'ui-checkbox',
                },
            },
        }
    }
};
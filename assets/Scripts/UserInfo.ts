import { _decorator, Component, Node } from 'cc';
import { WXManager } from './WXManager';
const { ccclass, property } = _decorator;

@ccclass('UserInfo')
export class UserInfo extends Component {
    private _fixSkillCount: number = 0;
    private _timeSkillCount: number = 0;
    private _paletteSkillCount: number = 0;

    public get fixSkillCount(): number {
        return this._fixSkillCount;
    }

    public set fixSkillCount(value: number) {
        this._fixSkillCount = Math.max(0, Math.floor(value));
        WXManager.instance?.setFixSkillCount(this._fixSkillCount);
    }

    public get timeSkillCount(): number {
        return this._timeSkillCount;
    }

    public set timeSkillCount(value: number) {
        this._timeSkillCount = Math.max(0, Math.floor(value));
        WXManager.instance?.setTimeSkillCount(this._timeSkillCount);
    }

    public get paletteSkillCount(): number {
        return this._paletteSkillCount;
    }

    public set paletteSkillCount(value: number) {
        this._paletteSkillCount = Math.max(0, Math.floor(value));
        WXManager.instance?.setPaletteSkillCount(this._paletteSkillCount);
    }

    start() {

    }

    update(deltaTime: number) {
        
    }
}



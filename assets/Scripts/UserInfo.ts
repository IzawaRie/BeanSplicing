import { _decorator, Component } from 'cc';
import { WXManager } from './WXManager';
const { ccclass } = _decorator;

type LocalProfileContext = {
    openid: string;
    nickname: string;
    avatarUrl: string;
    hasRealProfile: boolean;
};

@ccclass('UserInfo')
export class UserInfo extends Component {
    private _openid: string = '';
    private _nickname: string = '';
    private _avatarUrl: string = '';
    private _fixSkillCount: number = 0;
    private _timeSkillCount: number = 0;
    private _paletteSkillCount: number = 0;

    public get openid(): string {
        return this._openid;
    }

    public set openid(value: string | null) {
        this._openid = (value || '').trim();
    }

    public get nickname(): string {
        return this._nickname;
    }

    public set nickname(value: string) {
        this._nickname = (value || '').trim();
    }

    public get avatarUrl(): string {
        return this._avatarUrl;
    }

    public set avatarUrl(value: string) {
        this._avatarUrl = (value || '').trim();
    }

    public setProfile(nickname: string | null | undefined, avatarUrl: string | null | undefined): void {
        this._nickname = (nickname || '').trim();
        this._avatarUrl = (avatarUrl || '').trim();
    }

    public clearProfile(): void {
        this._nickname = '';
        this._avatarUrl = '';
    }

    public hasRealUserProfile(): boolean {
        return UserInfo.isRealUserProfile(this._nickname, this._avatarUrl);
    }

    public getDisplayProfile(): { nickname: string; avatarUrl: string } {
        const openid = this._openid;
        return {
            nickname: this._nickname || UserInfo.getFallbackNickname(openid),
            avatarUrl: this._avatarUrl
        };
    }

    public toChartLocalProfileContext(): LocalProfileContext | null {
        const openid = this._openid.trim();
        if (!openid || !this.hasRealUserProfile()) {
            return null;
        }

        return {
            openid,
            nickname: this._nickname,
            avatarUrl: this._avatarUrl,
            hasRealProfile: true
        };
    }

    public static getFallbackNickname(userId: string): string {
        const safeUserId = (userId || '').trim();
        if (!safeUserId) {
            return '\u8c46\u53cb';
        }

        return `\u8c46\u53cb${safeUserId.slice(-4)}`;
    }

    public static isFallbackNickname(nickname: string): boolean {
        return /^\u8c46\u53cb([A-Za-z0-9]{4})?$/.test((nickname || '').trim());
    }

    public static isRealUserProfile(nickname: string, avatarUrl: string): boolean {
        const safeNickname = (nickname || '').trim();
        const safeAvatarUrl = (avatarUrl || '').trim();
        return !!safeNickname && !UserInfo.isFallbackNickname(safeNickname) && !!safeAvatarUrl;
    }

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
}

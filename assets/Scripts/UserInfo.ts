import { _decorator, Color, Node, Component, Label, Sprite, input, Input, EventTouch, UITransform, Vec2 } from 'cc';
import { GameManager, GameState } from './GameManager';
import { WXManager } from './WXManager';
const { ccclass, property } = _decorator;

type UserSex = 'male' | 'female';

type LocalProfileContext = {
    openid: string;
    nickname: string;
    avatarUrl: string;
    hasRealProfile: boolean;
};

@ccclass('UserInfo')
export class UserInfo extends Component {
    private static readonly ACTIVE_BUTTON_COLOR = new Color(255, 255, 255, 255);
    private static readonly INACTIVE_BUTTON_COLOR = new Color(200, 200, 200, 255);

    @property({ type: Node })
    man_sex_btn: Node = null;

    @property({ type: Node })
    woman_sex_btn: Node = null;

    @property({ type: Label })
    name_label: Label = null;

    @property({ type: Label })
    sex_label: Label = null;

    @property({ type: Node })
    border_bg: Node = null;

    @property({ type: Sprite })
    avatar_kuang: Sprite = null;

    @property({ type: Sprite })
    avatar_mask: Sprite = null;

    @property({ type: Sprite })
    avatar_sprite: Sprite = null;

    @property({ type: Label })
    palette_label: Label = null;

    @property({ type: Label })
    time_label: Label = null;

    @property({ type: Label })
    fix_label: Label = null;

    @property({ type: Node })
    ac_content: Node = null;

    @property({ type: Node })
    avatar_content: Node = null;

    @property({ type: Node })
    kuang_content: Node = null;

    @property({ type: Node })
    niezi_content: Node = null;

    @property({ type: Node })
    yundou_content: Node = null;

    private _openid: string = '';
    private _nickname: string = '';
    private _avatarUrl: string = '';
    private _fixSkillCount: number = 0;
    private _timeSkillCount: number = 0;
    private _paletteSkillCount: number = 0;
    private _sex: UserSex = 'male';

    onLoad(): void {
        this.refreshNameLabel();
        this.bindSexButtonEvents();
        this.initializeSexState();
    }

    onEnable(): void {
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onDisable(): void {
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onDestroy(): void {
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        this.unbindSexButtonEvents();
    }

    public get openid(): string {
        return this._openid;
    }

    public set openid(value: string | null) {
        this._openid = (value || '').trim();
    }

    public get sex(): UserSex {
        return this._sex;
    }

    public set sex(value: UserSex) {
        const normalizedSex: UserSex = value === 'female' ? 'female' : 'male';
        this._sex = normalizedSex;
        this.refreshSexDisplay();
        WXManager.instance?.setUserSex(normalizedSex);
    }

    public get nickname(): string {
        return this._nickname;
    }

    public set nickname(value: string) {
        this._nickname = (value || '').trim();
        this.refreshNameLabel();
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
        this.refreshNameLabel();
    }

    public clearProfile(): void {
        this._nickname = '';
        this._avatarUrl = '';
        this.refreshNameLabel();
    }

    private refreshNameLabel(): void {
        if (this.name_label) {
            this.name_label.string = this._nickname;
        }
    }

    private initializeSexState(): void {
        const cachedSex = WXManager.instance?.getUserSex();
        this._sex = cachedSex === 'female' ? 'female' : 'male';
        this.refreshSexDisplay();
    }

    private bindSexButtonEvents(): void {
        this.man_sex_btn?.on(Node.EventType.TOUCH_END, this.onManSexBtnClick, this);
        this.woman_sex_btn?.on(Node.EventType.TOUCH_END, this.onWomanSexBtnClick, this);
    }

    private unbindSexButtonEvents(): void {
        this.man_sex_btn?.off(Node.EventType.TOUCH_END, this.onManSexBtnClick, this);
        this.woman_sex_btn?.off(Node.EventType.TOUCH_END, this.onWomanSexBtnClick, this);
    }

    private onManSexBtnClick(): void {
        this.sex = 'male';
    }

    private onWomanSexBtnClick(): void {
        this.sex = 'female';
    }

    private onTouchEnd(event: EventTouch): void {
        const touch = event.touch;
        if (!touch || !this.node.activeInHierarchy) {
            return;
        }

        const touchPos = touch.getUILocation();
        if (this.isTouchInContentPanel(touchPos)) {
            return;
        }

        this.closePanel();
    }

    private refreshSexDisplay(): void {
        if (this.sex_label) {
            this.sex_label.string = this._sex === 'female' ? '女' : '男';
        }

        this.refreshSexButtonColor(this.man_sex_btn, this._sex === 'male');
        this.refreshSexButtonColor(this.woman_sex_btn, this._sex === 'female');
    }

    private refreshSexButtonColor(buttonNode: Node | null, selected: boolean): void {
        const sprite = buttonNode?.getComponent(Sprite);
        if (sprite) {
            sprite.color = selected ? UserInfo.ACTIVE_BUTTON_COLOR : UserInfo.INACTIVE_BUTTON_COLOR;
        }
    }

    public closePanel(): void {
        this.node.active = false;
        const gameManager = GameManager.getInstance();
        if (gameManager?.gameState === GameState.WAITING) {
            WXManager.instance?.showNativeAd();
        }
    }

    private isTouchInContentPanel(touchPos: Vec2): boolean {
        if (!this.border_bg) {
            return false;
        }

        const contentTransform = this.border_bg.getComponent(UITransform);
        if (!contentTransform) {
            return false;
        }

        return contentTransform.getBoundingBoxToWorld().contains(touchPos);
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

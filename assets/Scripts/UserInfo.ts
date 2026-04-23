import { _decorator, Color, Node, Component, Label, Sprite, input, Input, EventTouch, UITransform, Vec2, resources, SpriteFrame } from 'cc';
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
    private static readonly ACTIVE_BUTTON_COLOR = new Color(252, 158, 121, 255);
    private static readonly INACTIVE_BUTTON_COLOR = new Color(255, 255, 255, 255);

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
    private _avatarId: number = 0;
    private _avatarFrameId: number = 0;
    private _tweezerId: number = 0;
    private _ironId: number = 0;
    private _fixSkillCount: number = 0;
    private _timeSkillCount: number = 0;
    private _paletteSkillCount: number = 0;
    private _sex: UserSex = 'male';

    defaultManAvatarPath: string = 'items/avatar/default_man';
    defaultWomanAvatarPath: string = 'items/avatar/default_woman';

    onLoad(): void {
        this.refreshNameLabel();
        this.refreshSkillCountLabels();
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
        this.refreshNameLabel();
    }

    public get sex(): UserSex {
        return this._sex;
    }

    public set sex(value: UserSex) {
        const normalizedSex: UserSex = value === 'female' ? 'female' : 'male';
        this._sex = normalizedSex;
        this.refreshSexDisplay();
        this.refreshDefaultAvatarIfNeeded();
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

    public get avatarId(): number {
        return this._avatarId;
    }

    public set avatarId(value: number) {
        this._avatarId = this.normalizeConfigId(value);
        this.refreshDefaultAvatarIfNeeded();
    }

    public get avatarFrameId(): number {
        return this._avatarFrameId;
    }

    public set avatarFrameId(value: number) {
        this._avatarFrameId = this.normalizeConfigId(value);
    }

    public get tweezerId(): number {
        return this._tweezerId;
    }

    public set tweezerId(value: number) {
        this._tweezerId = this.normalizeConfigId(value);
    }

    public get ironId(): number {
        return this._ironId;
    }

    public set ironId(value: number) {
        this._ironId = this.normalizeConfigId(value);
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
            this.name_label.string = ` ${this._nickname || UserInfo.getFallbackNickname(this._openid)}`;
        }
    }

    private normalizeConfigId(value: number): number {
        return Math.max(0, Math.floor(Number(value) || 0));
    }

    private initializeSexState(): void {
        const cachedSex = WXManager.instance?.getUserSex();
        this._sex = cachedSex === 'female' ? 'female' : 'male';
        this.refreshSexDisplay();
        this.refreshDefaultAvatarIfNeeded();
    }

    private refreshDefaultAvatarIfNeeded(): void {
        if (this._avatarId !== 0 || !this.avatar_sprite) {
            return;
        }

        const resourcePath = this._sex === 'female' ? this.defaultWomanAvatarPath : this.defaultManAvatarPath;
        resources.load(`${resourcePath}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
            if (err || !spriteFrame || this._avatarId !== 0 || !this.avatar_sprite) {
                return;
            }

            this.avatar_sprite.spriteFrame = spriteFrame;
        });
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
            this.sex_label.string = this._sex === 'female' ? ' 女' : ' 男';
        }

        this.refreshSexButtonColor(this.man_sex_btn, this._sex === 'male');
        this.refreshSexButtonColor(this.woman_sex_btn, this._sex === 'female');
    }

    private refreshSexButtonColor(buttonNode: Node | null, selected: boolean): void {
        const targetColor = selected ? UserInfo.ACTIVE_BUTTON_COLOR : UserInfo.INACTIVE_BUTTON_COLOR;
        const sprite = buttonNode?.getComponent(Sprite);
        if (sprite) {
            sprite.color = targetColor;
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
        this.refreshFixSkillCountLabel();
        WXManager.instance?.setFixSkillCount(this._fixSkillCount);
    }

    public get timeSkillCount(): number {
        return this._timeSkillCount;
    }

    public set timeSkillCount(value: number) {
        this._timeSkillCount = Math.max(0, Math.floor(value));
        this.refreshTimeSkillCountLabel();
        WXManager.instance?.setTimeSkillCount(this._timeSkillCount);
    }

    public get paletteSkillCount(): number {
        return this._paletteSkillCount;
    }

    public set paletteSkillCount(value: number) {
        this._paletteSkillCount = Math.max(0, Math.floor(value));
        this.refreshPaletteSkillCountLabel();
        WXManager.instance?.setPaletteSkillCount(this._paletteSkillCount);
    }

    private refreshSkillCountLabels(): void {
        this.refreshFixSkillCountLabel();
        this.refreshTimeSkillCountLabel();
        this.refreshPaletteSkillCountLabel();
    }

    private refreshFixSkillCountLabel(): void {
        if (this.fix_label) {
            this.fix_label.string = this.formatSkillCountLabel(this._fixSkillCount);
        }
    }

    private refreshTimeSkillCountLabel(): void {
        if (this.time_label) {
            this.time_label.string = this.formatSkillCountLabel(this._timeSkillCount);
        }
    }

    private refreshPaletteSkillCountLabel(): void {
        if (this.palette_label) {
            this.palette_label.string = this.formatSkillCountLabel(this._paletteSkillCount);
        }
    }

    private formatSkillCountLabel(count: number): string {
        return count > 0 ? `[x${count}]` : '[暂无]';
    }
}

import { _decorator, Color, Node, Component, Label, Sprite, input, Input, EventTouch, UITransform, Vec2, instantiate, isValid, JsonAsset, Layout, Prefab, resources, SpriteFrame } from 'cc';
import { isRemoteAvatarSource, loadAvatarSpriteFrameBySource } from './AvatarSourceLoader';
import { GameManager, GameState } from './GameManager';
import { UserInfoItem } from './UserInfoItem';
import { WXManager } from './WXManager';
const { ccclass, property } = _decorator;

type UserSex = 'male' | 'female';
type UserInfoOwnedCategory = 'avatar' | 'avatarFrame' | 'tweezer' | 'iron' | 'achievementIcon';

type LocalProfileContext = {
    openid: string;
    nickname: string;
    avatarUrl: string;
    hasRealProfile: boolean;
};

type UserInfoResourceConfigItem = {
    id: number;
    resourcePath: string;
    description?: string;
};

type UserInfoResourceConfigFile = {
    avatars?: UserInfoResourceConfigItem[];
    avatarFrames?: UserInfoResourceConfigItem[];
    tweezers?: UserInfoResourceConfigItem[];
    irons?: UserInfoResourceConfigItem[];
    achievementIcons?: UserInfoResourceConfigItem[];
};

@ccclass('UserInfo')
export class UserInfo extends Component {
    private static readonly ACTIVE_BUTTON_COLOR = new Color(252, 158, 121, 255);
    private static readonly INACTIVE_BUTTON_COLOR = new Color(255, 255, 255, 255);
    private static readonly DEFAULT_MALE_AVATAR_ID = 1;
    private static readonly DEFAULT_FEMALE_AVATAR_ID = 2;

    @property({ type: Node })
    close_btn: Node = null;
    
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

    @property({ type: Node })
    ac_description_node: Node = null;

    @property({ type: Label })
    ac_description_label: Label = null;

    private _openid: string = '';
    private _nickname: string = '';
    private _avatarUrl: string = '';
    private _authorizedAvatarUrl: string = '';
    private _avatarFrameId: number = 1;
    private _tweezerId: number = 1;
    private _ironId: number = 1;
    private _ownedAvatarIds: number[] = [1];
    private _ownedAvatarFrameIds: number[] = [1];
    private _ownedTweezerIds: number[] = [1];
    private _ownedIronIds: number[] = [1];
    private _ownedAchievementIconIds: number[] = [1];
    private _fixSkillCount: number = 0;
    private _timeSkillCount: number = 0;
    private _paletteSkillCount: number = 0;
    private _sex: UserSex = 'male';
    private avatarRenderVersion = 0;
    private _itemPrefab: Prefab | null = null;
    private _itemPrefabTask: Promise<Prefab | null> | null = null;
    private readonly _resourcePathCache = new Map<UserInfoOwnedCategory, Map<number, string>>();
    private readonly _resourcePathTaskCache = new Map<UserInfoOwnedCategory, Promise<Map<number, string>>>();
    private _achievementDescriptionCache: Map<number, string> | null = null;
    private _achievementDescriptionTask: Promise<Map<number, string>> | null = null;
    private readonly _ownedItemViewMap = new Map<UserInfoOwnedCategory, Map<number, UserInfoItem>>();
    private _authorizedAvatarItem: UserInfoItem | null = null;

    onLoad(): void {
        this.refreshNameLabel();
        this.refreshSkillCountLabels();
        this.hideAchievementDescription();
        this.bindCloseButtonEvents();
        this.bindSexButtonEvents();
        this.initializeSexState();
    }

    onEnable(): void {
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        void this.refreshOwnedItemDisplays();
    }

    onDisable(): void {
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        this.hideAchievementDescription();
    }

    onDestroy(): void {
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        this.unbindCloseButtonEvents();
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
        const wasUsingDefaultAvatar = this.isUsingDefaultAvatar();
        const normalizedSex: UserSex = value === 'female' ? 'female' : 'male';
        if (this._sex === normalizedSex) {
            return;
        }
        const previousDefaultAvatarId = this.getCurrentDefaultAvatarId();
        this._sex = normalizedSex;
        this.refreshSexDisplay();
        if (wasUsingDefaultAvatar) {
            const nextDefaultAvatarId = this.getCurrentDefaultAvatarId();
            this.ownedAvatarIds = this.replaceDefaultAvatarId(this._ownedAvatarIds, nextDefaultAvatarId);
            this.avatarUrl = String(nextDefaultAvatarId);
        }
        void this.updateDefaultAvatarItemForSexChange(previousDefaultAvatarId, this.getCurrentDefaultAvatarId());
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
        this.refreshAvatarSprite();
    }

    public get authorizedAvatarUrl(): string {
        return this._authorizedAvatarUrl;
    }

    public set authorizedAvatarUrl(value: string) {
        const safeAvatarUrl = (value || '').trim();
        this._authorizedAvatarUrl = isRemoteAvatarSource(safeAvatarUrl) ? safeAvatarUrl : '';
        WXManager.instance?.setAuthorizedAvatarUrl(this._authorizedAvatarUrl);
    }

    public get avatarFrameId(): number {
        return this._avatarFrameId;
    }

    public set avatarFrameId(value: number) {
        this._avatarFrameId = this.normalizeOwnedConfigId(value);
        this.addOwnedAvatarFrameId(this._avatarFrameId);
        WXManager.instance?.setAvatarFrameId(this._avatarFrameId);
    }

    public get tweezerId(): number {
        return this._tweezerId;
    }

    public set tweezerId(value: number) {
        this._tweezerId = this.normalizeOwnedConfigId(value);
        this.addOwnedTweezerId(this._tweezerId);
        WXManager.instance?.setTweezerId(this._tweezerId);
    }

    public get ironId(): number {
        return this._ironId;
    }

    public set ironId(value: number) {
        this._ironId = this.normalizeOwnedConfigId(value);
        this.addOwnedIronId(this._ironId);
        WXManager.instance?.setIronId(this._ironId);
    }

    public get ownedAvatarIds(): number[] {
        return [...this._ownedAvatarIds];
    }

    public set ownedAvatarIds(value: number[]) {
        this._ownedAvatarIds = this.normalizeOwnedIds(value);
        WXManager.instance?.setOwnedAvatarIds(this._ownedAvatarIds);
    }

    public get ownedAvatarFrameIds(): number[] {
        return [...this._ownedAvatarFrameIds];
    }

    public set ownedAvatarFrameIds(value: number[]) {
        this._ownedAvatarFrameIds = this.normalizeOwnedIds(value);
        WXManager.instance?.setOwnedAvatarFrameIds(this._ownedAvatarFrameIds);
    }

    public get ownedTweezerIds(): number[] {
        return [...this._ownedTweezerIds];
    }

    public set ownedTweezerIds(value: number[]) {
        this._ownedTweezerIds = this.normalizeOwnedIds(value);
        WXManager.instance?.setOwnedTweezerIds(this._ownedTweezerIds);
    }

    public get ownedIronIds(): number[] {
        return [...this._ownedIronIds];
    }

    public set ownedIronIds(value: number[]) {
        this._ownedIronIds = this.normalizeOwnedIds(value);
        WXManager.instance?.setOwnedIronIds(this._ownedIronIds);
    }

    public get ownedAchievementIconIds(): number[] {
        return [...this._ownedAchievementIconIds];
    }

    public set ownedAchievementIconIds(value: number[]) {
        this._ownedAchievementIconIds = this.normalizeOwnedIds(value);
        WXManager.instance?.setOwnedAchievementIconIds(this._ownedAchievementIconIds);
    }

    public setProfile(nickname: string | null | undefined, avatarUrl: string | null | undefined): void {
        this._nickname = (nickname || '').trim();
        this._avatarUrl = (avatarUrl || '').trim();
        if (isRemoteAvatarSource(this._avatarUrl)) {
            this.authorizedAvatarUrl = this._avatarUrl;
        }
        this.refreshNameLabel();
        this.refreshAvatarSprite();
    }

    public clearProfile(): void {
        this._nickname = '';
        this._avatarUrl = '';
        this.authorizedAvatarUrl = '';
        this.refreshNameLabel();
        this.refreshAvatarSprite();
    }

    private refreshNameLabel(): void {
        if (this.name_label) {
            this.name_label.string = ` ${this._nickname || UserInfo.getFallbackNickname(this._openid)}`;
        }
    }

    private normalizeOwnedConfigId(value: number): number {
        return Math.max(1, Math.floor(Number(value) || 1));
    }

    private normalizeOwnedIds(value: number[] | null | undefined): number[] {
        if (!Array.isArray(value)) {
            return [1];
        }

        const normalizedIds = Array.from(new Set(
            value
                .map((id) => this.normalizeOwnedConfigId(id))
                .filter((id) => id >= 1)
        ));
        normalizedIds.sort((a, b) => a - b);
        return normalizedIds.length > 0 ? normalizedIds : [1];
    }

    private isDefaultAvatarId(avatarId: number): boolean {
        return avatarId === UserInfo.DEFAULT_MALE_AVATAR_ID || avatarId === UserInfo.DEFAULT_FEMALE_AVATAR_ID;
    }

    private isUsingDefaultAvatar(): boolean {
        const safeAvatarUrl = (this._avatarUrl || '').trim();
        if (!/^\d+$/.test(safeAvatarUrl)) {
            return !safeAvatarUrl;
        }

        return this.isDefaultAvatarId(this.normalizeOwnedConfigId(Number(safeAvatarUrl)));
    }

    private getCurrentDefaultAvatarId(): number {
        return this._sex === 'female'
            ? UserInfo.DEFAULT_FEMALE_AVATAR_ID
            : UserInfo.DEFAULT_MALE_AVATAR_ID;
    }

    private getAvatarDisplayIds(): number[] {
        const nonDefaultAvatarIds = this.normalizeOwnedIds(this._ownedAvatarIds)
            .filter((avatarId) => !this.isDefaultAvatarId(avatarId));
        return [this.getCurrentDefaultAvatarId(), ...nonDefaultAvatarIds];
    }

    private replaceDefaultAvatarId(ownedIds: number[], nextDefaultAvatarId: number): number[] {
        const preservedAvatarIds = this.normalizeOwnedIds(ownedIds)
            .filter((avatarId) => !this.isDefaultAvatarId(avatarId));
        return [nextDefaultAvatarId, ...preservedAvatarIds];
    }

    private async updateDefaultAvatarItemForSexChange(
        previousDefaultAvatarId: number,
        nextDefaultAvatarId: number
    ): Promise<void> {
        const avatarItemMap = this._ownedItemViewMap.get('avatar');
        const defaultAvatarItem = avatarItemMap?.get(previousDefaultAvatarId) ?? null;
        if (!defaultAvatarItem || !isValid(defaultAvatarItem.node) || !this.node.activeInHierarchy) {
            await this.renderAvatarItems(this.avatar_content);
            return;
        }

        const resourcePathMap = await this.loadResourcePathMap('avatar');
        if (!isValid(defaultAvatarItem.node) || !this.node.activeInHierarchy) {
            return;
        }

        const nextResourcePath = resourcePathMap.get(nextDefaultAvatarId) || '';
        if (!nextResourcePath) {
            return;
        }

        defaultAvatarItem.node.off(Node.EventType.TOUCH_END);
        defaultAvatarItem.setData(
            nextResourcePath,
            !this.isUsingAuthorizedAvatar() && this.getSelectedAvatarId() === nextDefaultAvatarId
        );
        defaultAvatarItem.node.on(Node.EventType.TOUCH_END, () => {
            this.onLocalAvatarItemClick(nextDefaultAvatarId);
        }, this);

        avatarItemMap?.delete(previousDefaultAvatarId);
        avatarItemMap?.set(nextDefaultAvatarId, defaultAvatarItem);
    }

    public hasOwnedAvatarId(id: number): boolean {
        return this._ownedAvatarIds.indexOf(this.normalizeOwnedConfigId(id)) >= 0;
    }

    public addOwnedAvatarId(id: number): void {
        const normalizedId = this.normalizeOwnedConfigId(id);
        if (this._ownedAvatarIds.indexOf(normalizedId) >= 0) {
            return;
        }

        this.ownedAvatarIds = [...this._ownedAvatarIds, normalizedId];
    }

    public hasOwnedAvatarFrameId(id: number): boolean {
        return this._ownedAvatarFrameIds.indexOf(this.normalizeOwnedConfigId(id)) >= 0;
    }

    public addOwnedAvatarFrameId(id: number): void {
        const normalizedId = this.normalizeOwnedConfigId(id);
        if (this._ownedAvatarFrameIds.indexOf(normalizedId) >= 0) {
            return;
        }

        this.ownedAvatarFrameIds = [...this._ownedAvatarFrameIds, normalizedId];
    }

    public hasOwnedTweezerId(id: number): boolean {
        return this._ownedTweezerIds.indexOf(this.normalizeOwnedConfigId(id)) >= 0;
    }

    public addOwnedTweezerId(id: number): void {
        const normalizedId = this.normalizeOwnedConfigId(id);
        if (this._ownedTweezerIds.indexOf(normalizedId) >= 0) {
            return;
        }

        this.ownedTweezerIds = [...this._ownedTweezerIds, normalizedId];
    }

    public hasOwnedIronId(id: number): boolean {
        return this._ownedIronIds.indexOf(this.normalizeOwnedConfigId(id)) >= 0;
    }

    public addOwnedIronId(id: number): void {
        const normalizedId = this.normalizeOwnedConfigId(id);
        if (this._ownedIronIds.indexOf(normalizedId) >= 0) {
            return;
        }

        this.ownedIronIds = [...this._ownedIronIds, normalizedId];
    }

    private async refreshOwnedItemDisplays(): Promise<void> {
        const prefab = await this.loadUserInfoItemPrefab();
        if (!prefab || !isValid(this.node) || !this.node.activeInHierarchy) {
            return;
        }

        await Promise.all([
            this.renderAvatarItems(this.avatar_content),
            this.renderAchievementIconItems(this.ac_content, this._ownedAchievementIconIds),
            this.renderOwnedItems(this.kuang_content, this._ownedAvatarFrameIds, 'avatarFrame', this._avatarFrameId),
            this.renderOwnedItems(this.niezi_content, this._ownedTweezerIds, 'tweezer', this._tweezerId),
            this.renderOwnedItems(this.yundou_content, this._ownedIronIds, 'iron', this._ironId),
        ]);
    }

    private async renderAchievementIconItems(container: Node | null, ownedIds: number[]): Promise<void> {
        if (!container) {
            return;
        }

        const resourcePathMap = await this.loadResourcePathMap('achievementIcon');
        const descriptionMap = await this.loadAchievementDescriptionMap();
        if (!isValid(container) || !isValid(this.node) || !this.node.activeInHierarchy) {
            return;
        }

        for (const child of container.children) {
            child.active = false;
        }

        const normalizedOwnedIds = this.normalizeOwnedIds(ownedIds);
        for (let index = 0; index < normalizedOwnedIds.length; index++) {
            const ownedId = normalizedOwnedIds[index];
            const resourcePath = resourcePathMap.get(ownedId) || '';
            if (!resourcePath) {
                continue;
            }

            const spriteFrame = await this.loadLocalSpriteFrame(resourcePath);
            if (!spriteFrame || !isValid(container) || !isValid(this.node) || !this.node.activeInHierarchy) {
                continue;
            }

            const itemNode = container.children[index];
            if (!itemNode) {
                continue;
            }

            const sprite = itemNode.getComponent(Sprite);
            if (!sprite) {
                continue;
            }
            sprite.spriteFrame = spriteFrame;
            itemNode.active = true;
            itemNode.off(Node.EventType.TOUCH_START);
            itemNode.off(Node.EventType.TOUCH_END);
            itemNode.off(Node.EventType.TOUCH_CANCEL);
            itemNode.on(Node.EventType.TOUCH_START, () => {
                this.showAchievementDescription(descriptionMap.get(ownedId) || '', itemNode);
            }, this);
            itemNode.on(Node.EventType.TOUCH_END, this.hideAchievementDescription, this);
            itemNode.on(Node.EventType.TOUCH_CANCEL, this.hideAchievementDescription, this);
        }

        const layout = container.getComponent(Layout);
        layout?.updateLayout();
    }

    private async renderAvatarItems(container: Node | null): Promise<void> {
        if (!container) {
            return;
        }

        const prefab = await this.loadUserInfoItemPrefab();
        if (!prefab || !isValid(container) || !isValid(this.node) || !this.node.activeInHierarchy) {
            return;
        }

        const resourcePathMap = await this.loadResourcePathMap('avatar');
        if (!isValid(container) || !isValid(this.node) || !this.node.activeInHierarchy) {
            return;
        }

        for (const child of [...container.children]) {
            child.destroy();
        }

        const ownedAvatarIds = this.getAvatarDisplayIds();
        const selectedLocalAvatarId = this.getSelectedAvatarId();
        const shouldShowRemoteAvatar = this.shouldShowAuthorizedAvatarItem();
        const remoteAvatarSource = shouldShowRemoteAvatar ? this._authorizedAvatarUrl.trim() : '';
        const isUsingAuthorizedAvatar = this.isUsingAuthorizedAvatar();
        this._authorizedAvatarItem = null;
        this._ownedItemViewMap.set('avatar', new Map<number, UserInfoItem>());

        if (remoteAvatarSource) {
            const itemNode = instantiate(prefab);
            container.addChild(itemNode);
            const item = itemNode.getComponent(UserInfoItem);
            item?.setData(remoteAvatarSource, isUsingAuthorizedAvatar);
            this._authorizedAvatarItem = item ?? null;
            itemNode.on(Node.EventType.TOUCH_END, this.onAuthorizedAvatarItemClick, this);
        }

        for (const ownedId of ownedAvatarIds) {
            const resourcePath = resourcePathMap.get(ownedId) || '';
            if (!resourcePath) {
                continue;
            }

            const itemNode = instantiate(prefab);
            container.addChild(itemNode);

            const item = itemNode.getComponent(UserInfoItem);
            item?.setData(resourcePath, !isUsingAuthorizedAvatar && ownedId === selectedLocalAvatarId);
            if (item) {
                this.getOrCreateOwnedItemViewMap('avatar').set(ownedId, item);
            }
            itemNode.on(Node.EventType.TOUCH_END, () => {
                this.onLocalAvatarItemClick(ownedId);
            }, this);
        }

        const layout = container.getComponent(Layout);
        layout?.updateLayout();
        this.updateOwnedContentSize(container);
    }

    private async renderOwnedItems(
        container: Node | null,
        ownedIds: number[],
        category: UserInfoOwnedCategory,
        selectedId: number
    ): Promise<void> {
        if (!container) {
            return;
        }

        this._ownedItemViewMap.set(category, new Map<number, UserInfoItem>());
        const prefab = await this.loadUserInfoItemPrefab();
        if (!prefab || !isValid(container) || !isValid(this.node) || !this.node.activeInHierarchy) {
            return;
        }

        const resourcePathMap = await this.loadResourcePathMap(category);
        if (!isValid(container) || !isValid(this.node) || !this.node.activeInHierarchy) {
            return;
        }

        for (const child of [...container.children]) {
            child.destroy();
        }

        const normalizedOwnedIds = this.normalizeOwnedIds(ownedIds);
        for (const ownedId of normalizedOwnedIds) {
            const resourcePath = resourcePathMap.get(ownedId) || '';
            if (!resourcePath) {
                continue;
            }

            const itemNode = instantiate(prefab);
            container.addChild(itemNode);

            const item = itemNode.getComponent(UserInfoItem);
            item?.setData(resourcePath, ownedId === selectedId);
            if (item) {
                this.getOrCreateOwnedItemViewMap(category).set(ownedId, item);
            }
            itemNode.on(Node.EventType.TOUCH_END, () => {
                this.onOwnedItemClick(category, ownedId);
            }, this);
        }

        const layout = container.getComponent(Layout);
        layout?.updateLayout();
        this.updateOwnedContentSize(container);
    }

    private async loadUserInfoItemPrefab(): Promise<Prefab | null> {
        if (this._itemPrefab) {
            return this._itemPrefab;
        }

        if (this._itemPrefabTask) {
            return await this._itemPrefabTask;
        }

        this._itemPrefabTask = new Promise<Prefab | null>((resolve) => {
            resources.load('userinfo_item', Prefab, (err, prefab) => {
                if (err || !prefab) {
                    console.warn('UserInfo: failed to load userinfo_item prefab', err);
                    resolve(null);
                    this._itemPrefabTask = null;
                    return;
                }

                this._itemPrefab = prefab;
                resolve(prefab);
            });
        });

        return await this._itemPrefabTask;
    }

    private async loadResourcePathMap(category: UserInfoOwnedCategory): Promise<Map<number, string>> {
        const cachedMap = this._resourcePathCache.get(category);
        if (cachedMap) {
            return cachedMap;
        }

        const cachedTask = this._resourcePathTaskCache.get(category);
        if (cachedTask) {
            return await cachedTask;
        }

        const configPath = this.getConfigPath(category);
        const configKey = this.getConfigKey(category);
        const task = new Promise<Map<number, string>>((resolve) => {
            resources.load(configPath, JsonAsset, (err, jsonAsset) => {
                if (err || !jsonAsset) {
                    console.warn(`UserInfo: failed to load ${category} config`, err);
                    resolve(new Map<number, string>());
                    this._resourcePathTaskCache.delete(category);
                    return;
                }

                const json = (jsonAsset.json || {}) as UserInfoResourceConfigFile;
                const configList = this.getConfigItemsByCategory(json, category);
                const configMap = new Map<number, string>();
                for (const item of configList) {
                    const normalizedId = this.normalizeOwnedConfigId(item?.id ?? 0);
                    const resourcePath = (item?.resourcePath || '').trim();
                    if (!resourcePath) {
                        continue;
                    }

                    configMap.set(normalizedId, resourcePath);
                }

                this._resourcePathCache.set(category, configMap);
                resolve(configMap);
            });
        });

        this._resourcePathTaskCache.set(category, task);
        return await task;
    }

    private getConfigPath(category: UserInfoOwnedCategory): string {
        switch (category) {
            case 'avatar':
                return 'avatar/avatar_config';
            case 'avatarFrame':
                return 'avatar_frame/avatar_frame_config';
            case 'tweezer':
                return 'tweezer/tweezer_config';
            case 'iron':
                return 'iron/iron_config';
            case 'achievementIcon':
                return 'achievement_icon/achievement_icon_config';
            default:
                return '';
        }
    }

    private getConfigKey(category: UserInfoOwnedCategory): keyof UserInfoResourceConfigFile {
        switch (category) {
            case 'avatar':
                return 'avatars';
            case 'avatarFrame':
                return 'avatarFrames';
            case 'tweezer':
                return 'tweezers';
            case 'iron':
                return 'irons';
            case 'achievementIcon':
                return 'achievementIcons';
            default:
                return 'avatars';
        }
    }

    private getConfigItemsByCategory(
        json: UserInfoResourceConfigFile,
        category: UserInfoOwnedCategory
    ): UserInfoResourceConfigItem[] {
        switch (category) {
            case 'avatar':
                return Array.isArray(json.avatars) ? json.avatars : [];
            case 'avatarFrame':
                return Array.isArray(json.avatarFrames) ? json.avatarFrames : [];
            case 'tweezer':
                return Array.isArray(json.tweezers) ? json.tweezers : [];
            case 'iron':
                return Array.isArray(json.irons) ? json.irons : [];
            case 'achievementIcon':
                return Array.isArray(json.achievementIcons) ? json.achievementIcons : [];
            default:
                return [];
        }
    }

    private async loadAchievementDescriptionMap(): Promise<Map<number, string>> {
        if (this._achievementDescriptionCache) {
            return this._achievementDescriptionCache;
        }

        if (this._achievementDescriptionTask) {
            return await this._achievementDescriptionTask;
        }

        this._achievementDescriptionTask = new Promise<Map<number, string>>((resolve) => {
            resources.load('achievement_icon/achievement_icon_config', JsonAsset, (err, jsonAsset) => {
                if (err || !jsonAsset) {
                    console.warn('UserInfo: failed to load achievementIcon config', err);
                    const emptyMap = new Map<number, string>();
                    this._achievementDescriptionCache = emptyMap;
                    this._achievementDescriptionTask = null;
                    resolve(emptyMap);
                    return;
                }

                const json = (jsonAsset.json || {}) as UserInfoResourceConfigFile;
                const configList = Array.isArray(json.achievementIcons) ? json.achievementIcons : [];
                const descriptionMap = new Map<number, string>();
                for (const item of configList) {
                    const normalizedId = this.normalizeOwnedConfigId(item?.id ?? 0);
                    descriptionMap.set(normalizedId, String(item?.description || '').trim());
                }

                this._achievementDescriptionCache = descriptionMap;
                this._achievementDescriptionTask = null;
                resolve(descriptionMap);
            });
        });

        return await this._achievementDescriptionTask;
    }

    private loadLocalSpriteFrame(resourcePath: string): Promise<SpriteFrame | null> {
        return new Promise((resolve) => {
            resources.load(`${resourcePath}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
                if (err || !spriteFrame) {
                    console.warn(`UserInfo: failed to load spriteFrame ${resourcePath}`, err);
                    resolve(null);
                    return;
                }

                resolve(spriteFrame);
            });
        });
    }

    private showAchievementDescription(description: string, itemNode?: Node | null): void {
        if (this.ac_description_label) {
            this.ac_description_label.string = description;
        }
        if (this.ac_description_node) {
            if (itemNode && isValid(itemNode)) {
                const worldPosition = itemNode.worldPosition;
                this.ac_description_node.setWorldPosition(
                    worldPosition.x,
                    worldPosition.y,
                    worldPosition.z
                );
            }
            this.ac_description_node.active = true;
        }
    }

    private hideAchievementDescription(): void {
        if (this.ac_description_node) {
            this.ac_description_node.active = false;
        }
    }

    private getSelectedAvatarId(): number {
        const safeAvatarUrl = (this._avatarUrl || '').trim();
        if (/^\d+$/.test(safeAvatarUrl)) {
            return this.normalizeOwnedConfigId(Number(safeAvatarUrl));
        }

        if (!safeAvatarUrl) {
            return this.getCurrentDefaultAvatarId();
        }

        return 0;
    }

    private shouldShowAuthorizedAvatarItem(): boolean {
        return isRemoteAvatarSource(this._authorizedAvatarUrl);
    }

    private isUsingAuthorizedAvatar(): boolean {
        const currentAvatarUrl = (this._avatarUrl || '').trim();
        const authorizedAvatarUrl = (this._authorizedAvatarUrl || '').trim();
        return !!authorizedAvatarUrl
            && isRemoteAvatarSource(currentAvatarUrl)
            && currentAvatarUrl === authorizedAvatarUrl;
    }

    private onAuthorizedAvatarItemClick(): void {
        const authorizedAvatarUrl = (this._authorizedAvatarUrl || '').trim();
        if (!authorizedAvatarUrl || this._avatarUrl === authorizedAvatarUrl) {
            return;
        }

        this.avatarUrl = authorizedAvatarUrl;
        this.refreshAvatarSelectionState();
    }

    private onLocalAvatarItemClick(avatarId: number): void {
        const normalizedAvatarId = this.normalizeOwnedConfigId(avatarId);
        const nextAvatarSource = String(normalizedAvatarId);
        if (this._avatarUrl === nextAvatarSource) {
            return;
        }

        this.avatarUrl = nextAvatarSource;
        this.refreshAvatarSelectionState();
    }

    private onOwnedItemClick(category: UserInfoOwnedCategory, itemId: number): void {
        const normalizedItemId = this.normalizeOwnedConfigId(itemId);

        switch (category) {
            case 'avatarFrame':
                if (this._avatarFrameId === normalizedItemId) {
                    return;
                }
                this.avatarFrameId = normalizedItemId;
                break;
            case 'tweezer':
                if (this._tweezerId === normalizedItemId) {
                    return;
                }
                this.tweezerId = normalizedItemId;
                break;
            case 'iron':
                if (this._ironId === normalizedItemId) {
                    return;
                }
                this.ironId = normalizedItemId;
                break;
            default:
                return;
        }

        this.refreshOwnedCategorySelectionState(category);
    }

    private refreshAvatarSelectionState(): void {
        const selectedLocalAvatarId = this.getSelectedAvatarId();
        const isUsingAuthorizedAvatar = this.isUsingAuthorizedAvatar();

        this._authorizedAvatarItem?.setSelected(isUsingAuthorizedAvatar);
        const avatarItemMap = this._ownedItemViewMap.get('avatar');
        if (!avatarItemMap) {
            return;
        }

        avatarItemMap.forEach((item, avatarId) => {
            item.setSelected(!isUsingAuthorizedAvatar && avatarId === selectedLocalAvatarId);
        });
    }

    private refreshOwnedCategorySelectionState(category: UserInfoOwnedCategory): void {
        const itemMap = this._ownedItemViewMap.get(category);
        if (!itemMap) {
            return;
        }

        let selectedId = 0;
        switch (category) {
            case 'avatarFrame':
                selectedId = this._avatarFrameId;
                break;
            case 'tweezer':
                selectedId = this._tweezerId;
                break;
            case 'iron':
                selectedId = this._ironId;
                break;
            default:
                return;
        }

        itemMap.forEach((item, itemId) => {
            item.setSelected(itemId === selectedId);
        });
    }

    private getOrCreateOwnedItemViewMap(category: UserInfoOwnedCategory): Map<number, UserInfoItem> {
        const existingMap = this._ownedItemViewMap.get(category);
        if (existingMap) {
            return existingMap;
        }

        const itemMap = new Map<number, UserInfoItem>();
        this._ownedItemViewMap.set(category, itemMap);
        return itemMap;
    }

    private updateOwnedContentSize(container: Node): void {
        const containerTransform = container.getComponent(UITransform);
        if (!containerTransform) {
            return;
        }

        const activeChildren = container.children.filter((child) => child.active);
        if (activeChildren.length <= 0) {
            containerTransform.setContentSize(containerTransform.width, 0);
            return;
        }

        let minY = Number.POSITIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        for (const child of activeChildren) {
            const childTransform = child.getComponent(UITransform);
            if (!childTransform) {
                continue;
            }

            const childHeight = childTransform.height * Math.abs(child.scale.y || 1);
            const anchorY = childTransform.anchorPoint.y;
            const childBottom = child.position.y - childHeight * anchorY;
            const childTop = child.position.y + childHeight * (1 - anchorY);

            if (childBottom < minY) {
                minY = childBottom;
            }
            if (childTop > maxY) {
                maxY = childTop;
            }
        }

        if (!isFinite(minY) || !isFinite(maxY)) {
            return;
        }

        containerTransform.setContentSize(containerTransform.width, Math.max(0, maxY - minY));
    }

    private initializeSexState(): void {
        const cachedSex = WXManager.instance?.getUserSex();
        this._sex = cachedSex === 'female' ? 'female' : 'male';
        this.refreshSexDisplay();
        this.refreshAvatarSprite();
    }

    private refreshDefaultAvatarIfNeeded(): void {
        const defaultAvatarId = this._sex === 'female'
            ? UserInfo.DEFAULT_FEMALE_AVATAR_ID
            : UserInfo.DEFAULT_MALE_AVATAR_ID;
        const renderVersion = ++this.avatarRenderVersion;
        void loadAvatarSpriteFrameBySource(String(defaultAvatarId), true, 'UserInfo').then((spriteFrame) => {
            if (!spriteFrame || renderVersion !== this.avatarRenderVersion || !!this._avatarUrl || !this.avatar_sprite) {
                return;
            }

            this.avatar_sprite.spriteFrame = spriteFrame;
        });
    }

    private refreshAvatarSprite(): void {
        if (!this.avatar_sprite) {
            return;
        }

        const avatarSource = this._avatarUrl;
        if (!avatarSource) {
            this.refreshDefaultAvatarIfNeeded();
            return;
        }

        const renderVersion = ++this.avatarRenderVersion;
        void loadAvatarSpriteFrameBySource(avatarSource, true, 'UserInfo').then((spriteFrame) => {
            if (!spriteFrame || renderVersion !== this.avatarRenderVersion || !this.avatar_sprite) {
                return;
            }

            this.avatar_sprite.spriteFrame = spriteFrame;
        });
    }

    private bindCloseButtonEvents(): void {
        this.close_btn?.on(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
    }

    private unbindCloseButtonEvents(): void {
        this.close_btn?.off(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
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

    private onCloseBtnClick(): void {
        this.closePanel();
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
        this.saveSelectedAppearanceToStorage();
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

    private saveSelectedAppearanceToStorage(): void {
        const wxManager = WXManager.instance;
        if (!wxManager) {
            return;
        }

        wxManager.setCurrentAvatarSource(this._avatarUrl);
        wxManager.setAvatarFrameId(this._avatarFrameId);
        wxManager.setTweezerId(this._tweezerId);
        wxManager.setIronId(this._ironId);
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

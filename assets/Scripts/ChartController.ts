import { _decorator, assetManager, Color, Component, EventTouch, ImageAsset, input, Input, instantiate, isValid, Label, Layout, Node, Prefab, resources, ScrollView, Sprite, SpriteFrame, Texture2D, UITransform, Vec2 } from 'cc';
import { DifficultyMode, GameManager } from './GameManager';
import { ChartUser } from './ChartUser';
import { DifficultySummary, LevelBest, PlayerService } from './PlayerService';
const { ccclass, property } = _decorator;

declare const wx: any;

interface DifficultyRankingCache {
    data: DifficultySummary[];
    updatedAt: number;
}

interface LevelRankingCache {
    data: LevelBest[];
    updatedAt: number;
}

const CACHE_TTL_MS = 60 * 1000;
const RANKING_LIMIT = 100;
const CHART_USER_PREFAB_PATH = 'chart_user';
const STORAGE_KEY_PREFIX = 'chart_ranking_cache_';

@ccclass('ChartController')
export class ChartController extends Component {
    @property({ type: Node })
    simple_tag: Node = null;

    @property({ type: Node })
    medium_tag: Node = null;

    @property({ type: Node })
    hard_tag: Node = null;

    @property({ type: Node })
    close_btn: Node = null;

    @property({ type: Sprite })
    owner_avatar_sprite: Sprite = null;

    @property({ type: Label })
    owner_name_label: Label = null;

    @property({ type: Label })
    owner_number_label: Label = null;

    @property({ type: Label })
    owner_level_label: Label = null;

    @property({ type: Node })
    content: Node = null;

    @property({ type: Node })
    chart_bg: Node = null;

    private currentDifficulty: DifficultyMode = DifficultyMode.SIMPLE;
    private currentLevelNo = 1;
    private currentViewMode: 'difficulty' | 'level' = 'difficulty';
    private readonly rankingCache = new Map<DifficultyMode, DifficultyRankingCache>();
    private readonly levelRankingCache = new Map<string, LevelRankingCache>();
    private readonly refreshTasks = new Map<DifficultyMode, Promise<void>>();
    private readonly levelRefreshTasks = new Map<string, Promise<void>>();
    private readonly avatarFrameCache = new Map<string, SpriteFrame | null>();
    private readonly avatarLoadTasks = new Map<string, Promise<SpriteFrame | null>>();
    private chartUserPrefab: Prefab | null = null;
    private chartUserPrefabTask: Promise<Prefab | null> | null = null;
    private defaultOwnerAvatarSpriteFrame: SpriteFrame | null = null;
    private renderVersion = 0;

    onLoad() {
        this.defaultOwnerAvatarSpriteFrame = this.owner_avatar_sprite?.spriteFrame ?? null;
        this.restoreAllCachesFromStorage();
        this.bindButtonEvents();
        void this.loadChartUserPrefab();
    }

    onEnable() {
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        if (this.currentViewMode === 'level') {
            this.showLevelRankingOrLoading();
            void this.refreshLevelRankingIfNeeded();
            return;
        }

        this.showCachedOrLoading();
        void this.refreshIfNeeded();
    }

    onDisable() {
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        this.renderVersion++;
    }

    onDestroy() {
        this.unbindButtonEvents();
    }

    public openDifficultyRanking(difficulty: DifficultyMode = this.currentDifficulty, forceRefresh: boolean = false): void {
        this.currentViewMode = 'difficulty';
        this.currentDifficulty = difficulty;
        this.setDifficultyTagsVisible(true);
        this.node.active = true;
        this.showCachedOrLoading(difficulty);
        void this.refreshIfNeeded(forceRefresh, difficulty);
    }

    public openLevelRanking(difficulty: DifficultyMode, levelNo: number, forceRefresh: boolean = false): void {
        this.currentViewMode = 'level';
        this.currentDifficulty = difficulty;
        this.currentLevelNo = Math.max(1, levelNo);
        this.setDifficultyTagsVisible(false);
        this.node.active = true;
        this.showLevelRankingOrLoading();
        void this.refreshLevelRankingIfNeeded(forceRefresh);
    }

    public showCachedOrLoading(difficulty: DifficultyMode = this.currentDifficulty): void {
        this.restoreCacheFromStorage(difficulty);
        this.currentDifficulty = difficulty;
        this.updateDifficultyTagState();
        this.renderCurrentDifficulty();
    }

    public async refreshIfNeeded(force: boolean = false, difficulty: DifficultyMode = this.currentDifficulty): Promise<void> {
        this.restoreCacheFromStorage(difficulty);
        const cache = this.rankingCache.get(difficulty);
        if (!force && cache && !this.isCacheExpired(cache.updatedAt)) {
            if (this.node.active && this.currentDifficulty === difficulty) {
                this.renderCurrentDifficulty();
            }
            return;
        }

        await this.refreshDifficultyRanking(difficulty);
    }

    public async preloadAllRankings(force: boolean = false): Promise<void> {
        const difficulties = [DifficultyMode.SIMPLE, DifficultyMode.MEDIUM, DifficultyMode.HARD];
        difficulties.forEach((difficulty) => this.restoreCacheFromStorage(difficulty));

        if (!force) {
            const hasFreshCache = difficulties.every((difficulty) => {
                const cache = this.rankingCache.get(difficulty);
                return !!cache && !this.isCacheExpired(cache.updatedAt);
            });
            if (hasFreshCache) {
                return;
            }
        }

        await Promise.all(difficulties.map((difficulty) => this.refreshIfNeeded(force, difficulty)));
    }

    private showLevelRankingOrLoading(): void {
        this.restoreLevelCacheFromStorage(this.currentDifficulty, this.currentLevelNo);
        this.setDifficultyTagsVisible(false);
        this.renderCurrentLevelRanking();
    }

    private async refreshLevelRankingIfNeeded(force: boolean = false): Promise<void> {
        this.restoreLevelCacheFromStorage(this.currentDifficulty, this.currentLevelNo);
        const levelKey = this.getLevelRankingKey(this.currentDifficulty, this.currentLevelNo);
        const cache = this.levelRankingCache.get(levelKey);
        if (!force && cache && !this.isCacheExpired(cache.updatedAt)) {
            if (this.node.active && this.currentViewMode === 'level') {
                this.renderCurrentLevelRanking();
            }
            return;
        }

        await this.refreshCurrentLevelRanking();
    }

    private bindButtonEvents(): void {
        if (this.close_btn) {
            this.close_btn.on(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
        }
        if (this.simple_tag) {
            this.simple_tag.on(Node.EventType.TOUCH_END, this.onSimpleTagClick, this);
        }
        if (this.medium_tag) {
            this.medium_tag.on(Node.EventType.TOUCH_END, this.onMediumTagClick, this);
        }
        if (this.hard_tag) {
            this.hard_tag.on(Node.EventType.TOUCH_END, this.onHardTagClick, this);
        }
    }

    private unbindButtonEvents(): void {
        if (this.close_btn) {
            this.close_btn.off(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
        }
        if (this.simple_tag) {
            this.simple_tag.off(Node.EventType.TOUCH_END, this.onSimpleTagClick, this);
        }
        if (this.medium_tag) {
            this.medium_tag.off(Node.EventType.TOUCH_END, this.onMediumTagClick, this);
        }
        if (this.hard_tag) {
            this.hard_tag.off(Node.EventType.TOUCH_END, this.onHardTagClick, this);
        }
    }

    private onSimpleTagClick(): void {
        this.switchDifficulty(DifficultyMode.SIMPLE);
    }

    private onMediumTagClick(): void {
        this.switchDifficulty(DifficultyMode.MEDIUM);
    }

    private onHardTagClick(): void {
        this.switchDifficulty(DifficultyMode.HARD);
    }

    private switchDifficulty(difficulty: DifficultyMode): void {
        if (this.currentDifficulty === difficulty) {
            this.showCachedOrLoading(difficulty);
            void this.refreshIfNeeded(false, difficulty);
            return;
        }

        this.currentDifficulty = difficulty;
        this.updateDifficultyTagState();
        this.renderCurrentDifficulty();
        void this.refreshIfNeeded(false, difficulty);
    }

    private onTouchEnd(event: EventTouch): void {
        const touch = event.touch;
        if (!touch) return;

        const touchPos = touch.getUILocation();
        if (this.isTouchInContentPanel(touchPos)) {
            return;
        }

        this.closeChart();
    }

    private isTouchInContentPanel(touchPos: Vec2): boolean {
        if (!this.chart_bg) return false;

        const contentTransform = this.chart_bg.getComponent(UITransform);
        if (!contentTransform) return false;

        return contentTransform.getBoundingBoxToWorld().contains(touchPos);
    }

    private onCloseBtnClick(): void {
        this.closeChart();
    }

    private closeChart(): void {
        this.node.active = false;
    }

    private renderCurrentDifficulty(): void {
        const renderToken = ++this.renderVersion;
        const cache = this.rankingCache.get(this.currentDifficulty);
        const ranking = cache?.data ?? [];
        const visibleRanking = ranking.filter((item) => item.highestLevel > 0);
        const hasCache = !!cache;

        this.renderOwnerSummary(ranking, renderToken);

        if (visibleRanking.length > 0) {
            void this.renderRankingList(visibleRanking, renderToken);
            return;
        }

        const placeholderMessage = hasCache ? ' \u6682\u65e0\u6392\u884c' : ' \u52a0\u8f7d\u4e2d...';
        void this.renderPlaceholder(placeholderMessage, renderToken);
    }

    private renderCurrentLevelRanking(): void {
        const renderToken = ++this.renderVersion;
        const levelKey = this.getLevelRankingKey(this.currentDifficulty, this.currentLevelNo);
        const cache = this.levelRankingCache.get(levelKey);
        const ranking = cache?.data ?? [];
        const hasCache = !!cache;

        this.renderLevelOwnerSummary(ranking, renderToken);

        if (ranking.length > 0) {
            void this.renderLevelRankingList(ranking, renderToken);
            return;
        }

        const placeholderMessage = hasCache ? ' \u6682\u65e0\u6392\u884c' : ' \u52a0\u8f7d\u4e2d...';
        void this.renderPlaceholder(placeholderMessage, renderToken);
    }

    private renderOwnerSummary(ranking: DifficultySummary[], renderToken: number): void {
        const gameManager = GameManager.getInstance();
        const playerService = PlayerService.instance;
        const wxManager = gameManager?.wxManager;
        const openid = gameManager?.openid ?? '';
        const fallbackNickname = openid ? `\u8c46\u53cb${openid.slice(-4)}` : '\u8c46\u53cb';
        const ownerEntry = openid ? ranking.find((item) => item.userId === openid) ?? null : null;
        const cachedLevel = Math.max(0, (playerService?.getCachedLevel(this.currentDifficulty) ?? 1) - 1);
        const ownerHighestLevel = ownerEntry?.highestLevel ?? cachedLevel;
        const ownerRank = ownerEntry ? ranking.findIndex((item) => item.userId === ownerEntry.userId) + 1 : 0;
        const ownerRankText = ownerHighestLevel > 0
            ? (ownerRank > 0 ? `${ownerRank}` : (ranking.length > 0 ? `${ranking.length}+` : '--'))
            : '--';
        const ownerLevelText = ownerHighestLevel > 0 ? this.formatLevelText(ownerHighestLevel) : '--';
        const ownerNickname = ownerEntry?.nickname?.trim() || wxManager?.nickname?.trim() || fallbackNickname;
        const avatarUrl = ownerEntry?.avatarUrl || wxManager?.avatarUrl || '';

        if (this.owner_name_label) {
            this.owner_name_label.string = this.formatNicknameText(ownerNickname);
        }
        if (this.owner_number_label) {
            this.owner_number_label.string = ownerRankText;
        }
        if (this.owner_level_label) {
            this.owner_level_label.string = ownerLevelText;
        }

        this.resetOwnerAvatar();
        if (avatarUrl) {
            void this.applyAvatarToSprite(this.owner_avatar_sprite, avatarUrl, renderToken);
        }
    }

    private renderLevelOwnerSummary(ranking: LevelBest[], renderToken: number): void {
        const gameManager = GameManager.getInstance();
        const wxManager = gameManager?.wxManager;
        const openid = gameManager?.openid ?? '';
        const fallbackNickname = openid ? `\u8c46\u53cb${openid.slice(-4)}` : '\u8c46\u53cb';
        const ownerEntry = openid ? ranking.find((item) => item.userId === openid) ?? null : null;
        const ownerRank = ownerEntry ? ranking.findIndex((item) => item.userId === ownerEntry.userId) + 1 : 0;
        const ownerNickname = ownerEntry?.nickname?.trim() || wxManager?.nickname?.trim() || fallbackNickname;
        const ownerTimeText = ownerEntry ? this.formatClearTimeText(ownerEntry.bestClearTime) : '--';
        const ownerRankText = ownerEntry ? `${ownerRank}` : '--';
        const avatarUrl = ownerEntry?.avatarUrl || wxManager?.avatarUrl || '';

        if (this.owner_name_label) {
            this.owner_name_label.string = this.formatNicknameText(ownerNickname);
        }
        if (this.owner_number_label) {
            this.owner_number_label.string = ownerRankText;
        }
        if (this.owner_level_label) {
            this.owner_level_label.string = ownerTimeText;
        }

        this.resetOwnerAvatar();
        if (avatarUrl) {
            void this.applyAvatarToSprite(this.owner_avatar_sprite, avatarUrl, renderToken);
        }
    }

    private async renderRankingList(ranking: DifficultySummary[], renderToken: number): Promise<void> {
        const prefab = await this.loadChartUserPrefab();
        if (!prefab || renderToken !== this.renderVersion || !isValid(this.content)) {
            return;
        }

        this.content.destroyAllChildren();

        for (let index = 0; index < ranking.length; index++) {
            const itemData = ranking[index];
            const itemNode = instantiate(prefab);
            this.content.addChild(itemNode);

            const item = itemNode.getComponent(ChartUser);
            if (!item) continue;

            const nickname = itemData.nickname?.trim() || this.getFallbackNickname(itemData.userId);
            item.applyRankingData(index + 1, nickname, this.formatLevelText(itemData.highestLevel));

            if (itemData.avatarUrl) {
                void this.applyAvatarToChartUser(item, itemData.avatarUrl, renderToken);
            }
        }

        this.updateListLayout();
        this.scrollToTop();
    }

    private async renderLevelRankingList(ranking: LevelBest[], renderToken: number): Promise<void> {
        const prefab = await this.loadChartUserPrefab();
        if (!prefab || renderToken !== this.renderVersion || !isValid(this.content)) {
            return;
        }

        this.content.destroyAllChildren();

        for (let index = 0; index < ranking.length; index++) {
            const itemData = ranking[index];
            const itemNode = instantiate(prefab);
            this.content.addChild(itemNode);

            const item = itemNode.getComponent(ChartUser);
            if (!item) continue;

            const nickname = itemData.nickname?.trim() || this.getFallbackNickname(itemData.userId);
            item.applyRankingData(index + 1, nickname, this.formatClearTimeText(itemData.bestClearTime));

            if (itemData.avatarUrl) {
                void this.applyAvatarToChartUser(item, itemData.avatarUrl, renderToken);
            }
        }

        this.updateListLayout();
        this.scrollToTop();
    }

    private async renderPlaceholder(message: string, renderToken: number): Promise<void> {
        const prefab = await this.loadChartUserPrefab();
        if (!prefab || renderToken !== this.renderVersion || !isValid(this.content)) {
            return;
        }

        this.content.destroyAllChildren();
        const itemNode = instantiate(prefab);
        this.content.addChild(itemNode);

        const item = itemNode.getComponent(ChartUser);
        item?.applyPlaceholder(message);

        this.updateListLayout();
        this.scrollToTop();
    }

    private async refreshDifficultyRanking(difficulty: DifficultyMode): Promise<void> {
        const existingTask = this.refreshTasks.get(difficulty);
        if (existingTask) {
            await existingTask;
            return;
        }

        const task = (async () => {
            try {
                const playerService = PlayerService.instance;
                if (!playerService) {
                    console.warn(`ChartController: PlayerService is not ready for ${difficulty} ranking refresh`);
                    return;
                }

                const ranking = await playerService.getDifficultyRanking(difficulty, RANKING_LIMIT);
                const cache: DifficultyRankingCache = {
                    data: ranking,
                    updatedAt: Date.now(),
                };

                this.rankingCache.set(difficulty, cache);
                this.saveCacheToStorage(difficulty, cache);

                if (this.node.active && this.currentDifficulty === difficulty) {
                    this.renderCurrentDifficulty();
                }
            } catch (error) {
                console.warn(`ChartController: failed to refresh ${difficulty} ranking`, error);
                if (this.node.active && this.currentDifficulty === difficulty && !this.rankingCache.has(difficulty)) {
                    this.renderCurrentDifficulty();
                }
            }
        })();

        this.refreshTasks.set(difficulty, task);

        try {
            await task;
        } finally {
            this.refreshTasks.delete(difficulty);
        }
    }

    private async refreshCurrentLevelRanking(): Promise<void> {
        const levelKey = this.getLevelRankingKey(this.currentDifficulty, this.currentLevelNo);
        const existingTask = this.levelRefreshTasks.get(levelKey);
        if (existingTask) {
            await existingTask;
            return;
        }

        const task = (async () => {
            try {
                const playerService = PlayerService.instance;
                if (!playerService) {
                    console.warn(`ChartController: PlayerService is not ready for ${levelKey} ranking refresh`);
                    return;
                }

                const ranking = await playerService.getLevelRanking(this.currentDifficulty, this.currentLevelNo, RANKING_LIMIT);
                const cache: LevelRankingCache = {
                    data: ranking,
                    updatedAt: Date.now(),
                };

                this.levelRankingCache.set(levelKey, cache);
                this.saveLevelCacheToStorage(this.currentDifficulty, this.currentLevelNo, cache);

                if (this.node.active && this.currentViewMode === 'level') {
                    this.renderCurrentLevelRanking();
                }
            } catch (error) {
                console.warn(`ChartController: failed to refresh ${levelKey} ranking`, error);
                if (this.node.active && this.currentViewMode === 'level' && !this.levelRankingCache.has(levelKey)) {
                    this.renderCurrentLevelRanking();
                }
            }
        })();

        this.levelRefreshTasks.set(levelKey, task);

        try {
            await task;
        } finally {
            this.levelRefreshTasks.delete(levelKey);
        }
    }

    private updateDifficultyTagState(): void {
        this.setTagSelected(this.simple_tag, this.currentDifficulty === DifficultyMode.SIMPLE);
        this.setTagSelected(this.medium_tag, this.currentDifficulty === DifficultyMode.MEDIUM);
        this.setTagSelected(this.hard_tag, this.currentDifficulty === DifficultyMode.HARD);
    }

    private setDifficultyTagsVisible(visible: boolean): void {
        if (this.simple_tag) this.simple_tag.active = visible;
        if (this.medium_tag) this.medium_tag.active = visible;
        if (this.hard_tag) this.hard_tag.active = visible;

        if (visible) {
            this.updateDifficultyTagState();
        }
    }

    private setTagSelected(tagNode: Node | null, selected: boolean): void {
        if (!tagNode) return;

        const tagSprite = tagNode.getComponent(Sprite);
        if (tagSprite) {
            tagSprite.color = selected ? new Color(255, 255, 255, 255) : new Color(200, 200, 200, 255);
        }
    }

    private updateListLayout(): void {
        if (!this.content) {
            return;
        }

        this.updateContentHeight();

        const layout = this.content.getComponent(Layout);
        layout?.updateLayout();
    }

    private updateContentHeight(): void {
        const contentTransform = this.content?.getComponent(UITransform);
        if (!contentTransform) {
            return;
        }

        const layout = this.content.getComponent(Layout);
        const activeChildren = this.content.children.filter((child) => child.active);
        const firstChild = activeChildren[0] ?? null;
        const firstChildTransform = firstChild?.getComponent(UITransform) ?? null;
        const itemHeight = firstChildTransform ? firstChildTransform.height * Math.abs(firstChild.scale.y || 1) : 0;
        const childrenHeight = itemHeight * activeChildren.length;

        const spacingY = layout?.spacingY ?? 0;
        const paddingTop = layout?.paddingTop ?? 0;
        const paddingBottom = layout?.paddingBottom ?? 0;
        const totalSpacing = activeChildren.length > 1 ? spacingY * (activeChildren.length - 1) : 0;
        const nextHeight = childrenHeight + totalSpacing + paddingTop + paddingBottom;

        contentTransform.setContentSize(contentTransform.width, Math.max(nextHeight, 0));
    }

    private scrollToTop(): void {
        const scrollView = this.content?.parent?.parent?.getComponent(ScrollView);
        scrollView?.scrollToTop(0.05);
    }

    private resetOwnerAvatar(): void {
        if (this.owner_avatar_sprite) {
            this.owner_avatar_sprite.spriteFrame = this.defaultOwnerAvatarSpriteFrame;
        }
    }

    private async applyAvatarToChartUser(item: ChartUser, avatarUrl: string, renderToken: number): Promise<void> {
        const spriteFrame = await this.loadAvatarSpriteFrame(avatarUrl);
        if (!spriteFrame || renderToken !== this.renderVersion || !isValid(item?.node)) {
            return;
        }

        item.setAvatarSpriteFrame(spriteFrame);
    }

    private async applyAvatarToSprite(sprite: Sprite | null, avatarUrl: string, renderToken: number): Promise<void> {
        if (!sprite) return;

        const spriteFrame = await this.loadAvatarSpriteFrame(avatarUrl);
        if (!spriteFrame || renderToken !== this.renderVersion || !isValid(sprite.node)) {
            return;
        }

        sprite.spriteFrame = spriteFrame;
    }

    private async loadAvatarSpriteFrame(avatarUrl: string): Promise<SpriteFrame | null> {
        if (!avatarUrl) return null;

        if (this.avatarFrameCache.has(avatarUrl)) {
            return this.avatarFrameCache.get(avatarUrl) ?? null;
        }

        const existingTask = this.avatarLoadTasks.get(avatarUrl);
        if (existingTask) {
            return await existingTask;
        }

        const task = this.loadAvatarSpriteFrameWithRetry(avatarUrl);

        this.avatarLoadTasks.set(avatarUrl, task);

        try {
            return await task;
        } finally {
            this.avatarLoadTasks.delete(avatarUrl);
        }
    }

    private async loadAvatarSpriteFrameWithRetry(avatarUrl: string): Promise<SpriteFrame | null> {
        let spriteFrame = await this.loadAvatarSpriteFrameOnce(avatarUrl, false);
        if (spriteFrame) {
            this.avatarFrameCache.set(avatarUrl, spriteFrame);
            return spriteFrame;
        }

        this.clearRemoteAvatarCache(avatarUrl);
        spriteFrame = await this.loadAvatarSpriteFrameOnce(avatarUrl, true);
        this.avatarFrameCache.set(avatarUrl, spriteFrame);
        return spriteFrame;
    }

    private loadAvatarSpriteFrameOnce(avatarUrl: string, shouldWarn: boolean): Promise<SpriteFrame | null> {
        return new Promise<SpriteFrame | null>((resolve) => {
            const ext = this.getAvatarExtension(avatarUrl);
            assetManager.loadRemote<ImageAsset>(avatarUrl, { ext }, (err, imageAsset) => {
                if (err || !imageAsset) {
                    if (shouldWarn) {
                        console.warn(`ChartController: failed to load avatar ${avatarUrl}`, err);
                    }
                    resolve(null);
                    return;
                }

                const texture = new Texture2D();
                texture.image = imageAsset;

                const spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;
                resolve(spriteFrame);
            });
        });
    }

    private clearRemoteAvatarCache(avatarUrl: string): void {
        const cacheManager = (assetManager as any)?.cacheManager;
        cacheManager?.removeCache?.(avatarUrl);
    }

    private getAvatarExtension(avatarUrl: string): string {
        const normalizedUrl = avatarUrl.split('?')[0].toLowerCase();
        if (normalizedUrl.includes('thirdwx.qlogo.cn') || normalizedUrl.includes('wx.qlogo.cn')) {
            return '.jpg';
        }
        if (normalizedUrl.endsWith('.jpg') || normalizedUrl.endsWith('.jpeg')) {
            return '.jpg';
        }
        if (normalizedUrl.endsWith('.webp')) {
            return '.webp';
        }
        if (normalizedUrl.endsWith('.png')) {
            return '.png';
        }
        return '.jpg';
    }

    private async loadChartUserPrefab(): Promise<Prefab | null> {
        if (this.chartUserPrefab) {
            return this.chartUserPrefab;
        }

        if (this.chartUserPrefabTask) {
            return await this.chartUserPrefabTask;
        }

        this.chartUserPrefabTask = new Promise<Prefab | null>((resolve) => {
            resources.load(CHART_USER_PREFAB_PATH, Prefab, (err, prefab) => {
                if (err || !prefab) {
                    console.warn('ChartController: failed to load chart user prefab', err);
                    this.chartUserPrefabTask = null;
                    resolve(null);
                    return;
                }

                this.chartUserPrefab = prefab;
                resolve(prefab);
            });
        });

        return await this.chartUserPrefabTask;
    }

    private restoreAllCachesFromStorage(): void {
        this.restoreCacheFromStorage(DifficultyMode.SIMPLE);
        this.restoreCacheFromStorage(DifficultyMode.MEDIUM);
        this.restoreCacheFromStorage(DifficultyMode.HARD);
    }

    private restoreCacheFromStorage(difficulty: DifficultyMode): void {
        if (this.rankingCache.has(difficulty) || typeof wx === 'undefined') {
            return;
        }

        try {
            const rawCache = wx.getStorageSync(this.getStorageKey(difficulty)) as DifficultyRankingCache | undefined;
            if (!rawCache || !Array.isArray(rawCache.data) || typeof rawCache.updatedAt !== 'number') {
                return;
            }

            this.rankingCache.set(difficulty, {
                data: rawCache.data,
                updatedAt: rawCache.updatedAt,
            });
        } catch (error) {
            console.warn(`ChartController: failed to restore ${difficulty} ranking cache`, error);
        }
    }

    private saveCacheToStorage(difficulty: DifficultyMode, cache: DifficultyRankingCache): void {
        if (typeof wx === 'undefined') {
            return;
        }

        try {
            wx.setStorageSync(this.getStorageKey(difficulty), cache);
        } catch (error) {
            console.warn(`ChartController: failed to save ${difficulty} ranking cache`, error);
        }
    }

    private restoreLevelCacheFromStorage(difficulty: DifficultyMode, levelNo: number): void {
        if (typeof wx === 'undefined') {
            return;
        }

        const levelKey = this.getLevelRankingKey(difficulty, levelNo);
        if (this.levelRankingCache.has(levelKey)) {
            return;
        }

        try {
            const rawCache = wx.getStorageSync(this.getLevelStorageKey(difficulty, levelNo)) as LevelRankingCache | undefined;
            if (!rawCache || !Array.isArray(rawCache.data) || typeof rawCache.updatedAt !== 'number') {
                return;
            }

            this.levelRankingCache.set(levelKey, {
                data: rawCache.data,
                updatedAt: rawCache.updatedAt,
            });
        } catch (error) {
            console.warn(`ChartController: failed to restore ${levelKey} ranking cache`, error);
        }
    }

    private saveLevelCacheToStorage(difficulty: DifficultyMode, levelNo: number, cache: LevelRankingCache): void {
        if (typeof wx === 'undefined') {
            return;
        }

        const levelKey = this.getLevelRankingKey(difficulty, levelNo);
        try {
            wx.setStorageSync(this.getLevelStorageKey(difficulty, levelNo), cache);
        } catch (error) {
            console.warn(`ChartController: failed to save ${levelKey} ranking cache`, error);
        }
    }

    private getStorageKey(difficulty: DifficultyMode): string {
        return `${STORAGE_KEY_PREFIX}${difficulty}`;
    }

    private getLevelStorageKey(difficulty: DifficultyMode, levelNo: number): string {
        return `${STORAGE_KEY_PREFIX}${difficulty}_level_${levelNo}`;
    }

    private getLevelRankingKey(difficulty: DifficultyMode, levelNo: number): string {
        return `${difficulty}#${levelNo}`;
    }

    private isCacheExpired(updatedAt: number): boolean {
        return Date.now() - updatedAt > CACHE_TTL_MS;
    }

    private getFallbackNickname(userId: string): string {
        if (!userId) return '\u8c46\u53cb';
        return `\u8c46\u53cb${userId.slice(-4)}`;
    }

    private formatLevelText(highestLevel: number): string {
        return ` \u7b2c${highestLevel}\u5173`;
    }

    private formatClearTimeText(clearTime: number): string {
        return clearTime >= 0 ? ` ${clearTime}s` : ' --';
    }

    private formatNicknameText(nickname: string): string {
        return ` ${nickname}`;
    }
}

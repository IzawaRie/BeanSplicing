import { _decorator, Color, Component, EventTouch, input, Input, instantiate, JsonAsset, Label, Layout, Node, Prefab, resources, Sprite, SpriteFrame, UITransform, Vec2 } from 'cc';
import { BookItem } from './BookItem';
import { DifficultyMode, GameManager } from './GameManager';
import { WXManager } from './WXManager';
import { AudioManager } from './AudioManager';
const { ccclass, property } = _decorator;

type BookDifficulty = 'simple' | 'medium' | 'hard';

type BookConfigItem = {
    levelId: number;
    imagePath: string;
    type: string;
};

type BookConfigFile = Record<BookDifficulty, BookConfigItem[]>;
type BookTypeFilter = 'all' | string;

type BookRewardItem = {
    imagePath: string;
    count: number;
    type: string;
};

type BookProgressRewardItem = {
    progress: number;
    rewards: BookRewardItem[];
};

type BookProgressRewardConfigFile = Record<BookDifficulty, BookProgressRewardItem[]>;

type GiftItem = {
    gift_sp: Sprite;
    gift_label: Label;
    baseWidth: number;
    baseHeight: number;
};

const BOOK_CONFIG_PATH = 'book/book_config';
const BOOK_PROGRESS_REWARD_CONFIG_PATH = 'book/book_progress_reward_config';
const TYPE_TAG_PREFAB_PATH = 'tu_type_tag';
const BOOK_PAGE_SIZE = 12;
const SELECTED_TYPE_TAG_COLOR = new Color(252, 158, 121, 255);
const NORMAL_TYPE_TAG_COLOR = new Color(255, 255, 255, 255);
const DIFFICULTY_TITLE_TEXT: Record<BookDifficulty, string> = {
    simple: '简单难度',
    medium: '进阶难度',
    hard: '高手难度'
};
const DIFFICULTY_TITLE_COLOR: Record<BookDifficulty, Color> = {
    simple: new Color(62, 167, 18, 255),
    medium: new Color(31, 67, 143, 255),
    hard: new Color(202, 75, 12, 255)
};
const TYPE_TAG_TEXT: Record<string, string> = {
    all: '全部',
    animal: '动物',
    food: '美食',
    plant: '植物',
    character: '角色',
    object: '物品'
};
const TYPE_TAG_ORDER = ['animal', 'food', 'plant', 'character', 'object'];
const BOOK_DIFFICULTIES: BookDifficulty[] = ['simple', 'medium', 'hard'];

@ccclass('BookController')
export class BookController extends Component {
    @property({ type: Node })
    close_btn: Node = null;

    @property({ type: Node })
    border_bg: Node = null;

    @property({ type: Node })
    progress_icons: Node = null;

    @property({ type: Node })
    type_tag_content: Node = null;

    @property({ type: Node })
    tu_simple_tag: Node = null;

    @property({ type: Node })
    tu_medium_tag: Node = null;

    @property({ type: Node })
    tu_hard_tag: Node = null;

    @property({ type: Node })
    tu_items: Node = null;

    @property({ type: Node })
    tu_jindu_icons: Node = null;

    @property({ type: Node })
    tu_gift: Node = null;

    @property({ type: Node })
    tu_gift_view: Node = null;

    @property({ type: Node })
    tu_switch_last_btn: Node = null;

    @property({ type: Node })
    tu_switch_next_btn: Node = null;

    @property({ type: Label })
    progress_label: Label = null;

    @property({ type: Label })
    tu_shaixuan_title: Label = null;

    @property({ type: Label })
    tu_jindu_title: Label = null;

    @property({ type: Label })
    tu_jindu_label: Label = null;

    @property({ type: Label })
    tu_pages_label: Label = null;

    @property({ type: Label })
    tu_gift_label: Label = null;

    @property({ type: SpriteFrame })
    tu_simple_tag_normal: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_simple_tag_selected: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_medium_tag_normal: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_medium_tag_selected: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_hard_tag_normal: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_hard_tag_selected: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_progress_sp_normal: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_progress_sp_green: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_progress_sp_blue: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_progress_sp_orange: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_item_bg_unlocked: SpriteFrame = null;

    @property({ type: SpriteFrame })
    tu_item_bg_locked: SpriteFrame = null;

    private gift_items: GiftItem[] = [];
    private book_items: BookItem[] = [];
    private currentDifficulty: BookDifficulty = 'simple';
    private currentType: BookTypeFilter = 'all';
    private currentPage = 0;
    private bookConfig: BookConfigFile = {
        simple: [],
        medium: [],
        hard: []
    };
    private bookProgressRewardConfig: BookProgressRewardConfigFile = {
        simple: [],
        medium: [],
        hard: []
    };
    private unlockedBookIds: Record<BookDifficulty, Set<number>> = {
        simple: new Set<number>(),
        medium: new Set<number>(),
        hard: new Set<number>()
    };
    private typeTagNodes: Node[] = [];
    private typeTagPrefab: Prefab | null = null;
    private typeTagPrefabTask: Promise<Prefab | null> | null = null;
    private typeTagRenderVersion = 0;
    private giftRenderVersion = 0;
    private isShowingBookVideoAd = false;

    onLoad() {
        if (this.tu_gift_view) {
            this.tu_gift_view.active = false;
        }
        this.bindButtonEvents();
        this.initializeGiftItems();
        this.initializeBookItems();
        this.selectDifficulty('simple');
        void this.loadBookConfig();
        void this.loadBookProgressRewardConfig();
    }

    onEnable() {
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        void this.renderTypeTags();
        void this.refreshFromStorage();
    }

    onDisable() {
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    start() {
    }

    update(_deltaTime: number) {
    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        this.clearTypeTags();
        this.unbindButtonEvents();
    }

    private initializeGiftItems(): void {
        this.gift_items.length = 0;
        const giftView = this.tu_gift_view;
        if (!giftView) {
            return;
        }

        for (let i = 0; i < giftView.children.length; i++) {
            const giftNode = giftView.children[i];
            const gift_sp = giftNode.getChildByName('gift_icon')?.getComponent(Sprite) ?? null;
            const gift_label = giftNode.getChildByName('gift_label')?.getComponent(Label) ?? null;
            if (gift_sp && gift_label) {
                const transform = gift_sp.node.getComponent(UITransform);
                this.gift_items.push({
                    gift_sp,
                    gift_label,
                    baseWidth: transform?.width ?? 0,
                    baseHeight: transform?.height ?? 0
                });
            }
        }
    }

    private initializeBookItems(): void {
        this.book_items.length = 0;
        const itemRoot = this.tu_items;
        if (!itemRoot) {
            return;
        }

        for (let i = 0; i < itemRoot.children.length; i++) {
            const bookItem = itemRoot.children[i].getComponent(BookItem);
            if (bookItem) {
                this.book_items.push(bookItem);
            }
        }
    }

    private bindButtonEvents(): void {
        this.close_btn?.on(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
        this.tu_switch_last_btn?.on(Node.EventType.TOUCH_END, this.onSwitchLastBtnClick, this);
        this.tu_switch_next_btn?.on(Node.EventType.TOUCH_END, this.onSwitchNextBtnClick, this);
        this.tu_simple_tag?.on(Node.EventType.TOUCH_END, this.onSimpleTagClick, this);
        this.tu_medium_tag?.on(Node.EventType.TOUCH_END, this.onMediumTagClick, this);
        this.tu_hard_tag?.on(Node.EventType.TOUCH_END, this.onHardTagClick, this);
        this.tu_gift?.on(Node.EventType.TOUCH_START, this.onGiftTouchStart, this);
        this.tu_gift?.on(Node.EventType.TOUCH_END, this.onGiftTouchEnd, this);
        this.tu_gift?.on(Node.EventType.TOUCH_CANCEL, this.onGiftTouchEnd, this);
    }

    private unbindButtonEvents(): void {
        this.close_btn?.off(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
        this.tu_switch_last_btn?.off(Node.EventType.TOUCH_END, this.onSwitchLastBtnClick, this);
        this.tu_switch_next_btn?.off(Node.EventType.TOUCH_END, this.onSwitchNextBtnClick, this);
        this.tu_simple_tag?.off(Node.EventType.TOUCH_END, this.onSimpleTagClick, this);
        this.tu_medium_tag?.off(Node.EventType.TOUCH_END, this.onMediumTagClick, this);
        this.tu_hard_tag?.off(Node.EventType.TOUCH_END, this.onHardTagClick, this);
        this.tu_gift?.off(Node.EventType.TOUCH_START, this.onGiftTouchStart, this);
        this.tu_gift?.off(Node.EventType.TOUCH_END, this.onGiftTouchEnd, this);
        this.tu_gift?.off(Node.EventType.TOUCH_CANCEL, this.onGiftTouchEnd, this);
    }

    private onCloseBtnClick(): void {
        this.playClickSound();
        this.closePanel();
    }

    private onSwitchLastBtnClick(): void {
        if (this.currentPage <= 0) {
            return;
        }

        this.playClickSound();
        this.currentPage--;
        this.refreshBookItems();
    }

    private onSwitchNextBtnClick(): void {
        const maxPage = this.getMaxPage();
        if (this.currentPage >= maxPage - 1) {
            return;
        }

        this.playClickSound();
        this.currentPage++;
        this.refreshBookItems();
    }

    private onSimpleTagClick(): void {
        this.playClickSound();
        this.selectDifficulty('simple');
    }

    private onMediumTagClick(): void {
        this.playClickSound();
        this.selectDifficulty('medium');
    }

    private onHardTagClick(): void {
        this.playClickSound();
        this.selectDifficulty('hard');
    }

    private onGiftTouchStart(): void {
        this.playClickSound();
        if (this.tu_gift_view) {
            this.tu_gift_view.active = true;
        }
    }

    private onGiftTouchEnd(): void {
        if (this.tu_gift_view) {
            this.tu_gift_view.active = false;
        }
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

    public closePanel(): void {
        this.node.active = false;
    }

    private async loadBookConfig(): Promise<void> {
        const config = await new Promise<BookConfigFile | null>((resolve) => {
            resources.load(BOOK_CONFIG_PATH, JsonAsset, (err, jsonAsset) => {
                if (err || !jsonAsset) {
                    console.warn(`BookController: failed to load ${BOOK_CONFIG_PATH}`, err);
                    resolve(null);
                    return;
                }

                resolve((jsonAsset.json || {}) as BookConfigFile);
            });
        });

        if (!config) {
            this.refreshBookItems();
            this.refreshGiftRewards();
            return;
        }

        this.bookConfig = {
            simple: Array.isArray(config.simple) ? config.simple : [],
            medium: Array.isArray(config.medium) ? config.medium : [],
            hard: Array.isArray(config.hard) ? config.hard : []
        };
        void this.renderTypeTags();
        void this.refreshFromStorage();
    }

    private async loadBookProgressRewardConfig(): Promise<void> {
        const config = await new Promise<BookProgressRewardConfigFile | null>((resolve) => {
            resources.load(BOOK_PROGRESS_REWARD_CONFIG_PATH, JsonAsset, (err, jsonAsset) => {
                if (err || !jsonAsset) {
                    console.warn(`BookController: failed to load ${BOOK_PROGRESS_REWARD_CONFIG_PATH}`, err);
                    resolve(null);
                    return;
                }

                resolve((jsonAsset.json || {}) as BookProgressRewardConfigFile);
            });
        });

        if (!config) {
            this.refreshGiftRewards();
            return;
        }

        this.bookProgressRewardConfig = {
            simple: this.normalizeProgressRewards(config.simple),
            medium: this.normalizeProgressRewards(config.medium),
            hard: this.normalizeProgressRewards(config.hard)
        };
        this.refreshGiftRewards();
    }

    public async refreshFromStorage(): Promise<void> {
        await this.refreshAllUnlockedBookIds();
        this.refreshBookItems();
        this.refreshProgress();
    }

    private selectDifficulty(difficulty: BookDifficulty): void {
        this.currentDifficulty = difficulty;
        this.currentType = 'all';
        this.currentPage = 0;
        this.refreshDifficultyTags();
        this.refreshDifficultyTitle();
        void this.renderTypeTags();
        void this.refreshFromStorage();
    }

    private selectType(type: BookTypeFilter): void {
        if (this.currentType === type) {
            return;
        }

        this.playClickSound();
        this.currentType = type;
        this.currentPage = 0;
        this.refreshTypeTagColors();
        this.refreshBookItems();
    }

    private refreshDifficultyTags(): void {
        this.setTagSprite(this.tu_simple_tag, this.currentDifficulty === 'simple' ? this.tu_simple_tag_selected : this.tu_simple_tag_normal);
        this.setTagSprite(this.tu_medium_tag, this.currentDifficulty === 'medium' ? this.tu_medium_tag_selected : this.tu_medium_tag_normal);
        this.setTagSprite(this.tu_hard_tag, this.currentDifficulty === 'hard' ? this.tu_hard_tag_selected : this.tu_hard_tag_normal);
    }

    private refreshDifficultyTitle(): void {
        const difficultyText = DIFFICULTY_TITLE_TEXT[this.currentDifficulty];
        if (this.tu_shaixuan_title) {
            this.tu_shaixuan_title.string = difficultyText;
            this.tu_shaixuan_title.color = DIFFICULTY_TITLE_COLOR[this.currentDifficulty];
        }

        if (this.tu_jindu_title) {
            this.tu_jindu_title.string = `${difficultyText}收集进度:`;
        }
    }

    private setTagSprite(tagNode: Node | null, spriteFrame: SpriteFrame | null): void {
        const sprite = tagNode?.getComponent(Sprite);
        if (sprite && spriteFrame) {
            sprite.spriteFrame = spriteFrame;
        }
    }

    private refreshBookItems(): void {
        const items = this.getFilteredBookItems();
        const maxPage = this.getMaxPage();
        this.currentPage = Math.min(Math.max(this.currentPage, 0), maxPage - 1);

        const startIndex = this.currentPage * BOOK_PAGE_SIZE;
        for (let i = 0; i < this.book_items.length; i++) {
            const bookItem = this.book_items[i];
            const data = i < BOOK_PAGE_SIZE ? items[startIndex + i] : null;
            const difficulty = this.currentDifficulty;
            const unlocked = !!data && this.isBookItemUnlocked(data);
            bookItem.setImage(
                data?.imagePath ?? '',
                unlocked,
                this.tu_item_bg_unlocked,
                this.tu_item_bg_locked,
                data && !unlocked ? () => this.onBookItemVideoUnlock(difficulty, data.levelId) : null
            );
        }

        this.refreshPageDisplay(maxPage);
        this.refreshSwitchButtons(maxPage);
        this.refreshProgress();
    }

    private refreshPageDisplay(maxPage: number): void {
        if (this.tu_pages_label) {
            this.tu_pages_label.string = `${this.currentPage + 1}/${maxPage}`;
        }
    }

    private refreshSwitchButtons(maxPage: number): void {
        if (this.tu_switch_last_btn) {
            this.tu_switch_last_btn.active = this.currentPage > 0;
        }
        if (this.tu_switch_next_btn) {
            this.tu_switch_next_btn.active = this.currentPage < maxPage - 1;
        }
    }

    private getCurrentDifficultyItems(): BookConfigItem[] {
        return this.bookConfig[this.currentDifficulty] || [];
    }

    private getFilteredBookItems(): BookConfigItem[] {
        const items = this.getCurrentDifficultyItems();
        if (this.currentType === 'all') {
            return items;
        }

        return items.filter((item) => item.type === this.currentType);
    }

    private getMaxPage(): number {
        return Math.max(1, Math.ceil(this.getFilteredBookItems().length / BOOK_PAGE_SIZE));
    }

    private async refreshUnlockedBookIds(difficulty: BookDifficulty): Promise<void> {
        const difficultyMode = this.toDifficultyMode(difficulty);
        let ids = await WXManager.instance?.getBookUnlockedIdsByDifficulty(difficultyMode) ?? null;
        if (!ids) {
            ids = this.getPreviewUnlockedIds(difficultyMode);
        }
        this.unlockedBookIds[difficulty] = new Set(ids);
    }

    private async refreshAllUnlockedBookIds(): Promise<void> {
        await Promise.all(BOOK_DIFFICULTIES.map((difficulty) => this.refreshUnlockedBookIds(difficulty)));
    }

    private refreshProgress(): void {
        this.refreshTotalProgress();
        this.refreshCurrentDifficultyProgress();
        this.refreshGiftRewards();
    }

    private refreshTotalProgress(): void {
        const totalCount = this.getTotalBookCount();
        const collectedCount = this.getTotalUnlockedBookCount();
        const percent = this.getProgressPercent(collectedCount, totalCount);

        if (this.progress_label) {
            this.progress_label.string = `${collectedCount}/${totalCount}`;
        }
        this.refreshProgressIcons(this.progress_icons, percent, this.tu_progress_sp_green);
    }

    private refreshCurrentDifficultyProgress(): void {
        const totalCount = this.getDifficultyBookCount(this.currentDifficulty);
        const collectedCount = this.getUnlockedBookCount(this.currentDifficulty);
        const percent = this.getProgressPercent(collectedCount, totalCount);

        if (this.tu_jindu_label) {
            this.tu_jindu_label.string = ` ${collectedCount}/${totalCount}`;
        }
        this.refreshProgressIcons(this.tu_jindu_icons, percent, this.getCurrentDifficultyProgressSprite());
    }

    private refreshProgressIcons(iconRoot: Node | null, percent: number, activeSpriteFrame: SpriteFrame | null): void {
        if (!iconRoot || !this.tu_progress_sp_normal) {
            return;
        }

        const activeCount = Math.floor(percent / 5);
        for (let i = 0; i < iconRoot.children.length; i++) {
            const sprite = iconRoot.children[i].getComponent(Sprite);
            if (!sprite) {
                continue;
            }

            const shouldActive = i < activeCount;
            const spriteFrame = shouldActive ? activeSpriteFrame : this.tu_progress_sp_normal;
            if (spriteFrame) {
                sprite.spriteFrame = spriteFrame;
            }
        }
    }

    private getCurrentDifficultyProgressSprite(): SpriteFrame | null {
        switch (this.currentDifficulty) {
            case 'simple':
                return this.tu_progress_sp_green;
            case 'medium':
                return this.tu_progress_sp_blue;
            case 'hard':
                return this.tu_progress_sp_orange;
        }
    }

    private getTotalBookCount(): number {
        return BOOK_DIFFICULTIES.reduce((sum, difficulty) => sum + this.getDifficultyBookCount(difficulty), 0);
    }

    private getDifficultyBookCount(difficulty: BookDifficulty): number {
        return this.bookConfig[difficulty]?.length ?? 0;
    }

    private getTotalUnlockedBookCount(): number {
        return BOOK_DIFFICULTIES.reduce((sum, difficulty) => sum + this.getUnlockedBookCount(difficulty), 0);
    }

    private getUnlockedBookCount(difficulty: BookDifficulty): number {
        const difficultyItems = this.bookConfig[difficulty] || [];
        const unlockedIds = this.unlockedBookIds[difficulty];
        let count = 0;
        for (const item of difficultyItems) {
            if (unlockedIds.has(item.levelId)) {
                count++;
            }
        }
        return count;
    }

    private getProgressPercent(collectedCount: number, totalCount: number): number {
        if (totalCount <= 0) {
            return 0;
        }
        return Math.min(100, Math.max(0, Math.floor(collectedCount / totalCount * 100)));
    }

    private refreshGiftRewards(): void {
        const totalCount = this.getDifficultyBookCount(this.currentDifficulty);
        const collectedCount = this.getUnlockedBookCount(this.currentDifficulty);
        const nextReward = this.getNextProgressReward(this.currentDifficulty, collectedCount, totalCount);
        const targetCount = nextReward ? this.getRewardTargetCount(nextReward.progress, totalCount) : totalCount;

        if (this.tu_gift_label) {
            this.tu_gift_label.string = `[${collectedCount}/${targetCount}]`;
        }

        this.refreshGiftItems(nextReward?.rewards ?? []);
    }

    private getNextProgressReward(
        difficulty: BookDifficulty,
        collectedCount: number,
        totalCount: number
    ): BookProgressRewardItem | null {
        const rewards = this.bookProgressRewardConfig[difficulty] || [];
        if (rewards.length <= 0 || totalCount <= 0) {
            return null;
        }

        const currentPercent = collectedCount / totalCount * 100;
        return rewards.find((reward) => currentPercent < reward.progress) ?? rewards[rewards.length - 1] ?? null;
    }

    private getRewardTargetCount(progress: number, totalCount: number): number {
        if (totalCount <= 0) {
            return 0;
        }
        return Math.min(totalCount, Math.max(1, Math.ceil(totalCount * progress / 100)));
    }

    private refreshGiftItems(rewards: BookRewardItem[]): void {
        const renderVersion = ++this.giftRenderVersion;
        for (let i = 0; i < this.gift_items.length; i++) {
            const giftItem = this.gift_items[i];
            const reward = rewards[i] ?? null;
            giftItem.gift_sp.node.active = !!reward;
            giftItem.gift_label.node.active = !!reward;

            if (!reward) {
                giftItem.gift_sp.spriteFrame = null;
                giftItem.gift_label.string = '';
                this.resetGiftSpriteSize(giftItem);
                continue;
            }

            giftItem.gift_label.string = `x${Math.max(0, Math.floor(Number(reward.count) || 0))}`;
            this.resetGiftSpriteSize(giftItem);
            this.loadGiftSprite(giftItem, reward.imagePath, renderVersion);
        }
    }

    private loadGiftSprite(giftItem: GiftItem, imagePath: string, renderVersion: number): void {
        const safeImagePath = (imagePath || '').trim();
        const sprite = giftItem.gift_sp;
        sprite.spriteFrame = null;
        if (!safeImagePath) {
            return;
        }

        resources.load(`${safeImagePath}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
            if (renderVersion !== this.giftRenderVersion) {
                return;
            }

            if (err || !spriteFrame) {
                console.warn(`BookController: failed to load gift spriteFrame ${safeImagePath}`, err);
                sprite.spriteFrame = null;
                return;
            }

            sprite.spriteFrame = spriteFrame;
            this.applyGiftSpriteAspectRatio(giftItem, spriteFrame);
        });
    }

    private applyGiftSpriteAspectRatio(giftItem: GiftItem, spriteFrame: SpriteFrame): void {
        const transform = giftItem.gift_sp.node.getComponent(UITransform);
        if (!transform) {
            return;
        }

        const sourceWidth = spriteFrame.originalSize.width;
        const sourceHeight = spriteFrame.originalSize.height;
        if (sourceWidth <= 0 || sourceHeight <= 0) {
            return;
        }

        const baseWidth = giftItem.baseWidth > 0 ? giftItem.baseWidth : transform.width;
        const baseHeight = giftItem.baseHeight > 0 ? giftItem.baseHeight : transform.height;
        const sourceRatio = sourceWidth / sourceHeight;
        const baseRatio = baseWidth / baseHeight;
        let targetWidth = baseWidth;
        let targetHeight = baseHeight;

        giftItem.gift_sp.sizeMode = Sprite.SizeMode.CUSTOM;
        if (baseWidth > 0 && baseHeight > 0) {
            if (baseRatio > sourceRatio) {
                targetWidth = baseHeight * sourceRatio;
            } else {
                targetHeight = baseWidth / sourceRatio;
            }
        } else if (baseHeight > 0) {
            targetWidth = baseHeight * sourceRatio;
        } else if (baseWidth > 0) {
            targetHeight = baseWidth / sourceRatio;
        } else {
            targetWidth = sourceWidth;
            targetHeight = sourceHeight;
        }

        transform.setContentSize(targetWidth, targetHeight);
    }

    private resetGiftSpriteSize(giftItem: GiftItem): void {
        const transform = giftItem.gift_sp.node.getComponent(UITransform);
        if (!transform || giftItem.baseWidth <= 0 || giftItem.baseHeight <= 0) {
            return;
        }

        transform.setContentSize(giftItem.baseWidth, giftItem.baseHeight);
    }

    private normalizeProgressRewards(rewards: BookProgressRewardItem[] | undefined): BookProgressRewardItem[] {
        if (!Array.isArray(rewards)) {
            return [];
        }

        return rewards
            .filter((reward) => Number.isFinite(Number(reward.progress)) && Array.isArray(reward.rewards))
            .map((reward) => ({
                progress: Math.min(100, Math.max(0, Math.floor(Number(reward.progress) || 0))),
                rewards: reward.rewards
                    .filter((item) => !!item && typeof item.imagePath === 'string')
                    .map((item) => ({
                        imagePath: item.imagePath,
                        count: Math.max(0, Math.floor(Number(item.count) || 0)),
                        type: String(item.type || '')
                    }))
            }))
            .sort((a, b) => a.progress - b.progress);
    }

    private isBookItemUnlocked(data: BookConfigItem): boolean {
        return this.unlockedBookIds[this.currentDifficulty].has(data.levelId);
    }

    private onBookItemVideoUnlock(difficulty: BookDifficulty, levelId: number): void {
        if (this.unlockedBookIds[difficulty].has(levelId) || this.isShowingBookVideoAd) {
            return;
        }

        this.playClickSound();
        const wxManager = WXManager.instance;
        if (!wxManager) {
            this.unlockBookItemByVideo(difficulty, levelId);
            return;
        }

        this.isShowingBookVideoAd = true;
        wxManager.showRewardedVideoAd((success) => {
            this.isShowingBookVideoAd = false;
            if (!success) {
                return;
            }

            this.unlockBookItemByVideo(difficulty, levelId);
        });
    }

    private unlockBookItemByVideo(difficulty: BookDifficulty, levelId: number): void {
        const safeLevelId = Math.floor(Number(levelId) || 0);
        if (safeLevelId <= 0) {
            return;
        }

        this.unlockedBookIds[difficulty].add(safeLevelId);
        WXManager.instance?.addBookUnlockedIdsByDifficulty(this.toDifficultyMode(difficulty), [safeLevelId]);
        this.refreshBookItems();
        this.refreshProgress();
    }

    private toDifficultyMode(difficulty: BookDifficulty): DifficultyMode {
        switch (difficulty) {
            case 'simple':
                return DifficultyMode.SIMPLE;
            case 'medium':
                return DifficultyMode.MEDIUM;
            case 'hard':
                return DifficultyMode.HARD;
        }
    }

    private getPreviewUnlockedIds(difficulty: DifficultyMode): number[] {
        const gameManager = GameManager.getInstance();
        const currentLevel = this.getGameManagerLevelByDifficulty(gameManager, difficulty);
        const maxUnlockedLevel = Math.max(0, currentLevel - 1);
        const ids: number[] = [];
        for (let id = 1; id <= maxUnlockedLevel; id++) {
            ids.push(id);
        }
        return ids;
    }

    private getGameManagerLevelByDifficulty(gameManager: GameManager | null, difficulty: DifficultyMode): number {
        if (!gameManager) {
            return 1;
        }

        const previousDifficulty = gameManager.currentDifficulty;
        gameManager.currentDifficulty = difficulty;
        const level = gameManager.currentLevel;
        gameManager.currentDifficulty = previousDifficulty;
        return Math.max(1, Math.floor(Number(level) || 1));
    }

    private async renderTypeTags(): Promise<void> {
        if (!this.type_tag_content) {
            return;
        }

        const renderVersion = ++this.typeTagRenderVersion;
        const prefab = await this.loadTypeTagPrefab();
        if (!prefab || renderVersion !== this.typeTagRenderVersion || !this.node.activeInHierarchy) {
            return;
        }

        this.clearTypeTags();
        const types = this.getCurrentTypeTags();
        for (const type of types) {
            const tagNode = instantiate(prefab);
            tagNode.parent = this.type_tag_content;
            tagNode.name = `tu_type_tag_${type}`;
            this.setTypeTagLabel(tagNode, this.getTypeTagText(type));
            tagNode.on(Node.EventType.TOUCH_END, () => this.selectType(type), this);
            this.typeTagNodes.push(tagNode);
        }

        if (types.indexOf(this.currentType) < 0) {
            this.currentType = 'all';
            this.currentPage = 0;
            this.refreshBookItems();
        }
        this.resizeTypeTagContent();
        this.refreshTypeTagColors();
    }

    private clearTypeTags(): void {
        this.typeTagNodes.length = 0;

        if (!this.type_tag_content) {
            return;
        }

        for (let i = this.type_tag_content.children.length - 1; i >= 0; i--) {
            this.type_tag_content.children[i].destroy();
        }
    }

    private getCurrentTypeTags(): BookTypeFilter[] {
        const typeSet = new Set<string>();
        for (const item of this.getCurrentDifficultyItems()) {
            if (item.type) {
                typeSet.add(item.type);
            }
        }

        const sortedTypes = TYPE_TAG_ORDER.filter((type) => typeSet.has(type));
        const extraTypes = Array.from(typeSet)
            .filter((type) => TYPE_TAG_ORDER.indexOf(type) < 0)
            .sort();
        return ['all', ...sortedTypes, ...extraTypes];
    }

    private refreshTypeTagColors(): void {
        for (const tagNode of this.typeTagNodes) {
            const type = this.getTypeFromTagNode(tagNode);
            const sprite = tagNode.getComponent(Sprite);
            if (sprite) {
                sprite.color = type === this.currentType ? SELECTED_TYPE_TAG_COLOR : NORMAL_TYPE_TAG_COLOR;
            }
        }
    }

    private resizeTypeTagContent(): void {
        const contentTransform = this.type_tag_content?.getComponent(UITransform);
        if (!contentTransform) {
            return;
        }

        const layout = this.type_tag_content.getComponent(Layout);
        let totalWidth = (layout?.paddingLeft ?? 0) + (layout?.paddingRight ?? 0);
        for (let i = 0; i < this.typeTagNodes.length; i++) {
            const tagTransform = this.typeTagNodes[i].getComponent(UITransform);
            totalWidth += tagTransform?.width ?? 0;
            if (i < this.typeTagNodes.length - 1) {
                totalWidth += layout?.spacingX ?? 0;
            }
        }

        contentTransform.setContentSize(Math.max(0, totalWidth), contentTransform.height);
    }

    private getTypeFromTagNode(tagNode: Node): BookTypeFilter {
        return tagNode.name.replace(/^tu_type_tag_/, '') || 'all';
    }

    private setTypeTagLabel(tagNode: Node, text: string): void {
        const label = tagNode.getChildByName('tu_type_tag_label')?.getComponent(Label);
        if (label) {
            label.string = text;
        }
    }

    private getTypeTagText(type: BookTypeFilter): string {
        return TYPE_TAG_TEXT[type] || type;
    }

    private playClickSound(): void {
        AudioManager.instance?.playEffect('click_btn');
    }

    private async loadTypeTagPrefab(): Promise<Prefab | null> {
        if (this.typeTagPrefab) {
            return this.typeTagPrefab;
        }
        if (this.typeTagPrefabTask) {
            return await this.typeTagPrefabTask;
        }

        this.typeTagPrefabTask = new Promise<Prefab | null>((resolve) => {
            resources.load(TYPE_TAG_PREFAB_PATH, Prefab, (err, prefab) => {
                this.typeTagPrefabTask = null;
                if (err || !prefab) {
                    console.warn(`BookController: failed to load ${TYPE_TAG_PREFAB_PATH}`, err);
                    resolve(null);
                    return;
                }

                this.typeTagPrefab = prefab;
                resolve(prefab);
            });
        });

        return await this.typeTagPrefabTask;
    }

    private isTouchInContentPanel(touchPos: Vec2): boolean {
        const contentNode = this.border_bg ?? this.node.getChildByName('tu_bg');
        if (!contentNode) {
            return false;
        }

        const contentTransform = contentNode.getComponent(UITransform);
        if (!contentTransform) {
            return false;
        }

        return contentTransform.getBoundingBoxToWorld().contains(touchPos);
    }
}

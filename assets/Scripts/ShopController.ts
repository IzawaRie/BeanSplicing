import { _decorator, Color, Component, Label, Node, Sprite } from 'cc';
import { ShopCategoryId, ShopConfig, ShopDisplayItem, ShopRuntimeData } from './ShopConfig';
import { ShopItem } from './ShopItem';
import { GameManager } from './GameManager';
import { WXManager } from './WXManager';
import { AudioManager } from './AudioManager';
const { ccclass, property } = _decorator;

enum ShopCategoryTab {
    SUPPLY = 0,
    DECORATION = 1,
    PROP = 2,
}

@ccclass('ShopController')
export class ShopController extends Component {
    @property({ type: Node })
    shop_tag1: Node = null;

    @property({ type: Node })
    shop_tag2: Node = null;

    @property({ type: Node })
    shop_tag3: Node = null;

    @property({ type: Node })
    close_btn: Node = null;

    @property({ type: ShopItem })
    shop_items: ShopItem[] = [];

    @property({ type: Label })
    coin_label: Label = null;

    private readonly _activeTagColor: Color = new Color(238, 221, 195, 255);
    private readonly _inactiveTagColor: Color = new Color(214, 203, 186, 255);
    private _currentTab: ShopCategoryTab = ShopCategoryTab.SUPPLY;
    private _shopData: ShopRuntimeData | null = null;

    onEnable() {
        this.selectTab(ShopCategoryTab.SUPPLY);
    }

    start() {
        this.bindButtonEvents();
    }

    update(_deltaTime: number) {
    }

    onDestroy() {
        this.unbindButtonEvents();
    }

    private bindButtonEvents(): void {
        this.close_btn?.on(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
        this.shop_tag1?.on(Node.EventType.TOUCH_END, this.onSupplyTagClick, this);
        this.shop_tag2?.on(Node.EventType.TOUCH_END, this.onPropTagClick, this);
        this.shop_tag3?.on(Node.EventType.TOUCH_END, this.onDecorationTagClick, this);
    }

    private unbindButtonEvents(): void {
        this.close_btn?.off(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
        this.shop_tag1?.off(Node.EventType.TOUCH_END, this.onSupplyTagClick, this);
        this.shop_tag2?.off(Node.EventType.TOUCH_END, this.onPropTagClick, this);
        this.shop_tag3?.off(Node.EventType.TOUCH_END, this.onDecorationTagClick, this);
    }

    private onCloseBtnClick(): void {
        AudioManager.instance.playEffect('click_btn');
        this.node.active = false;
    }

    private onSupplyTagClick(): void {
        AudioManager.instance.playEffect('click_btn');
        this.selectTab(ShopCategoryTab.SUPPLY);
    }

    private onPropTagClick(): void {
        AudioManager.instance.playEffect('click_btn');
        this.selectTab(ShopCategoryTab.DECORATION);
    }

    private onDecorationTagClick(): void {
        AudioManager.instance.playEffect('click_btn');
        this.selectTab(ShopCategoryTab.PROP);
    }

    private selectTab(tab: ShopCategoryTab): void {
        this._currentTab = tab;
        this.refreshTagStates();
        this.refreshShopItems();
    }

    private refreshTagStates(): void {
        this.setTagColor(this.shop_tag1, this._currentTab === ShopCategoryTab.SUPPLY ? this._activeTagColor : this._inactiveTagColor);
        this.setTagColor(this.shop_tag2, this._currentTab === ShopCategoryTab.DECORATION ? this._activeTagColor : this._inactiveTagColor);
        this.setTagColor(this.shop_tag3, this._currentTab === ShopCategoryTab.PROP ? this._activeTagColor : this._inactiveTagColor);
    }

    private setTagColor(tagNode: Node | null, color: Color): void {
        const tagBgNode = tagNode?.getChildByName('shop_tag_bg');
        const sprite = tagBgNode?.getComponent(Sprite);
        if (sprite) {
            sprite.color = color;
        }
    }

    public setShopData(shopData: ShopRuntimeData | null): void {
        const normalizedShopData = this.normalizeShopData(shopData);
        if (!normalizedShopData) {
            this._shopData = null;
            this.refreshShopItems();
            return;
        }

        this._shopData = {
            supply: [...normalizedShopData.supply],
            prop: [...normalizedShopData.prop],
            decoration: [...normalizedShopData.decoration],
        };
        this.refreshShopItems();
    }

    public hasShopData(): boolean {
        return this.isShopDataValid(this._shopData);
    }

    public isShopDataValid(shopData: ShopRuntimeData | null | undefined): shopData is ShopRuntimeData {
        return this.normalizeShopData(shopData) !== null;
    }

    public normalizeShopData(shopData: ShopRuntimeData | null | undefined): ShopRuntimeData | null {
        if (!shopData) {
            return null;
        }

        const supply = this.normalizeShopItemArray(shopData.supply, 'supply');
        const prop = this.normalizeShopItemArray(shopData.prop, 'prop');
        const decoration = this.normalizeShopItemArray(shopData.decoration, 'decoration');
        if (!supply || !prop || !decoration) {
            return null;
        }

        return { supply, prop, decoration };
    }

    public async generateRandomShopData(): Promise<ShopRuntimeData | null> {
        const slotCount = this.shop_items.length;
        const [supply, prop, decoration] = await Promise.all([
            this.buildCategoryShopItems('supply', slotCount),
            this.buildCategoryShopItems('prop', slotCount),
            this.buildCategoryShopItems('decoration', slotCount),
        ]);
        const shopData: ShopRuntimeData = { supply, prop, decoration };
        return this.isShopDataValid(shopData) ? shopData : null;
    }

    private refreshShopItems(): void {
        const currentItems = this.getCurrentTabItems();
        for (let i = 0; i < this.shop_items.length; i++) {
            this.shop_items[i]?.setData(currentItems[i] ?? null);
        }
    }

    private getCurrentTabItems(): ShopDisplayItem[] {
        if (!this._shopData) {
            return [];
        }

        switch (this._currentTab) {
            case ShopCategoryTab.SUPPLY:
                return this._shopData.supply;
            case ShopCategoryTab.DECORATION:
                return this._shopData.decoration;
            case ShopCategoryTab.PROP:
                return this._shopData.prop;
            default:
                return [];
        }
    }

    private async buildCategoryShopItems(categoryId: ShopCategoryId, slotCount: number): Promise<ShopDisplayItem[]> {
        const sourceItems = await ShopConfig.getInstance().getCategoryItems(categoryId);
        const availableItems = sourceItems.filter((item) => !this.shouldHideShopConfigItem(categoryId, item.effectType, item.effectValue));
        if (slotCount <= 0 || availableItems.length <= 0) {
            return [];
        }

        const shuffledItems = [...availableItems];
        for (let i = shuffledItems.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));
            const currentItem = shuffledItems[i];
            shuffledItems[i] = shuffledItems[randomIndex];
            shuffledItems[randomIndex] = currentItem;
        }

        return shuffledItems.slice(0, slotCount).map((item) => ({
            id: item.id,
            name: item.name,
            price: this.randomInt(item.priceRange.min, item.priceRange.max),
            imagePath: item.imagePath,
            categoryId,
            isPurchased: this.isShopItemAlreadyOwned(categoryId, item.effectType, item.effectValue),
            effectType: item.effectType,
            effectKey: item.effectKey,
            effectValue: item.effectValue,
        }));
    }

    public purchaseShopItem(targetItem: ShopDisplayItem | null | undefined): void {
        if (!targetItem || targetItem.isPurchased) {
            return;
        }

        const gameManager = GameManager.getInstance();
        if (!gameManager) {
            return;
        }

        if (targetItem.effectType === 'skill') {
            const skillValue = Math.max(0, Math.floor(targetItem.effectValue ?? 0));
            if (skillValue <= 0 || !gameManager.userInfo) {
                return;
            }

            switch (targetItem.effectKey) {
                case 'fix_skill':
                    gameManager.userInfo.fixSkillCount += skillValue;
                    break;
                case 'time_skill':
                    gameManager.userInfo.timeSkillCount += skillValue;
                    break;
                case 'palette_skill':
                    gameManager.userInfo.paletteSkillCount += skillValue;
                    break;
                default:
                    return;
            }
        } else if (targetItem.effectType === 'power') {
            const powerValue = Math.max(0, Math.floor(targetItem.effectValue ?? 0));
            if (powerValue <= 0) {
                return;
            }

            gameManager.power += powerValue;
        } else if (targetItem.effectType === 'avatar_frame') {
            const avatarFrameId = Math.max(0, Math.floor(targetItem.effectValue ?? 0));
            if (avatarFrameId <= 0 || !gameManager.userInfo) {
                return;
            }

            if (gameManager.userInfo.hasOwnedAvatarFrameId(avatarFrameId)) {
                targetItem.isPurchased = true;
                this.refreshShopItems();
                gameManager.wxManager?.setShopData(this.getShopDataSnapshot());
                return;
            }

            gameManager.userInfo.addOwnedAvatarFrameId(avatarFrameId);
        } else {
            return;
        }

        gameManager.coinCount -= targetItem.price;
        targetItem.isPurchased = true;
        this.refreshShopItems();
        gameManager.wxManager?.setShopData(this.getShopDataSnapshot());
    }

    private normalizeShopItemArray(items: ShopDisplayItem[] | null | undefined, categoryId: ShopCategoryId): ShopDisplayItem[] | null {
        if (!Array.isArray(items)) {
            return null;
        }

        const normalizedItems: ShopDisplayItem[] = [];
        for (const item of items) {
            if (!item
                || typeof item.id !== 'string'
                || typeof item.name !== 'string'
                || typeof item.price !== 'number'
                || typeof item.imagePath !== 'string'
                || typeof item.categoryId !== 'string') {
                return null;
            }

            const migratedItem = this.migrateLegacyShopItem(item, categoryId);
            normalizedItems.push({
                id: item.id,
                name: item.name,
                price: item.price,
                imagePath: migratedItem.imagePath,
                categoryId: item.categoryId,
                isPurchased: item.isPurchased === true || this.isShopItemAlreadyOwned(categoryId, migratedItem.effectType, migratedItem.effectValue),
                effectType: migratedItem.effectType,
                effectKey: item.effectKey,
                effectValue: migratedItem.effectValue,
            });
        }

        return normalizedItems;
    }

    private isShopItemAlreadyOwned(
        categoryId: ShopCategoryId,
        effectType?: ShopDisplayItem['effectType'],
        effectValue?: number
    ): boolean {
        if (categoryId !== 'decoration' || effectType !== 'avatar_frame') {
            return false;
        }

        const avatarFrameId = Math.max(0, Math.floor(effectValue ?? 0));
        if (avatarFrameId <= 0) {
            return false;
        }

        return GameManager.getInstance()?.userInfo?.hasOwnedAvatarFrameId(avatarFrameId) ?? false;
    }

    private shouldHideShopConfigItem(
        categoryId: ShopCategoryId,
        effectType?: ShopDisplayItem['effectType'],
        effectValue?: number
    ): boolean {
        return this.isShopItemAlreadyOwned(categoryId, effectType, effectValue);
    }

    private migrateLegacyShopItem(
        item: ShopDisplayItem,
        categoryId: ShopCategoryId
    ): Pick<ShopDisplayItem, 'imagePath' | 'effectType' | 'effectValue'> {
        const migratedItem = {
            imagePath: item.imagePath,
            effectType: item.effectType,
            effectValue: typeof item.effectValue === 'number' ? item.effectValue : undefined,
        };

        if (categoryId !== 'decoration') {
            return migratedItem;
        }

        const avatarFrameMatch = /^avatar_border_(\d+)$/.exec(item.id);
        if (!avatarFrameMatch) {
            return migratedItem;
        }

        const avatarFrameId = Math.max(1, Math.floor(Number(avatarFrameMatch[1]) || 0));
        migratedItem.effectType = 'avatar_frame';
        migratedItem.effectValue = avatarFrameId;
        migratedItem.imagePath = `items/avatar_frame/avatar_border_${avatarFrameId}`;
        return migratedItem;
    }

    private getShopDataSnapshot(): ShopRuntimeData {
        return {
            supply: this._shopData?.supply.map((item) => ({ ...item })) ?? [],
            prop: this._shopData?.prop.map((item) => ({ ...item })) ?? [],
            decoration: this._shopData?.decoration.map((item) => ({ ...item })) ?? [],
        };
    }

    private randomInt(min: number, max: number): number {
        const safeMin = Math.floor(Math.min(min, max));
        const safeMax = Math.floor(Math.max(min, max));
        const roundedMin = Math.ceil(safeMin / 10) * 10;
        const roundedMax = Math.floor(safeMax / 10) * 10;

        if (roundedMin > roundedMax) {
            return roundedMin;
        }

        const stepCount = Math.floor((roundedMax - roundedMin) / 10);
        return roundedMin + Math.floor(Math.random() * (stepCount + 1)) * 10;
    }
}

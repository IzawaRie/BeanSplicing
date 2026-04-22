import { _decorator, Color, Component, Label, Node, Sprite } from 'cc';
import { ShopItem } from './ShopItem';
const { ccclass, property } = _decorator;

enum ShopCategoryTab {
    SUPPLY = 0,
    PROP = 1,
    DECORATION = 2,
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

    onEnable() {
        this.selectTab(ShopCategoryTab.SUPPLY);
    }

    start() {
        this.bindButtonEvents();
    }

    update(deltaTime: number) {
        
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
        this.node.active = false;
    }

    private onSupplyTagClick(): void {
        this.selectTab(ShopCategoryTab.SUPPLY);
    }

    private onPropTagClick(): void {
        this.selectTab(ShopCategoryTab.PROP);
    }

    private onDecorationTagClick(): void {
        this.selectTab(ShopCategoryTab.DECORATION);
    }

    private selectTab(tab: ShopCategoryTab): void {
        console.log(`切换到标签: ${ShopCategoryTab[tab]}`);
        this._currentTab = tab;
        this.refreshTagStates();
    }

    private refreshTagStates(): void {
        this.setTagColor(this.shop_tag1, this._currentTab === ShopCategoryTab.SUPPLY ? this._activeTagColor : this._inactiveTagColor);
        this.setTagColor(this.shop_tag2, this._currentTab === ShopCategoryTab.PROP ? this._activeTagColor : this._inactiveTagColor);
        this.setTagColor(this.shop_tag3, this._currentTab === ShopCategoryTab.DECORATION ? this._activeTagColor : this._inactiveTagColor);
    }

    private setTagColor(tagNode: Node, color: Color): void {
        const tagBgNode = tagNode?.getChildByName('shop_tag_bg');
        const sprite = tagBgNode?.getComponent(Sprite);
        if (sprite) {
            sprite.color = color;
        }
    }
}

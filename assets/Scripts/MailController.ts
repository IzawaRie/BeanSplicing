import { _decorator, Component, instantiate, Label, Layout, Node, Prefab, resources, Sprite, SpriteFrame, UITransform } from 'cc';
import { AudioManager } from './AudioManager';
import { GameManager, RewardItemData } from './GameManager';
import { MailItem, MailItemAttachmentViewData, MailItemViewData } from './MailItem';
import MailService, { InboxMeta, MailRecord } from './MailService';

const { ccclass, property } = _decorator;

const MAIL_ITEM_PREFAB_PATH = 'mail_item';
const MAIL_ITEM_SP_PREFAB_PATH = 'mail_item_sp';

enum MailTabType {
    ALL = 'all',
    UNREAD = 'unread'
}

@ccclass('MailController')
export class MailController extends Component {

    @property({ type: Node })
    close_btn: Node = null;

    @property({ type: Node })
    all_tab: Node = null;

    @property({ type: Node })
    no_read_tab: Node = null;

    @property({ type: Node })
    delete_read_mail_btn: Node = null;

    @property({ type: Node })
    get_mail_item_btn: Node = null;

    @property({ type: Node })
    mail_content: Node = null;

    @property({ type: Node })
    no_mail_tip: Node = null;

    @property({ type: Label })
    mail_number: Label = null;

    @property({ type: Label })
    tab_all_number: Label = null;

    @property({ type: Label })
    tab_no_read_number: Label = null;

    @property({ type: SpriteFrame })
    mail_normal_border: SpriteFrame = null;

    @property({ type: SpriteFrame })
    mail_light_border: SpriteFrame = null;

    @property({ type: SpriteFrame })
    mail_tab_light: SpriteFrame = null;

    @property({ type: SpriteFrame })
    mail_tab_normal: SpriteFrame = null;

    private mailItemPrefab: Prefab | null = null;
    private mailItemSpPrefab: Prefab | null = null;
    private spriteFrameCache = new Map<string, SpriteFrame | null>();
    private openid = '';
    private inboxMeta: InboxMeta = { playerOpenId: '', unclaimedCount: 0 };
    private mails: MailRecord[] = [];
    private currentTab: MailTabType = MailTabType.ALL;
    private isReady = false;
    private isRefreshing = false;
    private isHandlingBatchAction = false;

    public getUnclaimedCount(): number {
        return Math.max(0, Math.floor(Number(this.inboxMeta?.unclaimedCount) || 0));
    }

    public openPanel(): void {
        if (!this.node.active) {
            this.node.active = true;
            return;
        }

        if (this.isReady) {
            void this.refresh();
        }
    }

    public async initialize(openid: string): Promise<void> {
        const safeOpenId = String(openid || '').trim();
        if (!safeOpenId || this.isReady) {
            return;
        }

        this.openid = safeOpenId;
        this.resolveTabCountBindings();
        this.bindButtonEvents();
        await this.loadPrefabs();
        this.isReady = true;
        await this.refresh();
        MailService.watchInboxMeta(this.openid, {
            onMetaChanged: (meta) => {
                this.inboxMeta = meta;
                this.syncMenuUnreadCount();
                if (this.node.active) {
                    void this.refresh();
                } else {
                    this.refreshTabNumbers();
                    this.refreshMailNumber();
                }
            },
            onError: (error) => {
                console.warn('MailController: watch inbox meta failed', error);
            }
        });
        this.refreshTabStates();
        this.refreshTabNumbers();
        this.syncMenuUnreadCount();
    }

    protected onEnable(): void {
        const gameManager = GameManager.getInstance();
        if (gameManager) {
            gameManager.isWindowOpen = true;
        }

        if (this.isReady) {
            void this.refresh();
        } else {
            this.refreshTabStates();
            this.refreshTabNumbers();
            this.refreshMailNumber();
            this.refreshActionButtons();
        }
    }

    protected onDisable(): void {
        const gameManager = GameManager.getInstance();
        if (gameManager?.mail === this) {
            gameManager.isWindowOpen = false;
        }
    }

    protected onDestroy(): void {
        MailService.stopInboxWatch();
        this.unbindButtonEvents();
    }

    private bindButtonEvents(): void {
        this.close_btn?.on(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
        this.all_tab?.on(Node.EventType.TOUCH_END, this.onAllTabClick, this);
        this.no_read_tab?.on(Node.EventType.TOUCH_END, this.onUnreadTabClick, this);
        this.delete_read_mail_btn?.on(Node.EventType.TOUCH_END, this.onDeleteReadMailClick, this);
        this.get_mail_item_btn?.on(Node.EventType.TOUCH_END, this.onClaimAllMailClick, this);
    }

    private unbindButtonEvents(): void {
        this.close_btn?.off(Node.EventType.TOUCH_END, this.onCloseBtnClick, this);
        this.all_tab?.off(Node.EventType.TOUCH_END, this.onAllTabClick, this);
        this.no_read_tab?.off(Node.EventType.TOUCH_END, this.onUnreadTabClick, this);
        this.delete_read_mail_btn?.off(Node.EventType.TOUCH_END, this.onDeleteReadMailClick, this);
        this.get_mail_item_btn?.off(Node.EventType.TOUCH_END, this.onClaimAllMailClick, this);
    }

    private async loadPrefabs(): Promise<void> {
        const [mailItemPrefab, mailItemSpPrefab] = await Promise.all([
            this.loadPrefab(MAIL_ITEM_PREFAB_PATH),
            this.loadPrefab(MAIL_ITEM_SP_PREFAB_PATH)
        ]);
        this.mailItemPrefab = mailItemPrefab;
        this.mailItemSpPrefab = mailItemSpPrefab;
    }

    private loadPrefab(path: string): Promise<Prefab | null> {
        return new Promise((resolve) => {
            resources.load(path, Prefab, (err, prefab) => {
                if (err || !prefab) {
                    console.warn(`MailController: failed to load prefab ${path}`, err);
                    resolve(null);
                    return;
                }

                resolve(prefab);
            });
        });
    }

    private async refresh(): Promise<void> {
        if (!this.openid || this.isRefreshing) {
            return;
        }

        this.isRefreshing = true;
        try {
            const [meta, mails] = await Promise.all([
                MailService.getInboxMeta(this.openid),
                MailService.listMails(this.openid)
            ]);
            this.inboxMeta = meta;
            this.mails = mails;
            this.syncMenuUnreadCount();
            this.refreshTabNumbers();
            this.refreshMailNumber();
            this.refreshTabStates();
            this.refreshActionButtons();
            await this.renderCurrentTabMails();
        } finally {
            this.isRefreshing = false;
        }
    }

    private async renderCurrentTabMails(): Promise<void> {
        if (!this.mail_content) {
            return;
        }

        for (const child of [...this.mail_content.children]) {
            child.destroy();
        }

        const visibleMails = this.getVisibleMails();
        for (const mail of visibleMails) {
            const itemNode = await this.createMailItemNode(mail);
            if (itemNode) {
                this.mail_content.addChild(itemNode);
            }
        }

        this.mail_content.getComponent(Layout)?.updateLayout(true);
        this.refreshMailContentHeight();
        this.refreshNoMailTip();
        this.refreshMailNumber();
    }

    private getVisibleMails(): MailRecord[] {
        const sourceMails = this.mails.filter((mail) => mail.status === 'unclaimed' || mail.status === 'claimed');
        if (this.currentTab === MailTabType.UNREAD) {
            return sourceMails.filter((mail) => mail.status === 'unclaimed');
        }
        return sourceMails;
    }

    private async createMailItemNode(mail: MailRecord): Promise<Node | null> {
        if (!this.mailItemPrefab) {
            return null;
        }

        const node = instantiate(this.mailItemPrefab);
        const mailItem = node.getComponent(MailItem);
        const isUnread = mail.status === 'unclaimed';
        const itemData: MailItemViewData = {
            title: mail.title || '礼包到账',
            description: mail.content || '',
            statusText: isUnread ? '未领取' : '已领取',
            timeText: this.formatMailTime(mail.updatedAt),
            isUnread
        };

        const attachmentItems = await this.buildAttachmentViewData(mail);
        const borderSpriteFrame = isUnread ? this.mail_light_border : this.mail_normal_border;
        mailItem?.setData(itemData, borderSpriteFrame);
        mailItem?.setAttachments(attachmentItems, this.mailItemSpPrefab);

        node.off(Node.EventType.TOUCH_END);
        node.on(Node.EventType.TOUCH_END, () => {
            if (mail.status !== 'unclaimed') {
                return;
            }
            void this.claimSingleMail(mail);
        }, this);
        return node;
    }

    private async buildAttachmentViewData(mail: MailRecord): Promise<MailItemAttachmentViewData[]> {
        const attachments = Array.isArray(mail?.attachments) ? mail.attachments : [];
        const viewData: MailItemAttachmentViewData[] = [];
        for (const attachment of attachments) {
            const spriteFrame = await this.loadAttachmentSpriteFrame(this.getAttachmentImagePath(attachment.type));
            viewData.push({
                spriteFrame,
                count: attachment.count
            });
        }
        return viewData;
    }

    private loadAttachmentSpriteFrame(imagePath: string): Promise<SpriteFrame | null> {
        const safePath = String(imagePath || '').trim();
        if (!safePath) {
            return Promise.resolve(null);
        }

        if (this.spriteFrameCache.has(safePath)) {
            return Promise.resolve(this.spriteFrameCache.get(safePath) ?? null);
        }

        return new Promise((resolve) => {
            resources.load(`${safePath}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
                if (err || !spriteFrame) {
                    console.warn(`MailController: failed to load spriteFrame ${safePath}`, err);
                    this.spriteFrameCache.set(safePath, null);
                    resolve(null);
                    return;
                }

                this.spriteFrameCache.set(safePath, spriteFrame);
                resolve(spriteFrame);
            });
        });
    }

    private refreshMailNumber(): void {
        if (!this.mail_number) {
            return;
        }

        const count = this.getVisibleMails().length;
        this.mail_number.string = `邮件数量：${count}`;
    }

    private refreshTabNumbers(): void {
        const allCount = this.mails.filter((mail) => mail.status === 'unclaimed' || mail.status === 'claimed').length;
        const unreadCount = this.mails.filter((mail) => mail.status === 'unclaimed').length;

        if (this.tab_all_number) {
            this.tab_all_number.string = `全部（${allCount}）`;
        }

        if (this.tab_no_read_number) {
            this.tab_no_read_number.string = `未领取（${unreadCount}）`;
        }
    }

    private refreshTabStates(): void {
        this.applyTabState(this.all_tab, this.currentTab === MailTabType.ALL);
        this.applyTabState(this.no_read_tab, this.currentTab === MailTabType.UNREAD);
    }

    private applyTabState(tabNode: Node | null, active: boolean): void {
        const sprite = tabNode?.getComponent(Sprite);
        if (sprite) {
            sprite.spriteFrame = active ? this.mail_tab_light : this.mail_tab_normal;
        }

        const label = tabNode?.getComponentInChildren(Label);
        if (label) {
            label.color = active
                ? label.color.clone().set(90, 60, 20, 255)
                : label.color.clone().set(150, 120, 80, 255);
        }
    }

    private async claimSingleMail(mail: MailRecord): Promise<void> {
        if (!mail || mail.status !== 'unclaimed' || this.isHandlingBatchAction) {
            return;
        }

        const claimedMail = await MailService.claimMail(this.openid, mail.id);
        if (!claimedMail) {
            return;
        }

        AudioManager.instance.playEffect('click_btn');
        this.applyMailRewards(mail);
        this.replaceMailRecord(claimedMail);
        this.rebuildInboxMetaFromMails();
        await this.renderCurrentTabMails();
    }

    private async onClaimAllMailClick(): Promise<void> {
        if (this.isHandlingBatchAction) {
            return;
        }

        const unclaimedMails = this.mails.filter((mail) => mail.status === 'unclaimed');
        if (unclaimedMails.length <= 0) {
            return;
        }

        this.isHandlingBatchAction = true;
        try {
            AudioManager.instance.playEffect('click_btn');
            const claimedMails = await MailService.claimAllMails(this.openid);
            if (claimedMails.length <= 0) {
                return;
            }

            const claimMap = new Map<string, MailRecord>();
            for (const claimedMail of claimedMails) {
                claimMap.set(claimedMail.id, claimedMail);
            }

            for (const mail of unclaimedMails) {
                this.applyMailRewards(mail);
            }

            this.mails = this.mails.map((mail) => claimMap.get(mail.id) ?? mail);
            this.rebuildInboxMetaFromMails();
            await this.renderCurrentTabMails();
        } finally {
            this.isHandlingBatchAction = false;
        }
    }

    private async onDeleteReadMailClick(): Promise<void> {
        if (this.isHandlingBatchAction) {
            return;
        }

        const claimedMails = this.mails.filter((mail) => mail.status === 'claimed');
        if (claimedMails.length <= 0) {
            return;
        }

        this.isHandlingBatchAction = true;
        try {
            AudioManager.instance.playEffect('click_btn');
            const deletedIds = await MailService.deleteClaimedMails(this.openid);
            if (deletedIds.length <= 0) {
                return;
            }

            const deletedSet = new Set(deletedIds);
            this.mails = this.mails.filter((mail) => !deletedSet.has(mail.id));
            this.rebuildInboxMetaFromMails();
            await this.renderCurrentTabMails();
        } finally {
            this.isHandlingBatchAction = false;
        }
    }

    private onAllTabClick(): void {
        if (this.currentTab === MailTabType.ALL) {
            return;
        }

        AudioManager.instance.playEffect('click_btn');
        this.currentTab = MailTabType.ALL;
        this.refreshTabStates();
        this.refreshMailNumber();
        void this.renderCurrentTabMails();
    }

    private onUnreadTabClick(): void {
        if (this.currentTab === MailTabType.UNREAD) {
            return;
        }

        AudioManager.instance.playEffect('click_btn');
        this.currentTab = MailTabType.UNREAD;
        this.refreshTabStates();
        this.refreshMailNumber();
        void this.renderCurrentTabMails();
    }

    private onCloseBtnClick(): void {
        AudioManager.instance.playEffect('click_btn');
        this.node.active = false;
    }

    private applyMailRewards(mail: MailRecord): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager) {
            return;
        }

        for (const attachment of mail.attachments) {
            const reward: RewardItemData = {
                imagePath: this.getAttachmentImagePath(attachment.type),
                count: attachment.count,
                type: attachment.type
            };

            if (attachment.itemId !== undefined) {
                (reward as RewardItemData & { itemId?: number }).itemId = attachment.itemId;
            }

            gameManager.applyRewardItem(reward);
        }
    }

    private replaceMailRecord(nextMail: MailRecord): void {
        this.mails = this.mails.map((mail) => mail.id === nextMail.id ? nextMail : mail);
    }

    private rebuildInboxMetaFromMails(): void {
        const sortedMails = [...this.mails].sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || '')));
        const firstMail = sortedMails[0] ?? null;
        this.inboxMeta = {
            _id: this.openid,
            playerOpenId: this.openid,
            unclaimedCount: sortedMails.filter((mail) => mail.status === 'unclaimed').length,
            latestMailAt: firstMail?.createdAt || null,
            lastMailId: firstMail?.id || '',
            updatedAt: new Date().toISOString()
        };
        this.syncMenuUnreadCount();
        this.refreshTabNumbers();
        this.refreshMailNumber();
        this.refreshActionButtons();
        this.refreshNoMailTip();
    }

    private syncMenuUnreadCount(): void {
        GameManager.getInstance()?.menuManager?.setMailUnreadCount(this.getUnclaimedCount());
    }

    private resolveTabCountBindings(): void {
        if (!this.tab_all_number) {
            this.tab_all_number = this.all_tab?.getComponentInChildren(Label) ?? null;
        }

        if (!this.tab_no_read_number) {
            this.tab_no_read_number = this.no_read_tab?.getComponentInChildren(Label) ?? null;
        }
    }

    private refreshActionButtons(): void {
        const hasClaimedMail = this.mails.some((mail) => mail.status === 'claimed');
        const hasUnclaimedMail = this.mails.some((mail) => mail.status === 'unclaimed');

        if (this.delete_read_mail_btn) {
            this.delete_read_mail_btn.active = hasClaimedMail;
        }

        if (this.get_mail_item_btn) {
            this.get_mail_item_btn.active = hasUnclaimedMail;
        }
    }

    private refreshNoMailTip(): void {
        if (!this.no_mail_tip) {
            return;
        }

        this.no_mail_tip.active = this.getVisibleMails().length <= 0;
    }

    private refreshMailContentHeight(): void {
        if (!this.mail_content) {
            return;
        }

        const uiTransform = this.mail_content.getComponent(UITransform);
        if (!uiTransform) {
            return;
        }

        const layout = this.mail_content.getComponent(Layout);
        const visibleChildren = this.mail_content.children.filter((child) => child.active);
        if (visibleChildren.length <= 0) {
            uiTransform.setContentSize(uiTransform.width, 0);
            return;
        }

        let totalHeight = 0;
        for (const child of visibleChildren) {
            const childTransform = child.getComponent(UITransform);
            totalHeight += childTransform?.height ?? 0;
        }

        if (layout) {
            totalHeight += layout.paddingTop + layout.paddingBottom;
            totalHeight += Math.max(0, visibleChildren.length - 1) * layout.spacingY;
        }

        uiTransform.setContentSize(uiTransform.width, Math.max(0, totalHeight));
    }

    private formatMailTime(value: string): string {
        const safeValue = String(value || '').trim();
        if (!safeValue) {
            return '';
        }

        const date = new Date(safeValue);
        if (Number.isNaN(date.getTime())) {
            return safeValue;
        }

        const beijingDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
        const year = beijingDate.getUTCFullYear();
        const month = this.padNumber(beijingDate.getUTCMonth() + 1);
        const day = this.padNumber(beijingDate.getUTCDate());
        const hours = this.padNumber(beijingDate.getUTCHours());
        const minutes = this.padNumber(beijingDate.getUTCMinutes());
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    private padNumber(value: number): string {
        const safeValue = Math.max(0, Math.floor(Number(value) || 0));
        return safeValue < 10 ? `0${safeValue}` : `${safeValue}`;
    }

    private getAttachmentImagePath(type: string): string {
        switch (String(type || '')) {
            case 'coin':
                return 'items/coin';
            case 'power':
                return 'items/shop/power';
            case 'fix_skill':
                return 'items/shop/skill_fix';
            case 'time_skill':
                return 'items/shop/skill_time_freeze';
            case 'palette_skill':
                return 'items/shop/skill_palette';
            default:
                return 'items/coin';
        }
    }
}

export default MailController;

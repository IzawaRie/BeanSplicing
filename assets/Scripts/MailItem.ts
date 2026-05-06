import { _decorator, Color, Component, instantiate, Label, Node, Prefab, Sprite, SpriteFrame } from 'cc';
import { MailItemSp } from './MailItemSp';
const { ccclass, property } = _decorator;

const MAIL_STATUS_UNREAD_COLOR = new Color(253, 99, 13, 255);
const MAIL_STATUS_CLAIMED_COLOR = new Color(128, 116, 111, 255);

export type MailItemViewData = {
    title: string;
    description: string;
    statusText: string;
    timeText: string;
    isUnread: boolean;
};

export type MailItemAttachmentViewData = {
    spriteFrame: SpriteFrame | null;
    count: number;
};

@ccclass('MailItem')
export class MailItem extends Component {
    @property({ type: Node })
    mail_no_open: Node = null;

    @property({ type: Node })
    mail_open: Node = null;

    @property({ type: Node })
    item_content: Node = null;

    @property({ type: Sprite })
    mail_border: Sprite = null;

    @property({ type: Label })
    mail_item_title: Label = null;

    @property({ type: Label })
    mail_item_description: Label = null;

    @property({ type: Label })
    mail_item_status: Label = null;

    @property({ type: Label })
    mail_item_time: Label = null;

    public setData(data: MailItemViewData, borderSpriteFrame: SpriteFrame | null = null): void {
        const safeData = data || {
            title: '',
            description: '',
            statusText: '',
            timeText: '',
            isUnread: false
        };

        if (this.mail_item_title) {
            this.mail_item_title.string = safeData.title || '';
        }
        if (this.mail_item_description) {
            this.mail_item_description.string = safeData.description || '';
        }
        if (this.mail_item_status) {
            this.mail_item_status.string = safeData.statusText || '';
            this.mail_item_status.color = safeData.isUnread
                ? MAIL_STATUS_UNREAD_COLOR
                : MAIL_STATUS_CLAIMED_COLOR;
        }
        if (this.mail_item_time) {
            this.mail_item_time.string = safeData.timeText || '';
        }

        if (this.mail_no_open) {
            this.mail_no_open.active = !!safeData.isUnread;
        }
        if (this.mail_open) {
            this.mail_open.active = !safeData.isUnread;
        }
        if (this.mail_border) {
            this.mail_border.spriteFrame = borderSpriteFrame;
        }
    }

    public clearAttachmentItems(): void {
        if (!this.item_content) {
            return;
        }

        for (const child of [...this.item_content.children]) {
            child.destroy();
        }
    }

    public setAttachments(attachments: MailItemAttachmentViewData[], itemPrefab: Prefab | null): void {
        this.clearAttachmentItems();
        if (!this.item_content || !itemPrefab) {
            return;
        }

        const safeAttachments = Array.isArray(attachments) ? attachments : [];
        for (const attachment of safeAttachments) {
            const itemNode = instantiate(itemPrefab);
            itemNode.getComponent(MailItemSp)?.setData(attachment.spriteFrame, attachment.count);
            this.item_content.addChild(itemNode);
        }
    }
}

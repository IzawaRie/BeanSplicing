import { callFunction } from './CloudbaseService';

declare const wx: any;

export type MailAttachment = {
    type: string;
    count: number;
    itemId?: number;
    name?: string;
};

export type MailRecord = {
    id: string;
    playerOpenId: string;
    sourceOrderId: string;
    source: string;
    title: string;
    content: string;
    attachments: MailAttachment[];
    status: 'unclaimed' | 'claiming' | 'claimed' | string;
    createdAt: string;
    updatedAt: string;
    claimedAt?: string | null;
};

export type InboxMeta = {
    _id?: string;
    playerOpenId: string;
    unclaimedCount: number;
    latestMailAt?: string | null;
    lastMailId?: string;
    updatedAt?: string | null;
};

type InboxWatchHandlers = {
    onMetaChanged?: (meta: InboxMeta) => void;
    onError?: (error: unknown) => void;
};

const MAILBOX_COLLECTION = 'mailbox';
const INBOX_META_COLLECTION = 'inbox_meta';

function normalizeInteger(value: unknown, fallback = 0): number {
    const nextValue = Math.max(0, Math.floor(Number(value) || 0));
    return Number.isFinite(nextValue) ? nextValue : fallback;
}

function normalizeMailAttachment(raw: any): MailAttachment {
    return {
        type: String(raw?.type || ''),
        count: normalizeInteger(raw?.count, 0),
        itemId: raw?.itemId !== undefined && raw?.itemId !== null
            ? normalizeInteger(raw.itemId, 0)
            : undefined,
        name: raw?.name ? String(raw.name) : ''
    };
}

function normalizeMailRecord(raw: any): MailRecord {
    return {
        id: String(raw?.id || raw?._id || ''),
        playerOpenId: String(raw?.playerOpenId || ''),
        sourceOrderId: String(raw?.sourceOrderId || ''),
        source: String(raw?.source || ''),
        title: String(raw?.title || '礼包到账'),
        content: String(raw?.content || ''),
        attachments: Array.isArray(raw?.attachments) ? raw.attachments.map(normalizeMailAttachment) : [],
        status: String(raw?.status || 'unclaimed'),
        createdAt: String(raw?.createdAt || ''),
        updatedAt: String(raw?.updatedAt || ''),
        claimedAt: raw?.claimedAt ? String(raw.claimedAt) : null
    };
}

function normalizeInboxMeta(raw: any, playerOpenId: string): InboxMeta {
    return {
        _id: raw?._id ? String(raw._id) : playerOpenId,
        playerOpenId,
        unclaimedCount: normalizeInteger(raw?.unclaimedCount, 0),
        latestMailAt: raw?.latestMailAt ? String(raw.latestMailAt) : null,
        lastMailId: raw?.lastMailId ? String(raw.lastMailId) : '',
        updatedAt: raw?.updatedAt ? String(raw.updatedAt) : null
    };
}

function isWechatCloudReady(): boolean {
    return typeof wx !== 'undefined' && !!wx.cloud;
}

export class MailService {
    private static _instance: MailService | null = null;
    private inboxWatchHandle: any = null;
    private currentOpenId = '';

    public static get instance(): MailService {
        if (!MailService._instance) {
            MailService._instance = new MailService();
        }
        return MailService._instance;
    }

    public async listMails(openid: string): Promise<MailRecord[]> {
        const safeOpenId = String(openid || '').trim();
        if (!safeOpenId) {
            return [];
        }

        const response = await this.callMailboxApi('list_mails', { openid: safeOpenId });
        const list = Array.isArray(response?.data) ? response.data : [];
        return list.map(normalizeMailRecord);
    }

    public async getInboxMeta(openid: string): Promise<InboxMeta> {
        const safeOpenId = String(openid || '').trim();
        if (!safeOpenId) {
            return normalizeInboxMeta(null, '');
        }

        const response = await this.callMailboxApi('get_meta', { openid: safeOpenId });
        return normalizeInboxMeta(response?.data, safeOpenId);
    }

    public watchInboxMeta(openid: string, handlers: InboxWatchHandlers): void {
        const safeOpenId = String(openid || '').trim();
        this.stopInboxWatch();
        this.currentOpenId = safeOpenId;

        if (!safeOpenId) {
            handlers.onMetaChanged?.(normalizeInboxMeta(null, safeOpenId));
            return;
        }

        if (!isWechatCloudReady()) {
            void this.getInboxMeta(safeOpenId)
                .then((meta) => handlers.onMetaChanged?.(meta))
                .catch((error) => handlers.onError?.(error));
            return;
        }

        try {
            const db = wx.cloud.database();
            this.inboxWatchHandle = db
                .collection(INBOX_META_COLLECTION)
                .doc(safeOpenId)
                .watch({
                    onChange: (snapshot: any) => {
                        const docs = Array.isArray(snapshot?.docs) ? snapshot.docs : [];
                        handlers.onMetaChanged?.(normalizeInboxMeta(docs[0] || null, safeOpenId));
                    },
                    onError: (error: unknown) => {
                        handlers.onError?.(error);
                    }
                });
        } catch (error) {
            handlers.onError?.(error);
        }
    }

    public stopInboxWatch(): void {
        if (this.inboxWatchHandle && typeof this.inboxWatchHandle.close === 'function') {
            this.inboxWatchHandle.close();
        }
        this.inboxWatchHandle = null;
    }

    public async claimMail(openid: string, mailId: string): Promise<MailRecord | null> {
        const safeOpenId = String(openid || '').trim();
        const safeMailId = String(mailId || '').trim();
        if (!safeOpenId || !safeMailId) {
            return null;
        }

        const response = await this.callMailboxApi('claim_mail', {
            openid: safeOpenId,
            mailId: safeMailId
        });

        if (!response?.success) {
            return null;
        }

        return normalizeMailRecord(response.data);
    }

    public async claimAllMails(openid: string): Promise<MailRecord[]> {
        const safeOpenId = String(openid || '').trim();
        if (!safeOpenId) {
            return [];
        }

        const response = await this.callMailboxApi('claim_all_mails', {
            openid: safeOpenId
        });

        const list = Array.isArray(response?.data) ? response.data : [];
        return list.map(normalizeMailRecord);
    }

    public async deleteClaimedMails(openid: string): Promise<string[]> {
        const safeOpenId = String(openid || '').trim();
        if (!safeOpenId) {
            return [];
        }

        const response = await this.callMailboxApi('delete_claimed_mails', {
            openid: safeOpenId
        });

        const deletedIds = Array.isArray(response?.data?.deletedIds) ? response.data.deletedIds : [];
        return deletedIds.map((id: unknown) => String(id || '')).filter(Boolean);
    }

    public async syncInboxMeta(meta: InboxMeta): Promise<void> {
        if (!meta?.playerOpenId) {
            return;
        }

        await this.callMailboxApi('sync_meta', {
            openid: meta.playerOpenId,
            unclaimedCount: normalizeInteger(meta.unclaimedCount, 0),
            latestMailAt: meta.latestMailAt || null,
            lastMailId: meta.lastMailId || ''
        });
    }

    private async callMailboxApi(action: string, payload: Record<string, any>): Promise<any> {
        const response = await callFunction('mailbox_api', {
            action,
            ...payload
        });

        const result = response?.result || {};
        if (result?.success === false) {
            console.warn(`MailService: mailbox_api ${action} failed`, result);
        }
        return result;
    }
}

export default MailService.instance;

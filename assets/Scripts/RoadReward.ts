import { _decorator, Component, Label, Node, resources, Sprite, SpriteFrame, UITransform } from 'cc';
const { ccclass, property } = _decorator;

export type RoadRewardItemData = {
    imagePath: string;
    count: number;
    type: string;
};

export type RoadRewardLevelData = {
    level: number;
    requiredExp?: number;
    freeReward: RoadRewardItemData;
    premiumReward: RoadRewardItemData;
    freeClaimed?: boolean;
    premiumClaimed?: boolean;
    currentPassLevel?: number;
    premiumPassUnlocked?: boolean;
    roadNormalBorder?: SpriteFrame | null;
    roadLightBorder?: SpriteFrame | null;
    roadLockBorder?: SpriteFrame | null;
};

@ccclass('RoadReward')
export class RoadReward extends Component {
    private static readonly spriteFrameCache = new Map<string, SpriteFrame | null>();
    private static readonly spriteFrameLoadTasks = new Map<string, Promise<SpriteFrame | null>>();

    @property({ type: Node })
    free_road_right: Node = null;

    @property({ type: Node })
    free_road_lock: Node = null;

    @property({ type: Node })
    video_road_right: Node = null;

    @property({ type: Node })
    video_road_lock: Node = null;

    @property({ type: Node })
    road_arrow_down: Node = null;

    @property({ type: Sprite })
    free_road_normal_border: Sprite = null;

    @property({ type: Sprite })
    video_road_normal_border: Sprite = null;

    @property({ type: Sprite })
    free_item_sp: Sprite = null;

    @property({ type: Sprite })
    video_item_sp: Sprite = null;

    @property({ type: Label })
    road_level: Label = null;

    @property({ type: Label })
    free_number: Label = null;

    @property({ type: Label })
    video_number: Label = null;

    private _loadToken: number = 0;
    private _freeImagePath: string = '';
    private _videoImagePath: string = '';
    private _baseFreeSpriteWidth: number = 0;
    private _baseFreeSpriteHeight: number = 0;
    private _baseVideoSpriteWidth: number = 0;
    private _baseVideoSpriteHeight: number = 0;

    public setData(data: RoadRewardLevelData | null): void {
        this._loadToken++;
        this.captureBaseSpriteSizes();

        if (!data) {
            this.node.active = false;
            this.clearRewardSprites();
            return;
        }

        this.node.active = true;
        if (this.road_level) {
            this.road_level.string = `${data.level}`;
        }
        if (this.free_number) {
            this.free_number.string = `${Math.max(0, Math.floor(Number(data.freeReward?.count) || 0))}`;
        }
        if (this.video_number) {
            this.video_number.string = `${Math.max(0, Math.floor(Number(data.premiumReward?.count) || 0))}`;
        }
        this.applyRewardState(data);

        const loadToken = this._loadToken;
        this.applyRewardSprite(data.freeReward?.imagePath ?? '', this.free_item_sp, 'free', loadToken);
        this.applyRewardSprite(data.premiumReward?.imagePath ?? '', this.video_item_sp, 'video', loadToken);
    }

    start() {

    }

    update(deltaTime: number) {
        
    }

    private clearRewardSprites(): void {
        this._freeImagePath = '';
        this._videoImagePath = '';
        if (this.free_item_sp) {
            this.free_item_sp.spriteFrame = null;
        }
        if (this.video_item_sp) {
            this.video_item_sp.spriteFrame = null;
        }
    }

    private applyRewardState(data: RoadRewardLevelData): void {
        const currentPassLevel = Math.max(0, Math.floor(Number(data.currentPassLevel) || 0));
        const isLockedByLevel = currentPassLevel < data.level;
        const isCurrentLevel = currentPassLevel === data.level;
        const freeClaimed = data.freeClaimed === true;
        const premiumClaimed = data.premiumClaimed === true;
        const premiumPassUnlocked = data.premiumPassUnlocked === true;

        if (this.road_arrow_down) {
            this.road_arrow_down.active = isCurrentLevel;
        }

        this.applyRewardTrackState(
            this.free_road_normal_border,
            this.free_road_right,
            this.free_road_lock,
            freeClaimed,
            isLockedByLevel,
            isCurrentLevel,
            data
        );

        this.applyRewardTrackState(
            this.video_road_normal_border,
            this.video_road_right,
            this.video_road_lock,
            premiumClaimed,
            isLockedByLevel || !premiumPassUnlocked,
            premiumPassUnlocked && isCurrentLevel,
            data
        );
    }

    private applyRewardTrackState(
        border: Sprite | null,
        rightNode: Node | null,
        lockNode: Node | null,
        claimed: boolean,
        locked: boolean,
        highlighted: boolean,
        data: RoadRewardLevelData
    ): void {
        if (border) {
            border.spriteFrame = locked
                ? data.roadLockBorder ?? border.spriteFrame
                : highlighted
                    ? data.roadLightBorder ?? data.roadNormalBorder ?? border.spriteFrame
                    : claimed
                    ? data.roadNormalBorder ?? border.spriteFrame
                    : data.roadNormalBorder ?? border.spriteFrame;
        }
        if (rightNode) {
            rightNode.active = !locked && claimed;
        }
        if (lockNode) {
            lockNode.active = locked;
        }
    }

    private applyRewardSprite(
        imagePath: string,
        sprite: Sprite | null,
        slot: 'free' | 'video',
        loadToken: number
    ): void {
        if (!sprite) {
            return;
        }

        const safeImagePath = String(imagePath || '').trim();
        if (!safeImagePath) {
            this.setCurrentImagePath(slot, '');
            sprite.spriteFrame = null;
            return;
        }

        const currentImagePath = slot === 'free' ? this._freeImagePath : this._videoImagePath;
        if (currentImagePath === safeImagePath && sprite.spriteFrame) {
            this.applySpriteAspectRatio(sprite, slot);
            return;
        }

        this.setCurrentImagePath(slot, safeImagePath);
        const cachedSpriteFrame = RoadReward.spriteFrameCache.get(safeImagePath);
        if (RoadReward.spriteFrameCache.has(safeImagePath)) {
            sprite.spriteFrame = cachedSpriteFrame;
            this.applySpriteAspectRatio(sprite, slot);
            return;
        }

        void RoadReward.loadSpriteFrame(safeImagePath).then((spriteFrame) => {
            if (loadToken !== this._loadToken || !sprite || this.getCurrentImagePath(slot) !== safeImagePath) {
                return;
            }

            sprite.spriteFrame = spriteFrame;
            this.applySpriteAspectRatio(sprite, slot);
        });
    }

    private static loadSpriteFrame(imagePath: string): Promise<SpriteFrame | null> {
        if (RoadReward.spriteFrameCache.has(imagePath)) {
            return Promise.resolve(RoadReward.spriteFrameCache.get(imagePath) ?? null);
        }

        const runningTask = RoadReward.spriteFrameLoadTasks.get(imagePath);
        if (runningTask) {
            return runningTask;
        }

        const task = new Promise<SpriteFrame | null>((resolve) => {
            resources.load(`${imagePath}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
                const result = err || !spriteFrame ? null : spriteFrame;
                RoadReward.spriteFrameCache.set(imagePath, result);
                RoadReward.spriteFrameLoadTasks.delete(imagePath);
                resolve(result);
            });
        });
        RoadReward.spriteFrameLoadTasks.set(imagePath, task);
        return task;
    }

    private setCurrentImagePath(slot: 'free' | 'video', imagePath: string): void {
        if (slot === 'free') {
            this._freeImagePath = imagePath;
            return;
        }

        this._videoImagePath = imagePath;
    }

    private getCurrentImagePath(slot: 'free' | 'video'): string {
        return slot === 'free' ? this._freeImagePath : this._videoImagePath;
    }

    private captureBaseSpriteSizes(): void {
        if (this._baseFreeSpriteWidth <= 0 || this._baseFreeSpriteHeight <= 0) {
            const freeTransform = this.free_item_sp?.node?.getComponent(UITransform);
            if (freeTransform) {
                this._baseFreeSpriteWidth = freeTransform.width;
                this._baseFreeSpriteHeight = freeTransform.height;
            }
        }

        if (this._baseVideoSpriteWidth <= 0 || this._baseVideoSpriteHeight <= 0) {
            const videoTransform = this.video_item_sp?.node?.getComponent(UITransform);
            if (videoTransform) {
                this._baseVideoSpriteWidth = videoTransform.width;
                this._baseVideoSpriteHeight = videoTransform.height;
            }
        }
    }

    private applySpriteAspectRatio(sprite: Sprite, slot: 'free' | 'video'): void {
        const spriteFrame = sprite.spriteFrame;
        const uiTransform = sprite.node?.getComponent(UITransform);
        if (!spriteFrame || !uiTransform) {
            return;
        }

        const sourceWidth = spriteFrame.originalSize.width;
        const sourceHeight = spriteFrame.originalSize.height;
        if (sourceWidth <= 0 || sourceHeight <= 0) {
            return;
        }

        const baseWidth = slot === 'free' ? this._baseFreeSpriteWidth : this._baseVideoSpriteWidth;
        const baseHeight = slot === 'free' ? this._baseFreeSpriteHeight : this._baseVideoSpriteHeight;
        if (baseWidth <= 0 || baseHeight <= 0) {
            return;
        }

        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        const sourceRatio = sourceWidth / sourceHeight;
        const baseRatio = baseWidth / baseHeight;
        let targetWidth = baseWidth;
        let targetHeight = baseHeight;

        if (baseRatio > sourceRatio) {
            targetWidth = baseHeight * sourceRatio;
        } else {
            targetHeight = baseWidth / sourceRatio;
        }

        uiTransform.setContentSize(targetWidth, targetHeight);
    }
}

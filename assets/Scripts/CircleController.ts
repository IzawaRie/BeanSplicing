import { _decorator, Component, Node, Sprite, Color, EventTouch, UITransform, Label } from 'cc';
import { GameManager } from './GameManager';
import { GridDrawer } from './GridDrawer';
const { ccclass, property } = _decorator;

/**
 * 圆形颜色控制器
 * 负责单个颜色节点的拖动和交互
 */
@ccclass('CircleController')
export class CircleController extends Component {
    // 原始位置
    private originalPos: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 };

    // 拖动状态
    private isDragging: boolean = false;
    private dragOffset: { x: number, y: number } = { x: 0, y: 0 };

    // 颜色序号（从1开始）
    private _colorIndex: number = 0;
    public get colorIndex(): number { return this._colorIndex; }

    // 颜色数据
    private _colorR: number = 0;
    private _colorG: number = 0;
    private _colorB: number = 0;
    private _colorA: number = 0;

    // 计时器相关
    private targetBlock: Node | null = null;         // 当前目标 block
    private targetBlockIndex: number = 0;            // 当前目标 block 的序号
    private hoverStartTime: number = 0;               // 开始 hover 的时间
    private isHovering: boolean = false;              // 是否正在 hover
    private readonly HOVER_DURATION: number = 2000;   // hover 时长（毫秒）
    private readonly HOVER_DELAY: number = 500;        // 延迟开始计时（毫秒）
    private readonly POSITION_TOLERANCE: number = 20;  // 位置误差范围

    onLoad() {
        // 保存原始位置
        const pos = this.node.position;
        this.originalPos = { x: pos.x, y: pos.y, z: pos.z };

        // 默认隐藏 progress 节点
        const progressNode = this.node.getChildByName('progress');
        if (progressNode) {
            progressNode.active = false;
        }

        // 注册触摸事件
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    onDestroy() {
        // 移除触摸事件
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    update(_deltaTime: number) {
        // 更新 hover 进度
        if (this.isHovering && this.targetBlock && this.targetBlockIndex > 0) {
            const elapsed = Date.now() - this.hoverStartTime;

            // 延迟时间过后才开始计时
            if (elapsed < this.HOVER_DELAY) {
                this.updateProgress(0);  // 延迟期间不显示进度
                return;
            }

            const actualElapsed = elapsed - this.HOVER_DELAY;
            const progress = actualElapsed / this.HOVER_DURATION;

            if (progress >= 1) {
                // 计时完成，触发变色
                this.highlightBlocksByIndex(this.targetBlockIndex, true);
                this.resetHover();
            } else {
                // 更新进度条
                this.updateProgress(progress);
            }
        }
    }

    /**
     * 设置颜色
     */
    public setColor(r: number, g: number, b: number, a: number, colorIndex: number): void {
        this._colorR = r;
        this._colorG = g;
        this._colorB = b;
        this._colorA = a;
        this._colorIndex = colorIndex;

        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(r, g, b, a);
        }

        // 设置 progress 节点的颜色
        const progressNode = this.node.getChildByName('progress');
        if (progressNode) {
            const progressSprite = progressNode.getComponent(Sprite);
            if (progressSprite) {
                progressSprite.color = new Color(r, g, b, a);
            }
        }
    }

    /**
     * 获取颜色数据
     */
    public getColor(): { r: number, g: number, b: number, a: number } {
        return { r: this._colorR, g: this._colorG, b: this._colorB, a: this._colorA };
    }

    /**
     * 重置位置
     */
    public resetPosition(): void {
        this.node.setPosition(this.originalPos.x, this.originalPos.y, this.originalPos.z);
    }

    /**
     * 重置 hover 状态
     */
    private resetHover(): void {
        this.isHovering = false;
        this.targetBlock = null;
        this.targetBlockIndex = 0;
        this.hoverStartTime = 0;
        this.updateProgress(0);
    }

    /**
     * 更新进度条
     */
    private updateProgress(progress: number): void {
        const progressNode = this.node.getChildByName('progress');
        if (!progressNode) return;

        // 进度为0或>=1时隐藏
        progressNode.active = progress > 0 && progress < 1;
        if (progressNode.active) {
            const sprite = progressNode.getComponent(Sprite);
            if (sprite) {
                // fillRange 从 0 到 -1
                (sprite as any).fillRange = -progress;
            }
        }
    }

    /**
     * 触摸开始
     */
    private onTouchStart(event: EventTouch) {
        this.isDragging = true;
        const pos = event.getUILocation();
        const nodePos = this.node.position;
        this.dragOffset = { x: pos.x - nodePos.x, y: pos.y - nodePos.y };
        this.resetHover();
    }

    /**
     * 触摸移动
     */
    private onTouchMove(event: EventTouch) {
        if (!this.isDragging) return;

        const pos = event.getUILocation();
        const newX = pos.x - this.dragOffset.x;
        const newY = pos.y - this.dragOffset.y;
        this.node.setPosition(newX, newY, 0);

        // 检测是否拖动到了某个 block 上
        const newTargetBlock = this.getBlockAtPosition(pos.x, pos.y);

        if (newTargetBlock) {
            const newTargetIndex = this.getBlockNumber(newTargetBlock);

            // 检查是否是同一个 block（在误差范围内）
            if (this.targetBlock === newTargetBlock ||
                (this.targetBlock && newTargetBlock &&
                 Math.abs(this.targetBlock.position.x - newTargetBlock.position.x) < this.POSITION_TOLERANCE &&
                 Math.abs(this.targetBlock.position.y - newTargetBlock.position.y) < this.POSITION_TOLERANCE)) {

                // 同一个 block，继续计时
                if (!this.isHovering && newTargetIndex > 0) {
                    this.isHovering = true;
                    this.targetBlock = newTargetBlock;
                    this.targetBlockIndex = newTargetIndex;
                    this.hoverStartTime = Date.now();
                }
            } else {
                // 换到了新的 block，重置计时
                this.resetHover();
                if (newTargetIndex > 0) {
                    this.isHovering = true;
                    this.targetBlock = newTargetBlock;
                    this.targetBlockIndex = newTargetIndex;
                    this.hoverStartTime = Date.now();
                }
            }
        } else {
            // 没有在 block 上
            this.resetHover();
        }
    }

    /**
     * 触摸结束
     */
    private onTouchEnd(_event: EventTouch) {
        this.isDragging = false;
        this.resetHover();
        this.resetPosition();
    }

    /**
     * 获取指定位置（世界坐标）的 block
     */
    private getBlockAtPosition(worldX: number, worldY: number): Node | null {
        const gameManager = GameManager.getInstance();
        if (!gameManager || !gameManager.gridDrawer) return null;

        const gridDrawer = gameManager.gridDrawer;
        const blocks = gridDrawer.getAllBlocks();

        // 获取边界
        const bounds = gridDrawer.getContentBounds();
        if (!bounds) return null;

        // 检查触摸点是否在边界内
        if (worldX < bounds.minX || worldX > bounds.maxX ||
            worldY < bounds.minY || worldY > bounds.maxY) {
            return null;
        }

        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;

                // 获取 block 的世界坐标
                const blockWorldPos = block.getWorldPosition();
                const uiTransform = block.getComponent(UITransform);
                if (!uiTransform) continue;

                // 获取父节点的缩放
                let scaleX = 1;
                let scaleY = 1;
                let parent = block.parent;
                while (parent) {
                    scaleX *= parent.scale.x;
                    scaleY *= parent.scale.y;
                    parent = parent.parent;
                }

                // 考虑缩放后的实际尺寸
                const width = uiTransform.width * scaleX;
                const height = uiTransform.height * scaleY;

                // 使用世界坐标检测
                const halfW = width / 2;
                const halfH = height / 2;

                if (worldX >= blockWorldPos.x - halfW && worldX <= blockWorldPos.x + halfW &&
                    worldY >= blockWorldPos.y - halfH && worldY <= blockWorldPos.y + halfH) {
                    return block;
                }
            }
        }

        return null;
    }

    /**
     * 获取 block 的序号
     */
    private getBlockNumber(block: Node): number {
        const numberNode = block.getChildByName('number');
        if (!numberNode) return 0;

        const label = numberNode.getComponent(Label);
        if (!label || !label.string) return 0;

        return parseInt(label.string) || 0;
    }

    /**
     * 根据序号高亮/取消高亮所有 blocks
     */
    private highlightBlocksByIndex(blockIndex: number, highlight: boolean) {
        const gameManager = GameManager.getInstance();
        if (!gameManager || !gameManager.gridDrawer) return;

        const gridDrawer = gameManager.gridDrawer;
        const blocks = gridDrawer.getBlocksByColorIndex(blockIndex);

        for (const block of blocks) {
            const circleNode = block.getChildByName('circle');
            if (!circleNode) continue;

            const sprite = circleNode.getComponent(Sprite);
            if (!sprite) continue;

            if (highlight) {
                // 显示 circle 并设置颜色和 spriteFrame
                sprite.enabled = true;
                const circleSprite = this.node.getComponent(Sprite);
                if (circleSprite && circleSprite.spriteFrame) {
                    sprite.spriteFrame = circleSprite.spriteFrame;
                }
                // 设置颜色
                sprite.color = new Color(this._colorR, this._colorG, this._colorB, this._colorA);
            } else {
                // 隐藏 circle
                sprite.enabled = false;
            }
        }
    }
}

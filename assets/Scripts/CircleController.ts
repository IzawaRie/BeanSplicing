import { _decorator, Component, Node, Sprite, Color, EventTouch, UITransform, Label } from 'cc';
import { GameManager, GameState } from './GameManager';
import { BlockController, BlockState } from './BlockController';
const { ccclass, property } = _decorator;

/**
 * 圆形颜色控制器
 * 负责单个颜色节点的拖动和交互
 */
@ccclass('CircleController')
export class CircleController extends Component {
    // 原始位置
    private originalPos: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 };

    // 原始缩放和旋转
    private originalScale: { x: number, y: number, z: number } = { x: 1, y: 1, z: 1 };
    private originalRotation: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 };

    // 拖动状态
    private isDragging: boolean = false;

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
    private readonly HOVER_DURATION: number = 1000;   // hover 时长（毫秒）
    private readonly HOVER_DELAY: number = 500;        // 延迟开始计时（毫秒）
    private readonly POSITION_TOLERANCE: number = 20;  // 位置误差范围
    private readonly DRAG_OFFSET: number = 90;
    private hasTriggeredHighlight: boolean = false;    // 是否已触发高亮

    // circle 子节点
    private circleNode: Node | null = null;
    private progressNode: Node | null = null;
    private pointNode: Node | null = null;

    /**
     * 判断游戏是否进行中
     */
    private isGameActive(): boolean {
        const gameManager = GameManager.getInstance();
        return gameManager?.gameState == GameState.PLAYING;
    }

    onLoad() {
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
        // 如果已触发高亮，不再更新进度
        if (this.hasTriggeredHighlight) return;

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
                // 计时完成，触发变色，不重置进度
                this.highlightBlocksByIndex(this.targetBlockIndex, true);
                this.resetHover();
                this.hasTriggeredHighlight = true;
            } else {
                // 更新进度条
                this.updateProgress(progress);
            }
        }
    }

    /**
     * 设置颜色
     */
    public setCircleListNode(){
        // 获取 circle 子节点
        this.circleNode = this.node.getChildByName('circle');

        const pos = this.node.position;
        this.originalPos = { x: pos.x, y: pos.y, z: pos.z };

        // 保存原始 scale 和 rotation
        this.originalScale = { x: this.node.scale.x, y: this.node.scale.y, z: this.node.scale.z };
        this.originalRotation = { x: this.node.eulerAngles.x, y: this.node.eulerAngles.y, z: this.node.eulerAngles.z };

        // 获取并保存 progress 节点
        this.progressNode = this.node.getChildByName('progress');

        // 获取并保存 point 节点
        this.pointNode = this.circleNode.getChildByName('point');
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

        // 设置主节点 sprite 颜色
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(r, g, b, a);
        }

        // 设置 circle 节点的颜色
        if (this.circleNode) {
            const circleSprite = this.circleNode.getComponent(Sprite);
            if (circleSprite) {
                circleSprite.color = new Color(r, g, b, a);
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
     * 重置位置 - 节点回到原位置
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
        this.hasTriggeredHighlight = false;
        this.updateProgress(0);
    }

    /**
     * 更新进度条
     */
    private updateProgress(progress: number): void {
        if (!this.progressNode) return;

        // 进度为0时隐藏，>=1时显示
        this.progressNode.active = progress > 0;
        if (this.progressNode.active) {
            const sprite = this.progressNode.getComponent(Sprite);
            if (sprite) {
                // fillRange 从 0 到 -1
                (sprite as any).fillRange = progress;
            }
        }
    }

    /**
     * 触摸开始
     */
    private onTouchStart(event: EventTouch) {
        if (!this.isGameActive()) return;

        this.isDragging = true;
        this.hasTriggeredHighlight = false;

        // 显示 circleNode，隐藏主节点
        if (this.circleNode) {
            this.circleNode.active = true;
        }

        // 上下翻转
        this.node.setScale(1, -1, 1);

        // 根据左右手配置设置旋转角度
        const handSetting = GameManager.getInstance().hand_setting;
        const rotationZ = handSetting === -1 ? -50 : 50;
        this.node.setRotationFromEuler(0, 0, rotationZ);

        // 设置节点世界坐标为触摸位置
        const pos = event.getUILocation();
        this.node.setWorldPosition(pos.x - this.DRAG_OFFSET, pos.y + this.DRAG_OFFSET, 0);
        this.resetHover();
    }

    /**
     * 触摸移动 - 移动节点
     */
    private onTouchMove(event: EventTouch) {
        if (!this.isDragging) return;

        // 设置节点世界坐标为触摸位置
        const pos = event.getUILocation();
        this.node.setWorldPosition(pos.x - this.DRAG_OFFSET, pos.y + this.DRAG_OFFSET, 0);

        const nodeWorldPos = this.pointNode.getWorldPosition();
        // 检测是否拖动到了某个 block 上
        const newTargetBlock = this.getBlockAtPosition(nodeWorldPos.x, nodeWorldPos.y);

        if (newTargetBlock) {
            const newTargetIndex = this.getBlockNumber(newTargetBlock);

            // 检查该 block 是否已经是 IRONED 状态
            const blockController = newTargetBlock.getComponent(BlockController);
            if (blockController && blockController.state === BlockState.IRONED) {
                // 已经是熨烫过的状态，不能再操作
                this.resetHover();
                return;
            }

            // 检查该 block 是否已经是当前颜色
            if (newTargetIndex > 0 && this.isBlockColorMatched(newTargetBlock)) {
                return;
            }

            // 检查是否是同一个 block（在误差范围内）
            const isSameBlock = this.targetBlock === newTargetBlock ||
                (this.targetBlock && newTargetBlock &&
                 Math.abs(this.targetBlock.position.x - newTargetBlock.position.x) < this.POSITION_TOLERANCE &&
                 Math.abs(this.targetBlock.position.y - newTargetBlock.position.y) < this.POSITION_TOLERANCE);

            if (!isSameBlock) {
                // 换到了新的 block
                if (this.hasTriggeredHighlight) {
                    // 已经触发过高亮，立即高亮新 block
                    this.targetBlock = newTargetBlock;
                    this.targetBlockIndex = newTargetIndex;
                    this.highlightBlocksByIndex(newTargetIndex, true);
                } else {
                    // 还没触发高亮，重置计时
                    this.resetHover();
                    if (newTargetIndex > 0) {
                        this.isHovering = true;
                        this.targetBlock = newTargetBlock;
                        this.targetBlockIndex = newTargetIndex;
                        this.hoverStartTime = Date.now();
                    }
                }
            }
        }
    }

    /**
     * 触摸结束
     */
    private onTouchEnd(_event: EventTouch) {
        this.isDragging = false;

        // 恢复原始 scale 和 rotation
        this.node.setScale(this.originalScale.x, this.originalScale.y, this.originalScale.z);
        this.node.setRotationFromEuler(this.originalRotation.x, this.originalRotation.y, this.originalRotation.z);

        // 隐藏 circleNode
        if (this.circleNode) {
            this.circleNode.active = false;
        }

        this.resetHover();
        this.resetPosition();
    }

    /**
     * 获取指定位置（世界坐标）的 block
     * 如果该位置没有序号，会查找周围8个方向的 block
     */
    private getBlockAtPosition(worldX: number, worldY: number): Node | null {
        const gameManager = GameManager.getInstance();
        if (!gameManager || !gameManager.levelMode.gridDrawer) return null;

        const gridDrawer = gameManager.levelMode.gridDrawer;
        const blocks = gridDrawer.getAllBlocks();

        // 获取边界
        const bounds = gridDrawer.getContentBounds();
        if (!bounds) return null;

        // 检查触摸点是否在边界内
        if (worldX < bounds.minX || worldX > bounds.maxX ||
            worldY < bounds.minY || worldY > bounds.maxY) {
            return null;
        }

        // 首先尝试直接查找指定位置的 block
        const directBlock = this.findBlockAtPosition(blocks, worldX, worldY);
        if (directBlock) {
            const blockNum = this.getBlockNumber(directBlock);
            if (blockNum > 0) {
                return directBlock;
            }
        }

        // // 如果没找到有编号的 block，查找周围8个方向
        // const neighborOffsets = [
        //     { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
        //     { row: 0, col: -1 },                      { row: 0, col: 1 },
        //     { row: 1, col: -1 },  { row: 1, col: 0 },  { row: 1, col: 1 }
        // ];

        // for (const offset of neighborOffsets) {
        //     if (directBlock) {
        //         // 根据找到的 block 计算行列
        //         const row = this.getBlockRow(directBlock);
        //         const col = this.getBlockCol(directBlock);
        //         const neighborRow = row + offset.row;
        //         const neighborCol = col + offset.col;

        //         if (neighborRow >= 0 && neighborRow < blocks.length &&
        //             neighborCol >= 0 && neighborCol < blocks[0].length) {
        //             const neighborBlock = blocks[neighborRow][neighborCol];
        //             if (neighborBlock) {
        //                 const neighborNum = this.getBlockNumber(neighborBlock);
        //                 if (neighborNum > 0) {
        //                     return neighborBlock;
        //                 }
        //             }
        //         }
        //     }
        // }

        // // 如果周围8个方向都没有有编号的 block，返回直接找到的 block（即使没有编号）
        // return directBlock;
    }

    /**
     * 在指定位置查找 block
     */
    private findBlockAtPosition(blocks: Node[][], worldX: number, worldY: number): Node | null {
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
                let parent = block.parent.parent;
                scaleX *= parent.scale.x;
                scaleY *= parent.scale.y;

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
     * 获取 block 所在的行
     */
    private getBlockRow(block: Node): number {
        const gameManager = GameManager.getInstance();
        if (!gameManager || !gameManager.levelMode.gridDrawer) return -1;

        const gridDrawer = gameManager.levelMode.gridDrawer;
        const blocks = gridDrawer.getAllBlocks();

        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                if (blocks[row][col] === block) {
                    return row;
                }
            }
        }
        return -1;
    }

    /**
     * 获取 block 所在的列
     */
    private getBlockCol(block: Node): number {
        const gameManager = GameManager.getInstance();
        if (!gameManager || !gameManager.levelMode.gridDrawer) return -1;

        const gridDrawer = gameManager.levelMode.gridDrawer;
        const blocks = gridDrawer.getAllBlocks();

        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                if (blocks[row][col] === block) {
                    return col;
                }
            }
        }
        return -1;
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
     * 检查 block 的 circle 是否已经是当前颜色
     */
    private isBlockColorMatched(block: Node): boolean {
        const blockController = block.getComponent(BlockController);

        // 检查颜色是否完全匹配
        return blockController.currentColorR === this._colorR &&
               blockController.currentColorG === this._colorG &&
               blockController.currentColorB === this._colorB;
    }

    /**
     * 高亮/取消高亮目标 block
     */
    private highlightBlocksByIndex(_blockIndex: number, highlight: boolean) {
        const gameManager = GameManager.getInstance();
        if (!gameManager) return;

        if (!this.targetBlock) return;

        const blockController = this.targetBlock.getComponent(BlockController);
        const circleNode = this.targetBlock.getChildByName('circle');
        if (!circleNode) return;

        const sprite = circleNode.getComponent(Sprite);
        if (!sprite) return;

        if (highlight) {
            // 显示 circle 并设置颜色和 spriteFrame
            sprite.enabled = true;
            const circleSprite = this.circleNode.getComponent(Sprite);
            if (circleSprite && circleSprite.spriteFrame) {
                sprite.spriteFrame = circleSprite.spriteFrame;
            }
            // 设置 circle 颜色
            sprite.color = new Color(this._colorR, this._colorG, this._colorB, this._colorA);

            // 设置 block 的当前颜色
            if (blockController) {
                blockController.setCurrentColor(this._colorR, this._colorG, this._colorB, this._colorA);
                blockController.state = BlockState.HAS_CIRCLE;
            }
        } else {
            // 隐藏 circle
            sprite.enabled = false;

            // 设置 block 状态为 NO_CIRCLE
            if (blockController) {
                blockController.state = BlockState.NO_CIRCLE;
            }
        }

        gameManager.vibrateShort();
    }
}

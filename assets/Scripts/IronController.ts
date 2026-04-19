import { _decorator, Component, Node, EventTouch, Sprite, UITransform, Color, tween, Vec3, UIOpacity } from 'cc';
import { GameManager, GameState } from './GameManager';
import { BlockController, BlockState } from './BlockController';
import { AudioManager } from './AudioManager';
const { ccclass, property } = _decorator;

@ccclass('IronController')
export class IronController extends Component {
    // 原始位置
    private originalPos: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 };

    // 拖动状态
    private isDragging: boolean = false;

    // 熨烫音效节流：上次播放时间（毫秒）
    private lastShaTime: number = 0;
    // 熨烫音效最小间隔（毫秒）
    private readonly SHA_COOLDOWN: number = 100;
    private readonly IRON_STAGE_INTERVAL: number = 500;
    private readonly activeIronTargets = new Map<Node, number>();

    onLoad() {
        // 保存原始位置
        const pos = this.node.position;
        this.originalPos = { x: pos.x, y: pos.y, z: pos.z };

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

    update(): void {
        if (!this.isDragging) return;
        this.handleBlocksInIronRange();
    }

    /**
     * 重置位置
     */
    public resetPosition(): void {
        this.activeIronTargets.clear();
        this.node.setPosition(this.originalPos.x, this.originalPos.y, this.originalPos.z);
        tween(this.node).
            to(0.3, {scale: Vec3.ONE}).
            start();
    }

    /**
     * 判断游戏是否进行中
     */
    private isGameActive(): boolean {
        const gameManager = GameManager.getInstance();
        return gameManager?.gameState == GameState.PLAYING;
    }

    /**
     * 触摸开始
     */
    private onTouchStart(event: EventTouch) {
        if (!this.isGameActive()) return;
        // 引导期间正确放置了 circle，结束引导
        const gameManager = GameManager.getInstance();
        gameManager.levelMode.tutorialController?.pauseTutorial();
        this.node.getChildByName('mask').active = false;
        this.isDragging = true;
        const pos = event.getUILocation();
        this.node.setWorldPosition(pos.x, pos.y, 0);
        tween(this.node).
            set({scale: Vec3.ONE}).
            to(0.1, {scale: new Vec3(1.3, 1.3, 1.3)}).
            start();
    }

    /**
     * 触摸移动
     */
    private onTouchMove(event: EventTouch) {
        if (!this.isDragging) return;

        const pos = event.getUILocation();
        this.node.setWorldPosition(pos.x, pos.y, 0);
    }

    /**
     * 根据熨斗的 UITransform 范围，检测范围内所有已高亮的 block 并熨烫
     */
    private handleBlocksInIronRange(): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager || !gameManager.levelMode.gridDrawer) return;

        const gridDrawer = gameManager.levelMode.gridDrawer;
        const blocks = gridDrawer.getAllBlocks();
        if (!blocks) return;

        // 获取熨斗节点的世界坐标和尺寸
        const ironWorldPos = this.node.getWorldPosition();
        const ironTransform = this.node.getComponent(UITransform);
        if (!ironTransform) return;

        const ironHalfW = ironTransform.width * 0.8 / 2;
        const ironHalfH = ironTransform.height * 0.8 / 2;
        const ironMinX = ironWorldPos.x - ironHalfW;
        const ironMaxX = ironWorldPos.x + ironHalfW;
        const ironMinY = ironWorldPos.y - ironHalfH;
        const ironMaxY = ironWorldPos.y + ironHalfH;

        const now = Date.now();
        const overlappingBlocks = new Set<Node>();
        let ironedCount = 0;
        let progressedCount = 0;
        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;

                const blockController = block.getComponent(BlockController);
                if (!blockController) continue;

                // 只处理已高亮或熨烫中的 block
                if (blockController.state !== BlockState.HAS_CIRCLE && blockController.state !== BlockState.IRONING) continue;

                // 获取 block 世界坐标和尺寸
                const blockWorldPos = block.getWorldPosition();
                const blockTransform = block.getComponent(UITransform);
                if (!blockTransform) continue;

                // 获取父节点缩放
                let scaleX = 1;
                let scaleY = 1;
                let parent = block.parent;
                while (parent) {
                    scaleX *= parent.scale.x;
                    scaleY *= parent.scale.y;
                    parent = parent.parent;
                }

                const blockHalfW = (blockTransform.width * scaleX) / 2;
                const blockHalfH = (blockTransform.height * scaleY) / 2;
                const blockMinX = blockWorldPos.x - blockHalfW;
                const blockMaxX = blockWorldPos.x + blockHalfW;
                const blockMinY = blockWorldPos.y - blockHalfH;
                const blockMaxY = blockWorldPos.y + blockHalfH;

                // 检测 AABB 碰撞（熨斗范围与 block 范围是否重叠）
                const isOverlapping = !(ironMaxX < blockMinX || ironMinX > blockMaxX ||
                                        ironMaxY < blockMinY || ironMinY > blockMaxY);

                if (isOverlapping) {
                    overlappingBlocks.add(block);

                    const nextStageTime = this.activeIronTargets.get(block);
                    if (nextStageTime === undefined || now >= nextStageTime) {
                        const result = this.processBlock(block);
                        if (result.progressed) {
                            progressedCount++;
                        }
                        if (result.completed) {
                            ironedCount++;
                            this.activeIronTargets.delete(block);
                        } else if (result.progressed) {
                            this.activeIronTargets.set(block, now + this.IRON_STAGE_INTERVAL);
                        }
                    }
                }
            }
        }

        for (const block of this.activeIronTargets.keys()) {
            if (!overlappingBlocks.has(block)) {
                this.activeIronTargets.delete(block);
            }
        }

        // 更新进度
        if (ironedCount > 0) {
            gameManager.levelMode.onBlocksIroned(ironedCount);
        }

        if (progressedCount > 0) {
            // 节流播放音效
            const now = Date.now();
            if (now - this.lastShaTime >= this.SHA_COOLDOWN) {
                this.lastShaTime = now;
                AudioManager.instance.playEffect('sha', 0.5);
            }
        }

        // 检查是否所有 block 都已熨烫
        gameManager.levelMode.checkAllBlocksIroned();
    }

    /**
     * 触摸结束
     */
    public onTouchEnd() {
        if (!this.isDragging) return;
        const gameManager = GameManager.getInstance();
        gameManager.levelMode.tutorialController?.setPauseTime();
        this.isDragging = false;
        this.activeIronTargets.clear();
        this.node.getChildByName('mask').active = true;
        this.resetPosition();
    }

    /**
     * 处理单个 block：如果有上色的 circle，则隐藏 circle 并显示 block 的 sprite
     * @returns 当前是否推进了熨烫进度，以及是否达到完全熨烫
     */
    private processBlock(block: Node): { progressed: boolean; completed: boolean } {
        // 获取 BlockController 检查状态
        const blockController = block.getComponent(BlockController);
        if (!blockController) return { progressed: false, completed: false };

        // 检查是否可以熨烫（HAS_CIRCLE / IRONING 状态）
        if (!blockController.canIron()) return { progressed: false, completed: false };

        const circleNode = block.getChildByName('circle');
        const circleSprite = circleNode?.getComponent(Sprite) ?? null;
        if (blockController.state === BlockState.HAS_CIRCLE) {
            if (!circleSprite || !circleSprite.enabled || circleSprite.color.a === 0) {
                return { progressed: false, completed: false };
            }
        }

        const prevStage = blockController.ironOpacityStage;
        const nextStage = blockController.advanceIroningStage();
        if (nextStage === prevStage) {
            return { progressed: false, completed: false };
        }

        if (circleSprite) {
            circleSprite.enabled = false;
        }

        // 显示 block_sp 下的 sprite 组件
        const blockSpNode = block.getChildByName('block_sp');
        if (blockSpNode) {
            const blockSprite = blockSpNode.getComponent(Sprite);
            if (blockSprite) {
                // 使用当前颜色设置 block sprite
                blockSprite.color = new Color(
                    blockController.currentColorR,
                    blockController.currentColorG,
                    blockController.currentColorB,
                    blockController.currentColorA
                );
                blockSprite.enabled = true;
            }

            let uiOpacity = blockSpNode.getComponent(UIOpacity);
            if (!uiOpacity) {
                uiOpacity = blockSpNode.addComponent(UIOpacity);
            }
            uiOpacity.opacity = blockController.getIronOpacity255();
        }

        return {
            progressed: true,
            completed: blockController.state === BlockState.IRONED
        };
    }
}

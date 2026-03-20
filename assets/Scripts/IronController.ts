import { _decorator, Component, Node, EventTouch, Sprite, UITransform, Color } from 'cc';
import { GameManager } from './GameManager';
import { BlockController } from './BlockController';
const { ccclass, property } = _decorator;

@ccclass('IronController')
export class IronController extends Component {
    // 原始位置
    private originalPos: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 };

    // 拖动状态
    private isDragging: boolean = false;
    private dragOffset: { x: number, y: number } = { x: 0, y: 0 };

    // 拖动时圆形的 Y 轴偏移量（让圆形显示在手指上方）
    @property({ type: Number })
    dragOffsetY: number = 80;

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

    /**
     * 重置位置
     */
    public resetPosition(): void {
        this.node.setPosition(this.originalPos.x, this.originalPos.y, this.originalPos.z);
    }

    /**
     * 触摸开始
     */
    private onTouchStart(event: EventTouch) {
        this.isDragging = true;
        const pos = event.getUILocation();
        const nodePos = this.node.position;
        this.dragOffset = { x: pos.x - nodePos.x, y: pos.y - nodePos.y };
        console.log('Iron dragOffset:', this.dragOffset);
    }

    /**
     * 触摸移动
     */
    private onTouchMove(event: EventTouch) {
        if (!this.isDragging) return;

        const pos = event.getUILocation();
        const offsetX = 0;  // 熨斗暂时不需要横向偏移
        const offsetY = this.dragOffsetY;
        const newX = pos.x - this.dragOffset.x + offsetX;
        const newY = pos.y - this.dragOffset.y + offsetY;
        this.node.setPosition(newX, newY, 0);

        // 检测是否拖动到了某个 block 上（使用偏移后的位置）
        this.handleBlockAtPosition(pos.x + offsetX, pos.y + offsetY);
    }

    /**
     * 触摸结束
     */
    private onTouchEnd(_event: EventTouch) {
        this.isDragging = false;
        this.resetPosition();
    }

    /**
     * 处理指定位置的 block（当前 + 周围8个）
     */
    private handleBlockAtPosition(worldX: number, worldY: number): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager || !gameManager.levelMode.gridDrawer) return;

        const gridDrawer = gameManager.levelMode.gridDrawer;
        const blocks = gridDrawer.getAllBlocks();

        // 获取边界
        const bounds = gridDrawer.getContentBounds();
        if (!bounds) return;

        // 检查触摸点是否在边界内
        if (worldX < bounds.minX || worldX > bounds.maxX ||
            worldY < bounds.minY || worldY > bounds.maxY) {
            return;
        }

        // 查找当前的 block
        const currentBlock = this.findBlockAtPosition(blocks, worldX, worldY);
        if (!currentBlock) return;

        // 处理当前 block 和周围8个 block
        const currentRow = this.getBlockRow(currentBlock);
        const currentCol = this.getBlockCol(currentBlock);

        if (currentRow < 0 || currentCol < 0) return;

        // 定义周围8个方向的偏移
        const neighborOffsets = [
            { row: 0, col: 0 },   // 自身
            { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
            { row: 0, col: -1 },                       { row: 0, col: 1 },
            { row: 1, col: -1 },  { row: 1, col: 0 },  { row: 1, col: 1 }
        ];

        for (const offset of neighborOffsets) {
            const targetRow = currentRow + offset.row;
            const targetCol = currentCol + offset.col;

            if (targetRow >= 0 && targetRow < blocks.length &&
                targetCol >= 0 && targetCol < blocks[0].length) {
                const targetBlock = blocks[targetRow][targetCol];
                if (targetBlock) {
                    this.processBlock(targetBlock);
                }
            }
        }
    }

    /**
     * 处理单个 block：如果有上色的 circle，则隐藏 circle 并显示 block 的 sprite
     */
    private processBlock(block: Node): void {
        // 获取 BlockController 检查状态
        const blockController = block.getComponent(BlockController);
        if (!blockController) return;

        // 检查是否可以熨烫（只有 HAS_CIRCLE 状态可以熨烫）
        if (!blockController.canIron()) return;

        // 检查 circle 子节点
        const circleNode = block.getChildByName('circle');
        if (!circleNode) return;

        const circleSprite = circleNode.getComponent(Sprite);
        if (!circleSprite || !circleSprite.enabled) return;

        // 检查 circle 是否有颜色（上色了）
        const color = circleSprite.color;
        if (color.a === 0 || (color.r === 0 && color.g === 0 && color.b === 0)) {
            return; // 没有颜色，不处理
        }

        // 隐藏 circle 的 sprite
        circleSprite.enabled = false;

        // 显示 block 下的 sprite 组件
        const blockSprite = block.getComponent(Sprite);
        if (blockSprite) {
            // 使用当前颜色设置 block sprite
            blockSprite.color = new Color(
                blockController.currentColorR,
                blockController.currentColorG,
                blockController.currentColorB,
                blockController.currentColorA
            );
            blockSprite.enabled = true;

            // 设置 block 状态为已熨烫
            blockController.setIroned();
        }

        // 检查是否所有 block 都已熨烫
        const gameManager = GameManager.getInstance();
        if (gameManager) {
            gameManager.levelMode.checkAllBlocksIroned();
        }
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
}

import { _decorator, Component, Node, Sprite, Color, EventTouch, UITransform, Label, UIOpacity } from 'cc';
import { AudioManager } from './AudioManager';
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
    private readonly HOVER_DURATION: number = 500;   // hover 时长（毫秒）
    private readonly HOVER_DELAY: number = 300;        // 延迟开始计时（毫秒）
    private readonly POSITION_TOLERANCE: number = 20;  // 位置误差范围
    private readonly DRAG_OFFSET: number = 0;

    // circle 子节点
    private circleNode: Node | null = null;
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
                // 计时完成，触发变色，然后重置
                const count = this.highlightBlocksByIndex(this.targetBlockIndex, true);
                if (count > 0) {
                    GameManager.getInstance().levelMode?.onBlocksHighlighted(count);
                }
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
    public setCircleListNode(){
        // 获取 circle 子节点
        this.circleNode = this.node.getChildByName('circle');

        const pos = this.node.position;
        this.originalPos = { x: pos.x, y: pos.y, z: pos.z };

        // 保存原始 scale 和 rotation
        this.originalScale = { x: this.node.scale.x, y: this.node.scale.y, z: this.node.scale.z };
        this.originalRotation = { x: this.node.eulerAngles.x, y: this.node.eulerAngles.y, z: this.node.eulerAngles.z };

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
        this.updateProgress(0);
    }

    /**
     * 更新进度条
     */
    private updateProgress(progress: number): void {
        if (!this.circleNode) return;

        // 确保有 UIOpacity 组件
        let uiOpacity = this.circleNode.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = this.circleNode.addComponent(UIOpacity);
        }

        // opacity 从 0（进度0）到 255（进度1）
        uiOpacity.opacity = Math.round(progress * 255);
    }

    /**
     * 触摸开始
     */
    private onTouchStart(event: EventTouch) {
        if (!this.isGameActive()) return;

        AudioManager.instance.playEffect('circle');

        this.isDragging = true;

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
                // 换到了新的 block，重置计时
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
     * 获取单个 block 的颜色序号（从 number 子节点的 Label 读取）
     */
    private getBlockColorIndex(block: Node): string {
        const numNode = block.getChildByName('number');
        if (!numNode) return '';
        const label = numNode.getComponent(Label);
        return label?.string ?? '';
    }

    /**
     * 高亮/取消高亮目标 block 及所有序号相同的连通 block（洪水填充，带波纹扩散动画）
     * @returns 真正变化的高亮 block 数量（新增计+1，取消计-1）
     */
    private highlightBlocksByIndex(_blockIndex: number, highlight: boolean): number {
        const gameManager = GameManager.getInstance();

        if (!this.targetBlock) return 0;

        // 获取当前目标 block 的序号（不是镊子颜色，而是目标颜色序号）
        const targetColorIndex = this.getBlockColorIndex(this.targetBlock);
        if (!targetColorIndex) return 0; // 透明 block 没有序号

        // 从 GameManager 获取 GridDrawer
        const gridDrawer = gameManager.levelMode?.gridDrawer;
        if (!gridDrawer) return 0;

        const blocks = gridDrawer.getAllBlocks();
        if (!blocks || blocks.length === 0) return 0;

        // 重置空闲计时器
        GameManager.getInstance()?.levelMode.resetIdleFlashTimer();
        
        const rows = blocks.length;
        const columns = blocks[0]?.length ?? 0;

        // BFS 洪水填充，同时记录每个 block、层级和状态变化量
        const visited = new Set<string>();
        // { block, level, delta } 数组
        const levelMap: { block: Node; level: number; delta: number }[] = [];
        // 队列：[row, col, level]
        const queue: [number, number, number][] = [];

        const bc = this.targetBlock.getComponent(BlockController);
        if (!bc) return 0;
        const startRow = bc['_row'] as number;
        const startCol = bc['_col'] as number;

        queue.push([startRow, startCol, 0]);

        while (queue.length > 0) {
            const [row, col, level] = queue.shift()!;
            const key = `${row},${col}`;

            if (row < 0 || row >= rows || col < 0 || col >= columns) continue;
            if (visited.has(key)) continue;

            const block = blocks[row]?.[col];
            if (!block) continue;

            const blockController = block.getComponent(BlockController);
            if (!blockController || blockController.targetColorA === 0) continue;
            if (blockController.state === BlockState.IRONED) continue; // 已熨烫的跳过

            const blockColorIndex = this.getBlockColorIndex(block);
            if (blockColorIndex !== targetColorIndex) continue;

            visited.add(key);

            // 计算该 block 的 delta（只在高亮/取消时判断，跳过无状态变化的）
            let delta = 0;
            if (highlight) {
                if (blockController.state === BlockState.NO_CIRCLE) {
                    delta = 1; // 从无到有，计新增
                }
            } else {
                if (blockController.state === BlockState.HAS_CIRCLE) {
                    delta = -1; // 从有到无，计取消
                }
            }

            levelMap.push({ block, level, delta });

            // 8 个方向入队
            const dirs: [number, number][] = [
                [row - 1, col], [row + 1, col],
                [row, col - 1], [row, col + 1],
                [row - 1, col - 1], [row - 1, col + 1],
                [row + 1, col - 1], [row + 1, col + 1]
            ];
            for (const [r, c] of dirs) {
                if (!visited.has(`${r},${c}`)) {
                    queue.push([r, c, level + 1]);
                }
            }
        }

        // 统计总 delta
        const totalDelta = levelMap.reduce((sum, item) => sum + item.delta, 0);

        // 对单个 block 应用高亮/取消高亮（动画执行，不改变 delta）
        const applyHighlight = (block: Node) => {
            const blockController = block.getComponent(BlockController);
            const circleNode = block.getChildByName('circle');
            if (!circleNode) return;
            const sprite = circleNode.getComponent(Sprite);
            if (!sprite) return;

            if (highlight) {
                sprite.enabled = true;
                const circleSprite = this.circleNode.getComponent(Sprite);
                if (circleSprite && circleSprite.spriteFrame) {
                    sprite.spriteFrame = circleSprite.spriteFrame;
                }
                sprite.color = new Color(this._colorR, this._colorG, this._colorB, this._colorA);

                if (blockController) {
                    blockController.setCurrentColor(this._colorR, this._colorG, this._colorB, this._colorA);
                    blockController.state = BlockState.HAS_CIRCLE;
                }
            } else {
                sprite.enabled = false;
                if (blockController) {
                    blockController.state = BlockState.NO_CIRCLE;
                }
            }
        };

        // 按层顺序，层内并行，层间延迟扩散
        const delayPerLevel = 0.06; // 每层延迟 50ms
        const triggeredLevels = new Set<number>(); // 每层只触发一次音效

        for (const { block, level } of levelMap) {
            const delay = level * delayPerLevel;

            if (delay === 0) {
                applyHighlight(block);
                if (!triggeredLevels.has(0)) {
                    triggeredLevels.add(0);
                    AudioManager.instance.playEffect('boop');
                    gameManager.vibrateShort();
                }
            } else {
                setTimeout(() => {
                    applyHighlight(block);
                    if (!triggeredLevels.has(level)) {
                        triggeredLevels.add(level);
                        AudioManager.instance.playEffect('boop');
                        gameManager.vibrateShort();
                    }
                }, delay * 1000);
            }
        }

        // 返回总 delta（可能为负数）
        return totalDelta;
    }
}

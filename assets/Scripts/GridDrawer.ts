import { _decorator, Component, Sprite, Graphics, Color, Node, UITransform, Layers, EventTouch, input, Input, EventMouse, Label } from 'cc';
import { BlockCreator } from './BlockCreator';
import { BlockController, BlockState } from './BlockController';
import { GameManager } from './GameManager';
import { LevelConfig } from './LevelConfig';
const { ccclass, property } = _decorator;

@ccclass('GridDrawer')
export class GridDrawer extends Component {
    @property({ type: Color })
    lineColor: Color = new Color(0, 0, 0, 255);

    @property({ type: Boolean })
    showBorder: boolean = true;

    @property({ type: Number, min: 1, max: 3 })
    minScale: number = 1;

    @property({ type: Number, min: 1, max: 3 })
    maxScale: number = 3;

    @property({ type: Boolean })
    enableZoom: boolean = true;

    @property({ type: Boolean })
    showNumber: boolean = true;  // 是否显示颜色序号

    private outerLineWidth: number = 10;
    private innerLineWidth: number = 5;
    private outerGraphics: Graphics | null = null;
    private innerGraphics: Graphics | null = null;
    private contentNode: Node | null = null;
    private blockCreator: BlockCreator = new BlockCreator();
    private currentScale: number = 1;
    private lastTouchDistance: number = 0;
    private lastTouchPos: { x: number; y: number } | null = null;
    private contentOffset: { x: number; y: number } = { x: 0, y: 0 };

    // blocks 创建完成后的回调
    public onBlocksCreated: (() => void) | null = null;

    start() {
        this.setupMouseWheel();
    }

    onDestroy() {
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    }

    private setupMouseWheel() {
        input.on(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    }

    private onMouseWheel(event: EventMouse) {
        if (!this.enableZoom) return;

        if (event.getScrollY() > 0) {
            this.zoomIn();
        } else {
            this.zoomOut();
        }
    }

    enableZoomFeature() {
        if (!this.enableZoom) return;
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    private onTouchMove(event: EventTouch) {
        const touches = event.getTouches();

        // 双指缩放
        if (touches.length >= 2) {
            const touch1 = touches[0];
            const touch2 = touches[1];

            const pos1 = touch1.getUILocation();
            const pos2 = touch2.getUILocation();

            const dx = pos1.x - pos2.x;
            const dy = pos1.y - pos2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (this.lastTouchDistance > 0) {
                const scaleFactor = distance / this.lastTouchDistance;
                const newScale = this.currentScale * scaleFactor;

                this.setContentScale(newScale);
            }

            this.lastTouchDistance = distance;
            this.lastTouchPos = { x: (pos1.x + pos2.x) / 2, y: (pos1.y + pos2.y) / 2 };
        }
        // 单指移动（仅在 scale > 1 时允许）
        else if (touches.length === 1 && this.currentScale > 1) {
            const touch = touches[0];
            const pos = touch.getUILocation();

            if (this.lastTouchPos) {
                const deltaX = pos.x - this.lastTouchPos.x;
                const deltaY = pos.y - this.lastTouchPos.y;

                this.moveContent(deltaX, deltaY);
            }

            this.lastTouchPos = { x: pos.x, y: pos.y };
        }
    }

    private onTouchEnd(_event: EventTouch) {
        this.lastTouchDistance = 0;
        this.lastTouchPos = null;
    }

    /**
     * 限制内容偏移在边界内
     */
    private clampOffset(): void {
        if (!this.contentNode) return;

        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) return;

        const width = uiTransform.width;
        const height = uiTransform.height;
        const scaledWidth = width * this.currentScale;
        const scaledHeight = height * this.currentScale;

        // 计算可移动范围（只考虑超出部分）
        const maxOffsetX = Math.max(0, (scaledWidth - width) / 2);
        const maxOffsetY = Math.max(0, (scaledHeight - height) / 2);

        // 限制边界
        this.contentOffset.x = Math.max(-maxOffsetX, Math.min(maxOffsetX, this.contentOffset.x));
        this.contentOffset.y = Math.max(-maxOffsetY, Math.min(maxOffsetY, this.contentOffset.y));

        this.contentNode.setPosition(this.contentOffset.x, this.contentOffset.y, 0);
    }

    /**
     * 移动内容，并处理边界
     */
    private moveContent(deltaX: number, deltaY: number) {
        if (!this.contentNode) return;

        // 更新偏移
        this.contentOffset.x += deltaX;
        this.contentOffset.y += deltaY;

        // 限制边界
        this.clampOffset();
    }

    private setContentScale(scale: number) {
        const oldScale = this.currentScale;

        // 限制缩放范围（最小1，最大this.maxScale）
        scale = Math.max(1, Math.min(this.maxScale, scale));

        // 如果 scale 没有变化，不做任何处理
        if (Math.abs(scale - oldScale) < 0.001) return;

        if (this.contentNode) {
            this.contentNode.setScale(scale, scale, 1);

            const uiTransform = this.node.getComponent(UITransform);
            if (uiTransform) {
                const width = uiTransform.width;
                const height = uiTransform.height;

                // 计算新缩放下的最大偏移
                const maxOffsetX = Math.max(0, (width * scale - width) / 2);
                const maxOffsetY = Math.max(0, (height * scale - height) / 2);

                // 缩小（scale < oldScale）时，按比例调整偏移
                if (scale < oldScale) {
                    const scaleFactor = scale / oldScale;
                    this.contentOffset.x *= scaleFactor;
                    this.contentOffset.y *= scaleFactor;
                }

                // 限制边界
                this.contentOffset.x = Math.max(-maxOffsetX, Math.min(maxOffsetX, this.contentOffset.x));
                this.contentOffset.y = Math.max(-maxOffsetY, Math.min(maxOffsetY, this.contentOffset.y));
                this.contentNode.setPosition(this.contentOffset.x, this.contentOffset.y, 0);
            }
        }

        this.currentScale = scale;
    }

    /**
     * 清除所有内容（格线、blocks）
     */
    public clearContent(): void {
        // 清除所有子节点
        for (const child of this.node.children) {
            child.destroy();
        }
        this.outerGraphics = null;
        this.innerGraphics = null;
        this.contentNode = null;

        // 清除 blocks
        this.blockCreator.clearBlocks();
    }

    public createGraphicsNodes(callback?: () => void) {
        // 清除旧内容
        this.clearContent();

        const parentTransform = this.node.getComponent(UITransform);

        const outerNode = new Node('OuterBorder');
        this.node.addChild(outerNode);
        outerNode.layer = Layers.Enum.UI_2D;

        const outerTransform = outerNode.addComponent(UITransform);
        if (parentTransform) {
            outerTransform.setContentSize(parentTransform.width, parentTransform.height);
        }
        this.outerGraphics = outerNode.addComponent(Graphics);

        this.contentNode = new Node('GridContent');
        this.node.addChild(this.contentNode);
        this.contentNode.layer = Layers.Enum.UI_2D;
        this.contentNode.setSiblingIndex(1);

        let contentTransform = this.contentNode.addComponent(UITransform);
        if (parentTransform) {
            contentTransform.setContentSize(parentTransform.width, parentTransform.height);
        }

        const innerNode = new Node('InnerGrids');
        this.contentNode.addChild(innerNode);
        innerNode.layer = Layers.Enum.UI_2D;

        const innerTransform = innerNode.addComponent(UITransform);
        if (parentTransform) {
            innerTransform.setContentSize(parentTransform.width, parentTransform.height);
        }
        this.innerGraphics = innerNode.addComponent(Graphics);

        callback?.();
    }

    private updateContentSize() {
        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) return;

        const width = uiTransform.width;
        const height = uiTransform.height;

        if (this.contentNode) {
            let contentTransform = this.contentNode.getComponent(UITransform);
            if (!contentTransform) {
                contentTransform = this.contentNode.addComponent(UITransform);
            }
            contentTransform.setContentSize(width, height);
        }

        const children = this.node.children;
        for (const child of children) {
            if (child.name === 'OuterBorder') {
                let outerTransform = child.getComponent(UITransform);
                if (!outerTransform) {
                    outerTransform = child.addComponent(UITransform);
                }
                outerTransform.setContentSize(width, height);
                break;
            }
        }
    }

    public loadBlockPrefab(callback?: () => void) {
        // 从 LevelConfig 获取当前关卡的网格配置
        const levelConfig = LevelConfig.getInstance();
        const gridConfig = levelConfig.getCurrentGridConfig();
        const rows = gridConfig?.rows || 6;
        const columns = gridConfig?.columns || 6;

        this.drawAllGrids(rows, columns);

        const uiTransform = this.node.getComponent(UITransform);

        const cellWidth = uiTransform.width / columns;
        const cellHeight = uiTransform.height / rows;

        this.blockCreator.createBlocks(this.contentNode!, rows, columns, cellWidth, cellHeight);

        // 设置 BlocksContainer 在内边框下面
        const blocksContainer = this.blockCreator.getBlocksContainer();
        const innerNode = this.contentNode?.getChildByName('InnerGrids');
        if (blocksContainer && innerNode) {
            // 设置 BlocksContainer 在 innerNode 下面（更低的 siblingIndex）
            blocksContainer.setSiblingIndex(0);
        }

        this.enableZoomFeature();

        // 延迟一帧后再调用回调，确保 UI 更新
        this.scheduleOnce(() => {
            this.onBlocksCreated?.();
            callback?.();
        }, 0);
    }

    private drawAllGrids(rows: number, columns: number) {
        const sprite = this.getComponent(Sprite);
        const uiTransform = this.node.getComponent(UITransform);

        if (!sprite || !uiTransform) return;

        this.updateContentSize();

        const width = uiTransform.width;
        const height = uiTransform.height;
        if (width <= 0 || height <= 0) return;

        const cellWidth = width / columns;
        const cellHeight = height / rows;

        this.drawOuterBorder(width, height);
        this.drawInnerGrids(width, height, cellWidth, cellHeight, rows, columns);
    }

    private drawOuterBorder(width: number, height: number) {
        if (!this.outerGraphics || !this.showBorder) return;

        const halfW = width / 2;
        const halfH = height / 2;

        this.outerGraphics.clear();
        this.outerGraphics.lineWidth = this.outerLineWidth;
        this.outerGraphics.strokeColor = this.lineColor;
        this.outerGraphics.rect(-halfW, -halfH, width, height);
        this.outerGraphics.stroke();
    }

    private drawInnerGrids(width: number, height: number, cellWidth: number, cellHeight: number, rows: number, columns: number) {
        if (!this.innerGraphics) return;

        const halfW = width / 2;
        const halfH = height / 2;

        this.innerGraphics.clear();
        this.innerGraphics.lineWidth = this.innerLineWidth;
        this.innerGraphics.strokeColor = this.lineColor;

        for (let i = 1; i < columns; i++) {
            const x = -halfW + i * cellWidth;
            this.innerGraphics.moveTo(x, -halfH);
            this.innerGraphics.lineTo(x, halfH);
        }

        for (let j = 1; j < rows; j++) {
            const y = -halfH + j * cellHeight;
            this.innerGraphics.moveTo(-halfW, y);
            this.innerGraphics.lineTo(halfW, y);
        }

        this.innerGraphics.stroke();
    }

    updateGrid() {
        this.blockCreator.clearBlocks();
        this.loadBlockPrefab();
    }

    getBlock(row: number, col: number): Node | null {
        return this.blockCreator.getBlock(row, col);
    }

    getAllBlocks(): Node[][] {
        return this.blockCreator.getAllBlocks();
    }

    /**
     * 获取内容节点的边界（世界坐标）
     */
    getContentBounds(): { minX: number, maxX: number, minY: number, maxY: number } | null {
        if (!this.contentNode) return null;

        // 获取 Block_Board (this.node) 的世界坐标
        const boardWorldPos = this.node.getWorldPosition();
        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) return null;

        // Block_Board 的大小就是可视边界
        const width = uiTransform.width;
        const height = uiTransform.height;

        return {
            minX: boardWorldPos.x - width / 2,
            maxX: boardWorldPos.x + width / 2,
            minY: boardWorldPos.y - height / 2,
            maxY: boardWorldPos.y + height / 2
        };
    }

    /**
     * 根据颜色序号获取所有对应的 blocks
     */
    getBlocksByColorIndex(colorIndex: number): Node[] {
        const blocks = this.blockCreator.getAllBlocks();
        const result: Node[] = [];

        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;

                const blockController = block.getComponent(BlockController);
                if (!blockController) continue;

                // 过滤掉已经熨烫的 block
                if (blockController.state === BlockState.IRONED) {
                    continue;
                }

                // 检查这个 block 的颜色序号
                const numNode = block.getChildByName('number');
                if (numNode) {
                    const label = numNode.getComponent(Label);
                    if (label && label.string === colorIndex.toString()) {
                        result.push(block);
                    }
                }
            }
        }

        return result;
    }

    setScale(scale: number) {
        // 限制缩放范围（最小1，最大this.maxScale）
        scale = Math.max(1, Math.min(this.maxScale, scale));
        this.setContentScale(scale);
    }

    zoomIn() {
        this.setScale(this.currentScale * 1.2);
    }

    zoomOut() {
        this.setScale(this.currentScale / 1.2);
    }

    resetScale() {
        this.currentScale = 1;
        this.setContentScale(1);
    }

    getScale(): number {
        return this.currentScale;
    }

    /**
     * 统计所有 block 的颜色，给相同颜色分配序号，并在 number 子节点显示
     */
    /**
     * 重新统计颜色序号（供外部在应用图案后调用）
     */
    public refreshColorNumbers(): void {
        this.assignColorNumbers();
    }

    private assignColorNumbers(): void {
        const blocks = this.blockCreator.getAllBlocks();
        if (!blocks || blocks.length === 0) return;

        // 颜色到序号的映射
        const colorMap = new Map<string, number>();
        // 存储每个位置的序号
        const numberMap: number[][] = [];

        let colorIndex = 1;

        // 遍历所有 blocks，统计颜色
        for (let row = 0; row < blocks.length; row++) {
            numberMap[row] = [];
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;

                // 通过 BlockController 获取目标颜色
                const blockController = block.getComponent(BlockController);
                if (!blockController) continue;

                const colorR = blockController.targetColorR;
                const colorG = blockController.targetColorG;
                const colorB = blockController.targetColorB;
                const colorA = blockController.targetColorA;

                // 使用 rgba 作为颜色 key（忽略透明度为0的）
                if (colorA === 0) {
                    numberMap[row][col] = 0; // 透明块不显示序号
                    continue;
                }

                const colorKey = `${colorR},${colorG},${colorB}`;

                // 如果这个颜色还没有序号，分配一个新序号
                if (!colorMap.has(colorKey)) {
                    colorMap.set(colorKey, colorIndex++);
                }

                // 记录该位置的序号
                numberMap[row][col] = colorMap.get(colorKey)!;
            }
        }

        // 遍历所有 blocks，设置 number 子节点的 Label
        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;

                const numberNode = block.getChildByName('number');
                if (!numberNode) continue;

                const label = numberNode.getComponent(Label);
                if (!label) continue;

                const num = numberMap[row][col];
                if (num > 0) {
                    label.string = num.toString();
                } else {
                    label.string = '';
                }
            }
        }

        console.log(`颜色统计完成：共 ${colorMap.size} 种颜色`);

        // 保存颜色列表到 GameManager
        const colorList: { r: number; g: number; b: number; a: number }[] = [];
        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;

                const blockController = block.getComponent(BlockController);
                if (!blockController) continue;

                const a = blockController.targetColorA;
                if (a === 0) continue; // 跳过透明

                const r = blockController.targetColorR;
                const g = blockController.targetColorG;
                const b = blockController.targetColorB;
                const colorKey = `${r},${g},${b}`;

                // 检查是否已添加到列表
                const existingIndex = colorList.findIndex(c => `${c.r},${c.g},${c.b}` === colorKey);
                if (existingIndex === -1) {
                    colorList.push({ r, g, b, a });
                }
            }
        }

        // 保存到 GameManager
        const gameManager = GameManager.getInstance();
        if (gameManager) {
            gameManager.levelMode.setColorList(colorList);
        }
    }
}

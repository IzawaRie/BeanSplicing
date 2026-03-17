import { _decorator, Component, Sprite, Graphics, Color, Node, UITransform, Layers, EventTouch, input, Input, EventMouse } from 'cc';
import { BlockCreator } from './BlockCreator';
const { ccclass, property } = _decorator;

@ccclass('GridDrawer')
export class GridDrawer extends Component {
    @property({ type: Number, min: 1, max: 20 })
    rows: number = 6;

    @property({ type: Number, min: 1, max: 20 })
    columns: number = 6;

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

    private outerLineWidth: number = 10;
    private innerLineWidth: number = 5;
    private outerGraphics: Graphics | null = null;
    private innerGraphics: Graphics | null = null;
    private contentNode: Node | null = null;
    private blockCreator: BlockCreator = new BlockCreator();
    private currentScale: number = 1;
    private lastTouchDistance: number = 0;

    onLoad() {
        this.createGraphicsNodes();
    }

    start() {
        this.loadBlockPrefab();
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
        if (touches.length < 2) return;

        const touch1 = touches[0];
        const touch2 = touches[1];

        const pos1 = touch1.getUILocation();
        const pos2 = touch2.getUILocation();

        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (this.lastTouchDistance > 0) {
            const scaleFactor = distance / this.lastTouchDistance;
            let newScale = this.currentScale * scaleFactor;

            newScale = Math.max(this.minScale, Math.min(this.maxScale, newScale));

            this.setContentScale(newScale);
        }

        this.lastTouchDistance = distance;
    }

    private onTouchEnd(_event: EventTouch) {
        this.lastTouchDistance = 0;
    }

    private setContentScale(scale: number) {
        scale = Math.max(1, scale);
        this.currentScale = scale;
        if (this.contentNode) {
            this.contentNode.setScale(scale, scale, 1);
        }
    }

    private createGraphicsNodes() {
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

    private loadBlockPrefab() {
        this.updateContentSize();
        this.drawAllGrids();

        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) return;

        const cellWidth = uiTransform.width / this.columns;
        const cellHeight = uiTransform.height / this.rows;

        this.blockCreator.createBlocks(this.contentNode!, this.rows, this.columns, cellWidth, cellHeight);

        this.scheduleOnce(() => {
            this.enableZoomFeature();
        }, 0.1);
    }

    private drawAllGrids() {
        const sprite = this.getComponent(Sprite);
        const uiTransform = this.node.getComponent(UITransform);

        if (!sprite || !uiTransform) return;

        this.updateContentSize();

        const width = uiTransform.width;
        const height = uiTransform.height;
        if (width <= 0 || height <= 0) return;

        const cellWidth = width / this.columns;
        const cellHeight = height / this.rows;

        this.drawOuterBorder(width, height);
        this.drawInnerGrids(width, height, cellWidth, cellHeight);
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

    private drawInnerGrids(width: number, height: number, cellWidth: number, cellHeight: number) {
        if (!this.innerGraphics) return;

        const halfW = width / 2;
        const halfH = height / 2;

        this.innerGraphics.clear();
        this.innerGraphics.lineWidth = this.innerLineWidth;
        this.innerGraphics.strokeColor = this.lineColor;

        for (let i = 1; i < this.columns; i++) {
            const x = -halfW + i * cellWidth;
            this.innerGraphics.moveTo(x, -halfH);
            this.innerGraphics.lineTo(x, halfH);
        }

        for (let j = 1; j < this.rows; j++) {
            const y = -halfH + j * cellHeight;
            this.innerGraphics.moveTo(-halfW, y);
            this.innerGraphics.lineTo(halfW, y);
        }

        this.innerGraphics.stroke();
    }

    updateGrid(rows: number, columns: number) {
        this.rows = rows;
        this.columns = columns;

        this.blockCreator.clearBlocks();
        this.loadBlockPrefab();
    }

    getBlock(row: number, col: number): Node | null {
        return this.blockCreator.getBlock(row, col);
    }

    setScale(scale: number) {
        scale = Math.max(this.minScale, Math.min(this.maxScale, scale));
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
}

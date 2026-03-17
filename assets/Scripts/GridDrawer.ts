import { _decorator, Component, Sprite, Graphics, Color, Node, UITransform, Layers } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GridDrawer')
export class GridDrawer extends Component {
    @property({ type: Number, min: 1, max: 20 })
    rows: number = 3;

    @property({ type: Number, min: 1, max: 20 })
    columns: number = 3;

    @property({ type: Color })
    lineColor: Color = new Color(0, 0, 0, 255);

    @property({ type: Boolean })
    showBorder: boolean = true;

    private lineWidth: number = 10;
    private graphics: Graphics | null = null;
    private gridNode: Node | null = null;

    onLoad() {
        this.createGridNode();
    }

    start() {
        this.updateGridNodeSize();
        this.drawGrid();
    }

    private createGridNode() {
        this.gridNode = new Node('GridGraphics');
        this.node.addChild(this.gridNode);
        this.gridNode.layer = Layers.Enum.UI_2D;
        this.gridNode.setSiblingIndex(this.node.children.length - 1);

        const gridTransform = this.gridNode.addComponent(UITransform);
        const parentTransform = this.node.getComponent(UITransform);
        if (parentTransform) {
            gridTransform.setContentSize(parentTransform.width, parentTransform.height);
        }

        this.graphics = this.gridNode.addComponent(Graphics);
    }

    private updateGridNodeSize() {
        if (!this.gridNode) return;

        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) return;

        let gridTransform = this.gridNode.getComponent(UITransform);
        if (!gridTransform) {
            gridTransform = this.gridNode.addComponent(UITransform);
        }
        gridTransform.setContentSize(uiTransform.width, uiTransform.height);
    }

    private drawGrid() {
        const sprite = this.getComponent(Sprite);
        const uiTransform = this.node.getComponent(UITransform);

        if (!this.graphics || !sprite || !uiTransform) return;

        this.updateGridNodeSize();

        const width = uiTransform.width;
        const height = uiTransform.height;
        if (width <= 0 || height <= 0) return;

        this.graphics.clear();
        this.graphics.lineWidth = this.lineWidth;
        this.graphics.strokeColor = this.lineColor;

        const cellWidth = width / this.columns;
        const cellHeight = height / this.rows;

        this.drawGridLines(width, height, cellWidth, cellHeight);
    }

    private drawGridLines(width: number, height: number, cellWidth: number, cellHeight: number) {
        if (!this.graphics) return;

        const halfW = width / 2;
        const halfH = height / 2;

        if (this.showBorder) {
            this.graphics.rect(-halfW, -halfH, width, height);
        }

        for (let i = 1; i < this.columns; i++) {
            const x = -halfW + i * cellWidth;
            this.graphics.moveTo(x, -halfH);
            this.graphics.lineTo(x, halfH);
        }

        for (let j = 1; j < this.rows; j++) {
            const y = -halfH + j * cellHeight;
            this.graphics.moveTo(-halfW, y);
            this.graphics.lineTo(halfW, y);
        }

        this.graphics.stroke();
    }

    updateGrid(rows: number, columns: number) {
        this.rows = rows;
        this.columns = columns;
        this.drawGrid();
    }
}

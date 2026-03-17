import { _decorator, Component, Sprite, Graphics, Color, Node, UITransform, Layers } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GridDrawer')
export class GridDrawer extends Component {
    @property({ type: Number, min: 1, max: 20 })
    rows: number = 3; // 行数

    @property({ type: Number, min: 1, max: 20 })
    columns: number = 3; // 列数

    @property({ type: Number, min: 1, max: 10 })
    lineWidth: number = 2; // 线条宽度

    @property({ type: Color })
    lineColor: Color = new Color(0, 0, 0, 255); // 线条颜色，黑色

    @property({ type: Boolean })
    showBorder: boolean = true; // 是否显示外围边框

    private graphics: Graphics | null = null;
    private gridNode: Node | null = null;

    onLoad() {
        this.createGridNode();
    }

    start() {
        // 确保网格节点大小正确后再绘制
        this.updateGridNodeSize();
        this.drawGrid();
    }

    createGridNode() {
        // 创建网格节点
        this.gridNode = new Node('GridGraphics');
        this.node.addChild(this.gridNode);

        // 设置layer
        this.gridNode.layer = Layers.Enum.UI_2D;

        // 设置zIndex，确保网格绘制在Sprite之上
        this.gridNode.setSiblingIndex(this.node.children.length - 1);

        // 添加UITransform组件（确保网格节点有正确的大小）
        const gridTransform = this.gridNode.addComponent(UITransform);
        const parentTransform = this.node.getComponent(UITransform);
        if (parentTransform) {
            gridTransform.setContentSize(parentTransform.width, parentTransform.height);
        }

        // 添加Graphics组件
        this.graphics = this.gridNode.addComponent(Graphics);
    }

    updateGridNodeSize() {
        if (!this.gridNode) return;

        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) return;

        // 获取或添加网格节点的UITransform
        let gridTransform = this.gridNode.getComponent(UITransform);
        if (!gridTransform) {
            gridTransform = this.gridNode.addComponent(UITransform);
        }

        // 确保网格节点与父节点大小一致
        gridTransform.setContentSize(uiTransform.width, uiTransform.height);
    }

    drawGrid() {
        if (!this.graphics) {
            console.error('Graphics组件未初始化');
            return;
        }

        // 获取Sprite的尺寸
        const sprite = this.getComponent(Sprite);
        if (!sprite) {
            console.error('GridDrawer需要与Sprite组件在同一节点上');
            return;
        }

        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) {
            console.error('节点缺少UITransform组件');
            return;
        }

        // 确保网格节点大小正确
        this.updateGridNodeSize();

        const width = uiTransform.width;
        const height = uiTransform.height;

        if (width <= 0 || height <= 0) {
            console.warn('Sprite尺寸无效，无法绘制网格');
            return;
        }

        // 清除之前的绘制
        this.graphics.clear();

        // 设置线条样式
        this.graphics.lineWidth = this.lineWidth;
        this.graphics.strokeColor = this.lineColor;

        // 计算每个格子的尺寸
        const cellWidth = width / this.columns;
        const cellHeight = height / this.rows;

        // 绘制网格
        this.drawGridLines(width, height, cellWidth, cellHeight);
    }

    private drawGridLines(width: number, height: number, cellWidth: number, cellHeight: number) {
        if (!this.graphics) return;

        // 计算绘制的起始位置（左下角）
        const startX = -width / 2;
        const startY = -height / 2;
        const endX = width / 2;
        const endY = height / 2;

        // 绘制外围边框
        if (this.showBorder) {
            this.graphics.rect(startX, startY, width, height);
        }

        // 绘制垂直线
        for (let i = 1; i < this.columns; i++) {
            const x = startX + i * cellWidth;
            this.graphics.moveTo(x, startY);
            this.graphics.lineTo(x, endY);
        }

        // 绘制水平线
        for (let j = 1; j < this.rows; j++) {
            const y = startY + j * cellHeight;
            this.graphics.moveTo(startX, y);
            this.graphics.lineTo(endX, y);
        }

        // 执行绘制（一次性画出所有线条）
        this.graphics.stroke();
    }

    // 更新网格行列数的公共方法
    updateGrid(rows: number, columns: number) {
        this.rows = rows;
        this.columns = columns;
        this.drawGrid();
    }

    // 更新所有参数的公共方法
    updateGridConfig(rows: number, columns: number, lineWidth?: number, lineColor?: Color, showBorder?: boolean) {
        this.rows = rows;
        this.columns = columns;
        if (lineWidth !== undefined) this.lineWidth = lineWidth;
        if (lineColor !== undefined) this.lineColor = lineColor;
        if (showBorder !== undefined) this.showBorder = showBorder;
        this.drawGrid();
    }
}
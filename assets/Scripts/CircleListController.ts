import { _decorator, Component, Node, Sprite, Color, resources, Prefab, instantiate, UITransform } from 'cc';
import { CircleController } from './CircleController';
const { ccclass, property } = _decorator;

/**
 * 颜色列表控制器
 * 管理显示颜色选择的节点列表
 */
@ccclass('CircleListController')
export class CircleListController extends Component {
    @property(Node)
    neizi_nodes: Node[] = [];
    @property(Node)
    item_nodes: Node = null;

    public colorNodes: Node[] = [];

    private boxItemPrefab: Prefab | null = null;
    private readonly MAX_ITEMS_PER_COLOR = 7;

    /**
     * 隐藏所有颜色节点
     */
    private hideAllNodes() {
        for (const node of this.colorNodes) {
            if (node) {
                node.active = false;
            }
        }
    }

    /**
     * 加载所有颜色节点
     */
    public setAllNodes() {
        this.colorNodes = this.neizi_nodes;
        for(let i = 0; i < this.colorNodes.length; i++){
            const circle = this.colorNodes[i];
            const circleController = circle.getComponent(CircleController);
            circleController.setCircleListNode();
        }
    }

    /**
     * 更新颜色列表
     * @param colors 颜色列表 [{ r, g, b, a }]
     * @param colorCounts 每个颜色序号的 block 数量（颜色序号从1开始）
     */
    public updateColorList(
        colors: { r: number, g: number, b: number, a: number }[],
        colorCounts?: Map<number, { count: number, r: number, g: number, b: number, a: number }>
    ): void {
        // 打乱颜色顺序（Fisher-Yates 洗牌）
        const shuffled = [...colors];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // 隐藏所有节点
        this.hideAllNodes();

        // 显示对应数量的节点并设置颜色
        const count = Math.min(shuffled.length, this.colorNodes.length);
        for (let i = 0; i < count; i++) {
            const node = this.colorNodes[i];
            if (node) {
                node.active = true;
                // 通过 CircleController 设置颜色
                const circleController = node.getComponent(CircleController);
                if (circleController) {
                    // 序号从1开始
                    circleController.setColor(shuffled[i].r, shuffled[i].g, shuffled[i].b, shuffled[i].a, i + 1);
                }
            }
        }

        console.log(`CircleListController 更新: 显示 ${count} 个颜色`);

        // 根据 block 数量生成 box_item 到 item_nodes
        if (colorCounts) {
            this.loadBoxItemPrefab(() => {
                this.generateItemNodes(colorCounts!, colors);
            });
        }
    }

    /**
     * 加载 box_item 预制体
     */
    private loadBoxItemPrefab(callback: () => void): void {
        if (this.boxItemPrefab) {
            callback();
            return;
        }

        resources.load('box_item', Prefab, (err, prefab) => {
            if (err) {
                console.error('加载 box_item 预制体失败:', err);
                return;
            }
            this.boxItemPrefab = prefab as Prefab;
            console.log('box_item 预制体加载成功');
            callback();
        });
    }

    /**
     * 根据颜色数量生成 box_item 实例到 item_nodes 节点下
     * @param colorCounts 颜色序号(1-based) -> { count, r, g, b, a }
     * @param colors 颜色列表（shuffled 后的，index 0 对应序号1）
     */
    private generateItemNodes(
        colorCounts: Map<number, { count: number, r: number, g: number, b: number, a: number }>,
        colors: { r: number, g: number, b: number, a: number }[]
    ): void {
        if (!this.item_nodes || !this.boxItemPrefab) return;

        // 清除旧的 box_item
        for (const child of this.item_nodes.children) {
            child.destroy();
        }

        // 获取 item_nodes 的长宽
        const uiTransform = this.item_nodes.getComponent(UITransform);
        if (!uiTransform) return;
        const containerW = uiTransform.width;
        const containerH = uiTransform.height;

        // 创建临时节点获取 box_item 的尺寸
        const itemW = 50;
        const itemH = 50;

        // 计算每列可容纳的数量（留一点间隙）
        const spacingH = itemH * 0.1 * -1;
        const itemsPerCol = Math.floor(containerH / (itemH + spacingH));
        // 计算可分多少列
        const spacingW = itemW * 0.1 * -1;
        const colsCount = Math.floor(containerW / (itemW + spacingW));

        // 将所有颜色混合打乱，均匀分布到每个格子
        interface ItemEntry { colorNum: number; color: { r: number, g: number, b: number, a: number } }
        const allItems: ItemEntry[] = [];

        for (const colorNum of colorCounts.keys()) {
            const data = colorCounts.get(colorNum)!;
            const colorIndex = colorNum - 1;
            const color = colors[colorIndex];
            if (!color) continue;
            // 过滤白色（RGB >= 250 视为白色）
            if (color.r >= 230 && color.g >= 230 && color.b >= 230) continue;
            const itemCount = Math.min(data.count, this.MAX_ITEMS_PER_COLOR);
            for (let i = 0; i < itemCount; i++) {
                allItems.push({ colorNum, color });
            }
        }

        // // Fisher-Yates 洗牌打乱顺序
        // for (let i = allItems.length - 1; i > 0; i--) {
        //     const j = Math.floor(Math.random() * (i + 1));
        //     [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
        // }

        // 遍历所有格子位置，从底部开始向上填
        let itemIndex = 0;
        for (let row = 0; row < itemsPerCol && itemIndex < allItems.length; row++) {
            // 当前行的 Y 位置（从底部向上，row 0 在底部）
            const baseY = -containerH / 2 + itemH / 2 + row * (itemH + spacingH);

            for (let col = 0; col < colsCount && itemIndex < allItems.length; col++) {
                const entry = allItems[itemIndex++];

                const item = instantiate(this.boxItemPrefab);
                this.item_nodes.addChild(item);

                // 设置颜色
                const sprite = item.getComponent(Sprite);
                if (sprite) {
                    sprite.color = new Color(entry.color.r, entry.color.g, entry.color.b, entry.color.a);
                }

                // 位置：Y 跟随行，X 从左到右
                const posX = -containerW / 2 + itemW / 2 + col * (itemW + spacingW) + (Math.random() - 0.5) * spacingW * 0.5;
                const posY = baseY + (Math.random() - 0.5) * spacingH * 0.3;
                item.setPosition(posX, posY, 0);

                // 随机轻微旋转（-15° ~ 15°）
                const rotZ = (Math.random() - 0.5) * 30;
                item.setRotationFromEuler(0, 0, rotZ);
            }
        }

        console.log(`box_item 生成完成，共 ${itemIndex} 个`);
    }
}

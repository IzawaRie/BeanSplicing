import { _decorator, Component, Node, Sprite, Color } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 颜色列表控制器
 * 管理显示颜色选择的节点列表
 */
@ccclass('CircleListController')
export class CircleListController extends Component {
    colorNodes: Node[] = [];

    onLoad() {
        this.colorNodes = this.node.children;
        // 初始化时隐藏所有节点
        this.hideAllNodes();
    }

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
     * 更新颜色列表
     * @param colors 颜色列表 [{ r, g, b, a }]
     */
    public updateColorList(colors: { r: number; g: number; b: number; a: number }[]): void {
        // 隐藏所有节点
        this.hideAllNodes();

        // 显示对应数量的节点并设置颜色
        const count = Math.min(colors.length, this.colorNodes.length);
        for (let i = 0; i < count; i++) {
            const node = this.colorNodes[i];
            if (node) {
                node.active = true;

                // 获取 Sprite 组件并设置颜色
                const sprite = node.getComponent(Sprite);
                if (sprite) {
                    sprite.color = new Color(colors[i].r, colors[i].g, colors[i].b, colors[i].a);
                }
            }
        }

        console.log(`CircleListController 更新: 显示 ${count} 个颜色`);
    }
}

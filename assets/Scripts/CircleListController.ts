import { _decorator, Component, Node } from 'cc';
import { CircleController } from './CircleController';
const { ccclass, property } = _decorator;

/**
 * 颜色列表控制器
 * 管理显示颜色选择的节点列表
 */
@ccclass('CircleListController')
export class CircleListController extends Component {
    @property(Node)
    niezi_parent: Node = null;

    public colorNodes: Node[] = [];

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
        this.colorNodes = this.niezi_parent.children;
        for(let i = 0; i < this.colorNodes.length; i++){
            const circle = this.colorNodes[i];
            const circleController = circle.getComponent(CircleController);
            circleController.setCircleListNode();
        }
    }

    /**
     * 更新颜色列表
     * @param colors 颜色列表 [{ r, g, b, a }]
     */
    public updateColorList(colors: { r: number, g: number, b: number, a: number }[]): void {
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
    }
}

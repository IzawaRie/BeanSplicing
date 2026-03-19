import { _decorator, Component, Node, Sprite, Color, EventTouch } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 颜色列表控制器
 * 管理显示颜色选择的节点列表
 */
@ccclass('CircleListController')
export class CircleListController extends Component {
    colorNodes: Node[] = [];

    // 记录每个节点的原始位置
    private originalPositions: Map<Node, { x: number, y: number, z: number }> = new Map();

    // 记录每个节点的拖动状态
    private dragData: Map<Node, { startPos: { x: number, y: number }, offset: { x: number, y: number } }> = new Map();

    onLoad() {
        this.colorNodes = this.node.children;
        // 初始化时隐藏所有节点
        this.hideAllNodes();
    }

    onDestroy() {
        // 移除所有事件监听
        for (const node of this.colorNodes) {
            if (node) {
                node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
                node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
                node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
                node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
            }
        }
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
        // 移除旧的事件监听
        for (const node of this.colorNodes) {
            if (node) {
                node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
                node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
                node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
                node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
            }
        }

        // 隐藏所有节点
        this.hideAllNodes();

        // 显示对应数量的节点并设置颜色
        const count = Math.min(colors.length, this.colorNodes.length);
        for (let i = 0; i < count; i++) {
            const node = this.colorNodes[i];
            if (node) {
                node.active = true;

                // 保存原始位置
                const pos = node.position;
                this.originalPositions.set(node, { x: pos.x, y: pos.y, z: pos.z });

                // 获取 Sprite 组件并设置颜色
                const sprite = node.getComponent(Sprite);
                if (sprite) {
                    sprite.color = new Color(colors[i].r, colors[i].g, colors[i].b, colors[i].a);
                }

                // 添加触摸事件监听
                node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
                node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
                node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
                node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
            }
        }

        console.log(`CircleListController 更新: 显示 ${count} 个颜色`);
    }

    /**
     * 触摸开始
     */
    private onTouchStart(event: EventTouch) {
        const node = event.target as Node;
        const pos = event.getUILocation();

        // 记录起始位置
        const nodePos = node.position;
        this.dragData.set(node, {
            startPos: { x: nodePos.x, y: nodePos.y },
            offset: { x: pos.x - nodePos.x, y: pos.y - nodePos.y }
        });
    }

    /**
     * 触摸移动
     */
    private onTouchMove(event: EventTouch) {
        const node = event.target as Node;
        const data = this.dragData.get(node);
        if (!data) return;

        const pos = event.getUILocation();

        // 更新节点位置
        const newX = pos.x - data.offset.x;
        const newY = pos.y - data.offset.y;
        node.setPosition(newX, newY, 0);
    }

    /**
     * 触摸结束
     */
    private onTouchEnd(event: EventTouch) {
        const node = event.target as Node;

        // 恢复到原始位置
        const originalPos = this.originalPositions.get(node);
        if (originalPos) {
            node.setPosition(originalPos.x, originalPos.y, originalPos.z);
        }

        this.dragData.delete(node);
    }
}

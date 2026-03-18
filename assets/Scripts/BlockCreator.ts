import { Node, UITransform, instantiate, Prefab, resources } from 'cc';
import { BlockController } from './BlockController';

export class BlockCreator {
    private blocks: Node[][] = [];
    private blocksContainer: Node | null = null;

    /**
     * 创建网格中的所有 block 节点
     */
    createBlocks(parent: Node, rows: number, columns: number, cellWidth: number, cellHeight: number, prefabPath: string = 'block'): void {
        // 创建容器节点
        this.blocksContainer = new Node('BlocksContainer');
        parent.addChild(this.blocksContainer);

        resources.load(prefabPath, Prefab, (err, prefab) => {
            if (err) {
                console.error('加载block预制体失败:', err);
                return;
            }

            this.doCreateBlocks(parent, rows, columns, cellWidth, cellHeight, prefab);
        });
    }

    private doCreateBlocks(parent: Node, rows: number, columns: number, cellWidth: number, cellHeight: number, prefab: Prefab) {
        const parentTransform = parent.getComponent(UITransform);
        if (!parentTransform) return;

        const width = parentTransform.width;
        const height = parentTransform.height;
        const halfW = width / 2;
        const halfH = height / 2;

        this.blocks = [];

        for (let row = 0; row < rows; row++) {
            this.blocks[row] = [];
            for (let col = 0; col < columns; col++) {
                const block = instantiate(prefab);
                this.blocksContainer!.addChild(block);

                const blockTransform = block.getComponent(UITransform);
                if (blockTransform) {
                    blockTransform.setContentSize(cellWidth, cellHeight);

                    // 查找 circle 子节点并设置同样大小
                    const circleNode = block.getChildByName('circle');
                    if (circleNode) {
                        const circleTransform = circleNode.getComponent(UITransform);
                        if (circleTransform) {
                            circleTransform.setContentSize(cellWidth * 0.8, cellHeight * 0.8);
                        }
                    }
                }

                const x = -halfW + col * cellWidth + cellWidth / 2;
                const y = halfH - row * cellHeight - cellHeight / 2;
                block.setPosition(x, y, 0);

                // 设置行列信息到 BlockController
                const blockController = block.getComponent(BlockController);
                if (blockController) {
                    blockController.setPosition(row, col);
                }

                this.blocks[row][col] = block;
            }
        }
    }

    /**
     * 清除所有 block 节点
     */
    clearBlocks(): void {
        if (this.blocksContainer) {
            this.blocksContainer.destroy();
            this.blocksContainer = null;
        }
        this.blocks = [];
    }

    /**
     * 获取 blocks 容器节点（用于缩放）
     */
    getBlocksContainer(): Node | null {
        return this.blocksContainer;
    }

    /**
     * 获取指定位置的 block 节点
     */
    getBlock(row: number, col: number): Node | null {
        return this.blocks[row]?.[col] || null;
    }

    /**
     * 获取所有 block 节点
     */
    getAllBlocks(): Node[][] {
        return this.blocks;
    }
}

import { Node, UITransform, instantiate, Prefab, resources } from 'cc';

export class BlockCreator {
    private blocks: Node[][] = [];

    /**
     * 创建网格中的所有 block 节点
     */
    createBlocks(parent: Node, rows: number, columns: number, cellWidth: number, cellHeight: number, prefabPath: string = 'block'): void {
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
                parent.addChild(block);

                const blockTransform = block.getComponent(UITransform);
                if (blockTransform) {
                    blockTransform.setContentSize(cellWidth, cellHeight);
                }

                const x = -halfW + col * cellWidth + cellWidth / 2;
                const y = halfH - row * cellHeight - cellHeight / 2;
                block.setPosition(x, y, 0);

                this.blocks[row][col] = block;
            }
        }
    }

    /**
     * 清除所有 block 节点
     */
    clearBlocks(): void {
        for (let row = 0; row < this.blocks.length; row++) {
            for (let col = 0; col < this.blocks[row].length; col++) {
                if (this.blocks[row][col]) {
                    this.blocks[row][col].destroy();
                }
            }
        }
        this.blocks = [];
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

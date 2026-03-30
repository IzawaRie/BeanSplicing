import { Node, UITransform, instantiate, Prefab, resources, JsonAsset } from 'cc';
import { BlockController } from './BlockController';

interface PixelBlock {
    r: number;
    g: number;
    b: number;
    a: number;
}

export class BlockCreator {
    private blocks: Node[][] = [];
    private blocksContainer: Node | null = null;

    /**
     * 创建网格中的 block 节点
     * @param parent 父节点
     * @param rows 总行数（用于初始化 blocks 数组）
     * @param columns 总列数（用于初始化 blocks 数组）
     * @param cellWidth 单格宽度
     * @param cellHeight 单格高度
     * @param prefabPath 预制体路径
     * @param patternPath 可选，传入则只创建 alpha > 0 的 block
     * @param callback 创建完成回调
     */
    createBlocks(parent: Node, rows: number, columns: number, cellWidth: number, cellHeight: number, prefabPath: string = 'block', patternPath?: string, callback?: () => void): void {
        // 创建容器节点
        this.blocksContainer = new Node('BlocksContainer');
        parent.addChild(this.blocksContainer);

        resources.load(prefabPath, Prefab, (err, prefab) => {
            if (err) {
                console.error('加载block预制体失败:', err);
                return;
            }

            if (patternPath) {
                // 有 patternPath，只创建有效的 block
                resources.load(patternPath, JsonAsset, (err2, jsonAsset) => {
                    if (err2 || !jsonAsset) {
                        console.error('加载 pattern JSON 失败:', err2);
                        this.doCreateBlocks(parent, rows, columns, cellWidth, cellHeight, prefab as Prefab);
                    } else {
                        const data = (jsonAsset as JsonAsset).json as { gridWidth: number; gridHeight: number; blocks: PixelBlock[] };
                        const validPositions = new Set<string>();
                        for (let i = 0; i < data.blocks.length; i++) {
                            if (data.blocks[i].a > 0) {
                                const row = Math.floor(i / data.gridWidth);
                                const col = i % data.gridWidth;
                                validPositions.add(`${row},${col}`);
                            }
                        }
                        this.doCreateBlocks(parent, rows, columns, cellWidth, cellHeight, prefab as Prefab, validPositions);
                    }
                    callback?.();
                });
            } else {
                // 无 patternPath，创建所有 block
                this.doCreateBlocks(parent, rows, columns, cellWidth, cellHeight, prefab as Prefab);
                callback?.();
            }
        });
    }

    private doCreateBlocks(parent: Node, rows: number, columns: number, cellWidth: number, cellHeight: number, prefab: Prefab, validPositions?: Set<string>) {
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
                // 如果有 validPositions，跳过无效位置
                if (validPositions && !validPositions.has(`${row},${col}`)) {
                    this.blocks[row][col] = null;
                    continue;
                }

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

                    // 设置 block_sp 子节点大小
                    const blockSp = block.getChildByName('block_sp');
                    if (blockSp) {
                        const blockSpTransform = blockSp.getComponent(UITransform);
                        if (blockSpTransform) {
                            blockSpTransform.setContentSize(cellWidth, cellHeight);
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

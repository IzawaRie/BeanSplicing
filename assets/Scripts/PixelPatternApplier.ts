import { _decorator, Component, Node, Sprite, Color, resources, JsonAsset } from 'cc';
import { GridDrawer } from './GridDrawer';
import { BlockController } from './BlockController';
const { ccclass } = _decorator;

/**
 * 像素图案数据接口
 */
export interface PixelBlock {
    r: number;
    g: number;
    b: number;
    a: number;
}

export interface PixelPatternJson {
    name: string;
    gridWidth: number;
    gridHeight: number;
    blocks: PixelBlock[];
}

/**
 * 像素图案应用器
 * 从 JSON 加载像素数据并应用到 Block 网格
 */
@ccclass('PixelPatternApplier')
export class PixelPatternApplier extends Component {
    public gridDrawer: GridDrawer = null;

    /**
     * 从 JSON 文件加载并应用到 blocks
     */
    public applyFromJson(jsonPath: string, callback?: () => void): void {
        resources.load(jsonPath, JsonAsset, (err, jsonAsset) => {
            if (err) {
                console.error('加载 JSON 失败:', err);
                callback?.();
                return;
            }

            const patternData = (jsonAsset as JsonAsset).json as PixelPatternJson;
            this.applyPattern(patternData);
            callback?.();
        });
    }

    /**
     * 直接应用图案数据
     */
    public applyPattern(data: PixelPatternJson): void {
        if (!this.gridDrawer) {
            console.error('未设置 gridDrawer');
            return;
        }

        const width = data.gridWidth;
        const height = data.gridHeight;

        console.log(`应用图案: ${data.name} (${width}x${height})`);

        // 通过 GridDrawer 获取每个 block
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const index = row * width + col;
                const blockData = data.blocks[index];

                const block = this.gridDrawer.getBlock(row, col);
                if (block && blockData) {
                    // 设置行列信息
                    const blockController = block.getComponent(BlockController);
                    if (blockController) {
                        blockController.setPosition(row, col, width);
                    }
                    this.applyColorToBlock(block, blockData);
                }
            }
        }

        console.log('图案应用完成');

        // 刷新颜色序号显示
        this.gridDrawer.refreshColorNumbers();
    }

    /**
     * 给单个 block 应用颜色
     */
    private applyColorToBlock(block: Node, colorData: PixelBlock): void {
        // 直接在 block 本身设置颜色
        const sprite = block.getComponent(Sprite);
        const blockController = block.getComponent(BlockController);
        if (sprite) {
            sprite.enabled = false;
            if (colorData.a > 0) {
                // 不透明，设置颜色
                sprite.color = new Color(colorData.r, colorData.g, colorData.b, colorData.a);
            } else {
                // 透明，隐藏，并设置 alpha 为 0
                sprite.color = new Color(0, 0, 0, 0);
            }
        }
        // 设置目标颜色到 BlockController
        if (blockController) {
            blockController.setTargetColor(colorData.r, colorData.g, colorData.b, colorData.a);
        }
    }
}

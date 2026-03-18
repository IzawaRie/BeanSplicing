import { _decorator, Component, Sprite, JsonAsset, Texture2D, SpriteFrame, ImageAsset } from 'cc';
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
 * 调色板生成器
 * 生成颜色纹理并显示在 Sprite 上
 */
@ccclass('PaletteGenerator')
export class PaletteGenerator extends Component {

    onLoad() {
        // 获取 Sprite 组件
        const sprite = this.getComponent(Sprite);
        if (!sprite) {
            console.error('PaletteGenerator 需要挂载在带有 Sprite 组件的节点上');
        }
    }

    /**
     * 从 JSON 文件加载并生成调色板
     * @param jsonPath resources 目录下的 JSON 路径，如 'pixel_patterns/apple'
     */
    public loadFromJson(jsonPath: string): void {
        (window as any).cc?.resources?.load(jsonPath, JsonAsset, (err: any, jsonAsset: any) => {
            if (err) {
                console.error('加载 JSON 失败:', err);
                return;
            }

            const patternData = (jsonAsset as JsonAsset).json as PixelPatternJson;
            this.generatePalette(patternData);
        });
    }

    /**
     * 直接应用图案数据生成调色板
     * 参考 adas_road_RGB_RT 的方式
     */
    public generatePalette(data: PixelPatternJson): void {
        const sprite = this.getComponent(Sprite);
        if (!sprite) {
            console.error('未找到 Sprite 组件');
            return;
        }

        const width = data.gridWidth;
        const height = data.gridHeight;
        const blocks = data.blocks;

        // 1. 创建像素数据 (RGBA)
        const byteCount = width * height * 4;
        const buffer = new ArrayBuffer(byteCount);
        const byteArray = new Uint8Array(buffer, 0, byteCount);

        // 2. 填充像素数据
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                const pixelIndex = index * 4;
                const block = blocks[index];

                if (block) {
                    byteArray[pixelIndex] = block.r;
                    byteArray[pixelIndex + 1] = block.g;
                    byteArray[pixelIndex + 2] = block.b;
                    byteArray[pixelIndex + 3] = block.a;
                } else {
                    // 默认透明
                    byteArray[pixelIndex] = 0;
                    byteArray[pixelIndex + 1] = 0;
                    byteArray[pixelIndex + 2] = 0;
                    byteArray[pixelIndex + 3] = 0;
                }
            }
        }

        // 3. 创建 ImageAsset (参考 adas_road_RGB_RT)
        const imgAsset = new ImageAsset();
        imgAsset.reset({
            _data: byteArray,
            _compressed: true,
            width: width,
            height: height,
            format: Texture2D.PixelFormat.RGBA8888
        });

        // 4. 创建 Texture2D 并绑定 ImageAsset
        const texture = new Texture2D();
        texture.image = imgAsset;

        // 5. 上传数据
        texture.uploadData(byteArray, 0);

        // 6. 创建 SpriteFrame 并应用
        const spriteFrame = new SpriteFrame();
        spriteFrame.texture = texture;

        // 设置纹理过滤模式为 Nearest，确保像素清晰
        texture.setFilters(Texture2D.Filter.NEAREST, Texture2D.Filter.NEAREST);

        // 禁用动态图集
        (spriteFrame as any)._packable = false;

        sprite.spriteFrame = spriteFrame;
        console.log('纹理已应用');
    }
}

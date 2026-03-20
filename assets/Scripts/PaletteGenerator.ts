import { _decorator, Component, Sprite, JsonAsset, Texture2D, SpriteFrame, ImageAsset, UITransform } from 'cc';
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
    public loadFromJson(jsonPath: string, callback?: () => void): void {
        (window as any).cc?.resources?.load(jsonPath, JsonAsset, (err: any, jsonAsset: any) => {
            if (err) {
                console.error('加载 JSON 失败:', err);
                callback?.();
                return;
            }

            const patternData = (jsonAsset as JsonAsset).json as PixelPatternJson;
            this.generatePalette(patternData);
            callback?.();
        });
    }

    /**
     * 直接应用图案数据生成调色板
     * 根据 UITransform 尺寸等比例放大像素
     */
    public generatePalette(data: PixelPatternJson): void {
        const sprite = this.getComponent(Sprite);
        const uiTransform = this.getComponent(UITransform);
        if (!sprite || !uiTransform) {
            console.error('未找到 Sprite 或 UITransform 组件');
            return;
        }

        const jsonWidth = data.gridWidth;
        const jsonHeight = data.gridHeight;
        const blocks = data.blocks;

        // 获取节点的显示尺寸
        const displayWidth = uiTransform.width;
        const displayHeight = uiTransform.height;

        // 计算每个像素需要放大的倍数
        const scaleX = displayWidth / jsonWidth;
        const scaleY = displayHeight / jsonHeight;

        // 实际的纹理尺寸 = 显示尺寸
        const textureWidth = Math.floor(displayWidth);
        const textureHeight = Math.floor(displayHeight);

        // 1. 创建像素数据 (RGBA)
        const byteCount = textureWidth * textureHeight * 4;
        const buffer = new ArrayBuffer(byteCount);
        const byteArray = new Uint8Array(buffer, 0, byteCount);

        // 2. 填充像素数据 - 每个 JSON 像素放大为 scaleX x scaleY
        for (let jsonY = 0; jsonY < jsonHeight; jsonY++) {
            for (let jsonX = 0; jsonX < jsonWidth; jsonX++) {
                const jsonIndex = jsonY * jsonWidth + jsonX;
                const block = blocks[jsonIndex];

                // 计算这个 JSON 像素在纹理上的起始位置
                const startX = Math.floor(jsonX * scaleX);
                const startY = Math.floor(jsonY * scaleY);
                const endX = Math.floor((jsonX + 1) * scaleX);
                const endY = Math.floor((jsonY + 1) * scaleY);

                // 填充对应的像素
                for (let y = startY; y < endY && y < textureHeight; y++) {
                    for (let x = startX; x < endX && x < textureWidth; x++) {
                        const pixelIndex = (y * textureWidth + x) * 4;

                        if (block && block.a > 0) {
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
            }
        }

        // 3. 创建 ImageAsset
        const imgAsset = new ImageAsset();
        imgAsset.reset({
            _data: byteArray,
            _compressed: true,
            width: textureWidth,
            height: textureHeight,
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
        console.log(`纹理已应用: ${textureWidth}x${textureHeight}, 放大倍数: ${scaleX}x${scaleY}`);
    }
}

import { _decorator, Component, Sprite, SpriteFrame, resources, JsonAsset, Texture2D, UITransform, Rect } from 'cc';
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
        resources.load(jsonPath, JsonAsset, (err, jsonAsset) => {
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
     */
    public generatePalette(data: PixelPatternJson): void {
        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) {
            console.error('未找到 UITransform 组件');
            return;
        }

        const textureSize = Math.max(uiTransform.width, uiTransform.height);

        // 创建 Float32Array 像素数据 (RGBA)
        const floatArray = new Float32Array(textureSize * textureSize * 4);

        // 测试：填充白色 (1.0 = 255)
        for (let i = 0; i < floatArray.length; i += 4) {
            floatArray[i] = 1.0;     // R
            floatArray[i + 1] = 1.0; // G
            floatArray[i + 2] = 1.0; // B
            floatArray[i + 3] = 1.0; // A
        }

        // 创建纹理
        const texture = new Texture2D();
        texture.reset({
            width: textureSize,
            height: textureSize,
            format: 44 // RGBA8
        });

        // 延迟上传数据，确保纹理创建完成
        this.scheduleOnce(() => {
            texture.uploadData(floatArray, 0);

            // 创建 SpriteFrame
            const spriteFrame = new SpriteFrame();
            spriteFrame.texture = texture;
            spriteFrame.rect = new (Rect as any)(0, 0, textureSize, textureSize);

            // 应用到当前节点的 Sprite
            const sprite = this.getComponent(Sprite);
            if (sprite) {
                sprite.spriteFrame = spriteFrame;
                console.log('白色纹理已应用');
            }
        }, 0.1);
    }
}

import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 像素化图片导出器
 * 负责像素化处理和导出保存
 */
class PixelImageExporter {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    public blocks: { r: number; g: number; b: number; a: number }[] = [];
    public patternWidth: number = 0;
    public patternHeight: number = 0;
    public fileName: string = 'pixel_pattern';

    constructor() {
        if (typeof document !== 'undefined') {
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
        }
    }

    /**
     * 像素化并导出图片（马赛克效果）
     * 保持原图尺寸，按格子进行马赛克处理
     * 如果格子内同一个颜色超过50%，则填充该颜色，否则透明
     * 使用颜色容差来判断"同一个颜色"
     */
    public pixelateAndExport(
        imageUrl: string,
        gridSize: number,
        fileName: string,
        onComplete?: (success: boolean, message: string) => void
    ): void {
        // 去掉文件扩展名，作为基础文件名
        this.fileName = fileName.replace(/\.[^/.]+$/, '');
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            // 保持原图尺寸
            const width = img.width;
            const height = img.height;

            this.canvas!.width = width;
            this.canvas!.height = height;
            this.ctx!.drawImage(img, 0, 0, width, height);

            // 获取原图像素数据
            const originalData = this.ctx!.getImageData(0, 0, width, height);

            // 计算每个格子的大小
            const cellWidth = Math.ceil(width / gridSize);
            const cellHeight = Math.ceil(height / gridSize);

            // 颜色容差（用于判断颜色是否"相同"）
            const colorTolerance = 128;

            // 创建新的像素数据
            const outputData = this.ctx!.createImageData(width, height);

            // 遍历每个格子
            for (let gy = 0; gy < gridSize; gy++) {
                for (let gx = 0; gx < gridSize; gx++) {
                    // 计算格子在原图中的像素范围
                    const startX = gx * cellWidth;
                    const startY = gy * cellHeight;
                    const endX = Math.min(startX + cellWidth, width);
                    const endY = Math.min(startY + cellHeight, height);

                    // 统计格子内每个颜色出现的次数（使用颜色容差）
                    const colorCounts: { r: number; g: number; b: number; count: number }[] = [];

                    for (let y = startY; y < endY; y++) {
                        for (let x = startX; x < endX; x++) {
                            const idx = (y * width + x) * 4;
                            // 直接使用原始颜色
                            const r = originalData.data[idx];
                            const g = originalData.data[idx + 1];
                            const b = originalData.data[idx + 2];
                            const a = originalData.data[idx + 3];

                            // 只统计不透明像素
                            if (a > 128) {
                                // 查找是否已有相近的颜色
                                let found = false;
                                for (const c of colorCounts) {
                                    if (Math.abs(c.r - r) <= colorTolerance &&
                                        Math.abs(c.g - g) <= colorTolerance &&
                                        Math.abs(c.b - b) <= colorTolerance) {
                                        c.count++;
                                        found = true;
                                        break;
                                    }
                                }
                                // 如果没有相近的颜色，添加新的
                                if (!found) {
                                    colorCounts.push({ r, g, b, count: 1 });
                                }
                            }
                        }
                    }

                    // 找出出现次数最多的颜色
                    let maxCount = 0;
                    let dominantColor = null;

                    for (const c of colorCounts) {
                        if (c.count > maxCount) {
                            maxCount = c.count;
                            dominantColor = c;
                        }
                    }

                    // 计算格子总像素数
                    const cellPixelCount = (endX - startX) * (endY - startY);
                    const halfPixels = Math.floor(cellPixelCount / 3);

                    // 打印格子信息
                    //console.log(`格子[${gx},${gy}] 总像素:${cellPixelCount} 不透明:${colorCounts.reduce((s,c)=>s+c.count,0)} 最大相同:${maxCount}/${halfPixels} 颜色数:${colorCounts.length}`, dominantColor);

                    // 决定填充颜色
                    let blockR = 0, blockG = 0, blockB = 0, blockA = 0;

                    // 如果超过50%的像素是同一个颜色（使用容差后）
                    if (maxCount > halfPixels && dominantColor) {
                        blockR = dominantColor.r;
                        blockG = dominantColor.g;
                        blockB = dominantColor.b;
                        blockA = 255;
                    }
                    // 否则保持透明（blockA = 0）

                    // 保存格子颜色到 blocks 数组（按行列顺序）
                    this.blocks.push({ r: blockR, g: blockG, b: blockB, a: blockA });

                    // 将格子的颜色应用到所有像素
                    for (let y = startY; y < endY; y++) {
                        for (let x = startX; x < endX; x++) {
                            const idx = (y * width + x) * 4;
                            outputData.data[idx] = blockR;
                            outputData.data[idx + 1] = blockG;
                            outputData.data[idx + 2] = blockB;
                            outputData.data[idx + 3] = blockA;
                        }
                    }
                }
            }

            // 保存图案尺寸
            this.patternWidth = gridSize;
            this.patternHeight = gridSize;

            // 放回 canvas 并导出
            this.ctx!.putImageData(outputData, 0, 0);

            console.log(`生成了 ${this.blocks.length} 个格子，尺寸 ${this.patternWidth}x${this.patternHeight}`);

            this.exportAsImage(() => {
                onComplete?.(true, `已导出 ${width}x${height} 像素图案 (${gridSize}x${gridSize} 格子)`);
            });
        };
        img.onerror = () => {
            onComplete?.(false, '图片加载失败');
        };
        img.src = imageUrl;
    }

    private exportAsImage(onComplete?: () => void): void {
        const width = this.canvas!.width;
        const height = this.canvas!.height;

        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = width;
        exportCanvas.height = height;
        const exportCtx = exportCanvas.getContext('2d');

        if (!exportCtx) return;

        // 直接从当前 canvas 复制图像数据
        const imageData = this.ctx!.getImageData(0, 0, width, height);
        exportCtx.putImageData(imageData, 0, 0);

        const dataUrl = exportCanvas.toDataURL('image/png');
        this.downloadDataUrl(dataUrl, `${this.fileName}.png`);

        onComplete?.();
    }

    private downloadDataUrl(dataUrl: string, fileName: string): void {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
    }

    public destroy(): void {
        this.canvas = null;
        this.ctx = null;
    }
}

/**
 * 像素化控制器
 * 选择图片 → 像素化 → 导出 PNG
 */
@ccclass('PixelController')
export class PixelController extends Component {
    @property({ type: Number, min: 8, max: 64 })
    gridSize: number = 16;

    private exporter: PixelImageExporter | null = null;
    private fileInput: HTMLInputElement | null = null;
    public currentBlocks: { r: number; g: number; b: number; a: number }[] = [];
    public currentGridSize: number = 0;

    onLoad() {
        this.exporter = new PixelImageExporter();
    }

    onDestroy() {
        this.exporter?.destroy();
    }

    /**
     * 确保文件输入元素已创建
     */
    private ensureFileInput(): void {
        if (this.fileInput) return;

        console.log('typeof document:', typeof document);

        if (typeof document === 'undefined') {
            console.error('document 不可用');
            return;
        }

        this.fileInput = document.createElement('input');
        this.fileInput.id = 'pixel-controller-input-' + Date.now();
        this.fileInput.type = 'file';
        this.fileInput.accept = 'image/*';
        this.fileInput.style.display = 'block';
        this.fileInput.style.position = 'absolute';
        this.fileInput.style.zIndex = '9999';
        document.body.appendChild(this.fileInput);

        console.log('fileInput created:', this.fileInput);

        this.fileInput.onchange = () => {
            console.log('file selected');
            this.onFileSelected();
        };
    }

    /**
     * 文件选择后处理
     */
    private onFileSelected(): void {
        if (!this.fileInput || !this.fileInput.files || this.fileInput.files.length === 0) {
            return;
        }

        const file = this.fileInput.files[0];
        const fileName = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            this.processAndExport(dataUrl, fileName);
        };
        reader.readAsDataURL(file);

        this.fileInput.value = '';
    }

    /**
     * 处理并导出
     */
    private processAndExport(imageUrl: string, fileName: string): void {
        this.exporter?.pixelateAndExport(
            imageUrl,
            this.gridSize,
            fileName,
            (success, message) => {
                // 保存 blocks 数据
                if (this.exporter) {
                    this.currentBlocks = [...this.exporter.blocks];
                    this.currentGridSize = this.exporter.patternWidth;
                }
                console.log(message);
            }
        );
    }

    /**
     * 导出 JSON 格式
     * 绑定到按钮的点击事件
     */
    public onExportJsonButtonClick(): void {
        // 先确保文件输入存在
        this.ensureFileInput();
        if (!this.fileInput) {
            console.error('无法创建文件输入');
            return;
        }

        // 保存当前上下文，用于在回调中使用
        const self = this;

        // 创建 onchange 处理
        this.fileInput.onchange = function() {
            if (!self.fileInput || !self.fileInput.files || self.fileInput.files.length === 0) {
                return;
            }

            const file = self.fileInput!.files[0];
            const fileName = file.name;
            const reader = new FileReader();
            reader.onload = function(e) {
                const dataUrl = e.target?.result as string;
                self.processAndExportJson(dataUrl, fileName);
            };
            reader.readAsDataURL(file);
        };

        // 触发文件选择
        this.fileInput.click();
    }

    /**
     * 处理并导出 JSON
     */
    private processAndExportJson(imageUrl: string, fileName: string): void {
        const baseName = fileName.replace(/\.[^/.]+$/, '');
        console.log('开始处理图片:', imageUrl);
        this.exporter?.pixelateAndExport(
            imageUrl,
            this.gridSize,
            fileName,
            (success, message) => {
                console.log('处理完成:', success, message);
                console.log('exporter:', this.exporter);
                console.log('blocks:', this.exporter?.blocks?.length);
                console.log('patternWidth:', this.exporter?.patternWidth);

                if (success && this.exporter) {
                    this.currentBlocks = [...this.exporter.blocks];
                    this.currentGridSize = this.exporter.patternWidth;

                    console.log('准备导出 JSON, blocks 数量:', this.currentBlocks.length);

                    // 导出 JSON
                    const width = this.currentGridSize;
                    const height = this.currentGridSize;

                    const blocksStr = this.currentBlocks.map(b =>
                        `{ "r": ${b.r}, "g": ${b.g}, "b": ${b.b}, "a": ${b.a} }`
                    ).join(',\n    ');

                    const jsonStr = `{\n  "name": "${baseName}",\n  "gridWidth": ${width},\n  "gridHeight": ${height},\n  "blocks": [\n    ${blocksStr}\n  ]\n}`;
                    const blob = new Blob([jsonStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.download = `${baseName}.json`;
                    link.href = url;
                    link.click();

                    URL.revokeObjectURL(url);
                    console.log('已导出 JSON');
                }
                console.log(message);
            }
        );
    }

    /**
     * 点击按钮触发选择图片
     * 绑定到按钮的点击事件
     */
    public onSelectImageButtonClick(): void {
        console.log('onSelectImageButtonClick');
        this.ensureFileInput();
        if (this.fileInput) {
            this.fileInput.click();
        }
    }
}

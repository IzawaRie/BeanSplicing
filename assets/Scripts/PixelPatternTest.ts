import { _decorator, Component, Node } from 'cc';
import { GridDrawer } from './GridDrawer';
import { PixelPatternApplier } from './PixelPatternApplier';
const { ccclass, property } = _decorator;

/**
 * 像素图案测试脚本
 * 在 GridDrawer 创建完 blocks 后自动应用图案
 */
@ccclass('PixelPatternTest')
export class PixelPatternTest extends Component {
    @property({ type: Node })
    gridDrawerNode: Node | null = null;

    @property({ type: String })
    patternPath: string = 'pixel_patterns/heart';

    start() {
        if (this.gridDrawerNode) {
            const gridDrawer = this.gridDrawerNode.getComponent(GridDrawer);
            if (gridDrawer) {
                // 设置回调，在 blocks 创建完成后应用图案
                gridDrawer.onBlocksCreated = () => {
                    console.log('Blocks 创建完成，开始应用图案');

                    // 延迟一点执行，确保 blocks 完全就绪
                    setTimeout(() => {
                        this.applyPattern();
                    }, 200);
                };
            }
        }
    }

    private applyPattern() {
        // 获取 PixelPatternApplier 组件
        const applier = this.node.getComponent(PixelPatternApplier);
        if (applier) {
            applier.applyFromJson(this.patternPath);
        } else {
            console.error('未找到 PixelPatternApplier 组件');
        }
    }
}

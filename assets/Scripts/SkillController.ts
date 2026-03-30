import { _decorator, Component, Node, tween, UIOpacity, Vec3 } from 'cc';
import { GameManager, GameState } from './GameManager';
import { LevelMode } from './LevelMode';
import { AudioManager } from './AudioManager';

const { ccclass, property } = _decorator;

@ccclass('SkillController')
export class SkillController extends Component {
    @property(Node)
    palette_skill: Node = null;
    @property(Node)
    time_skill: Node = null;
    @property(Node)
    fix_skill: Node = null;

    // 技能冷却状态
    private paletteCooldown: boolean = false;
    private timeCooldown: boolean = false;
    private fixCooldown: boolean = false;

    // 技能冷却时间（毫秒）
    private readonly COOLDOWN_TIME: number = 10000;

    onLoad() {
        // 注册技能按钮触摸事件
        if (this.palette_skill) {
            this.palette_skill.on(Node.EventType.TOUCH_END, this.onPaletteSkillClick, this);
        }
        if (this.time_skill) {
            this.time_skill.on(Node.EventType.TOUCH_END, this.onTimeSkillClick, this);
        }
        if (this.fix_skill) {
            this.fix_skill.on(Node.EventType.TOUCH_END, this.onFixSkillClick, this);
        }
    }

    onDestroy() {
        if (this.palette_skill) {
            this.palette_skill.off(Node.EventType.TOUCH_END, this.onPaletteSkillClick, this);
        }
        if (this.time_skill) {
            this.time_skill.off(Node.EventType.TOUCH_END, this.onTimeSkillClick, this);
        }
        if (this.fix_skill) {
            this.fix_skill.off(Node.EventType.TOUCH_END, this.onFixSkillClick, this);
        }
    }

    /**
     * 判断游戏是否进行中
     */
    private isGameActive(): boolean {
        const gameManager = GameManager.getInstance();
        return gameManager?.gameState == GameState.PLAYING;
    }

    /**
     * 获取 LevelMode 实例
     */
    private getLevelMode(): LevelMode | null {
        return GameManager.getInstance()?.levelMode ?? null;
    }

    /**
     * 播放按下动画
     */
    private playPressAnim(node: Node): void {
        tween(node)
            .to(0.1, { scale: new Vec3(0.9, 0.9, 1) })
            .to(0.1, { scale: new Vec3(1, 1, 1) })
            .start();
    }

    /**
     * 播放冷却动画（变灰 + 倒计时恢复）
     */
    private startCooldown(node: Node, duration: number, onFinish?: () => void): void {
        // 获取或添加 UIOpacity 组件
        let uiOpacity = node.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = node.addComponent(UIOpacity);
        }

        // 变灰效果：降低透明度到 100
        tween(uiOpacity)
            .to(0.3, { opacity: 100 })
            .delay(duration - 0.3)
            .to(0.3, { opacity: 255 })
            .call(() => {
                if (onFinish) onFinish();
            })
            .start();
    }

    // ==================== 技能点击事件 ====================

    /**
     * palette_skill 点击事件
     * 显示 block 的颜色和 number 文字（半透明），持续3秒后自动隐藏
     */
    private onPaletteSkillClick(): void {
        if (!this.isGameActive()) return;
        if (this.paletteCooldown) return;

        const levelMode = this.getLevelMode();
        if (!levelMode) return;

        GameManager.getInstance().vibrateShort();
        AudioManager.instance.playEffect('click_btn');

        // 按下动画
        this.playPressAnim(this.palette_skill);

        // 激活调色板预览（保持显示直到游戏结束）
        levelMode.activatePaletteSkill();

        // 设置冷却
        this.paletteCooldown = true;
        this.startCooldown(this.palette_skill, this.COOLDOWN_TIME, () => {
            this.paletteCooldown = false;
        });
    }

    /**
     * time_skill 点击事件
     * 冻结时间10秒
     */
    private onTimeSkillClick(): void {
        if (!this.isGameActive()) return;
        if (this.timeCooldown) return;

        const levelMode = this.getLevelMode();
        if (!levelMode) return;

        GameManager.getInstance().vibrateShort();
        AudioManager.instance.playEffect('click_btn');

        // 按下动画
        this.playPressAnim(this.time_skill);

        // 激活时间冻结
        levelMode.activateTimeFreeze();

        // 设置冷却
        this.timeCooldown = true;
        this.startCooldown(this.time_skill, this.COOLDOWN_TIME, () => {
            this.timeCooldown = false;
        });
    }

    /**
     * fix_skill 点击事件
     * 修复颜色不匹配的 block
     */
    private onFixSkillClick(): void {
        if (!this.isGameActive()) return;
        if (this.fixCooldown) return;

        const levelMode = this.getLevelMode();
        if (!levelMode) return;

        GameManager.getInstance().vibrateShort();
        AudioManager.instance.playEffect('click_btn');

        // 按下动画
        this.playPressAnim(this.fix_skill);

        // 激活修复技能
        levelMode.activateFixSkill();

        // 设置冷却
        this.fixCooldown = true;
        this.startCooldown(this.fix_skill, this.COOLDOWN_TIME, () => {
            this.fixCooldown = false;
        });
    }
}

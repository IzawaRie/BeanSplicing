import { _decorator, Component, Label, Node, tween, UIOpacity, Vec3 } from 'cc';
import { GameManager, GameState } from './GameManager';
import { LevelMode } from './LevelMode';
import { AudioManager } from './AudioManager';
import { WXManager } from './WXManager';

const { ccclass, property } = _decorator;

@ccclass('SkillController')
export class SkillController extends Component {
    @property(Node)
    palette_skill: Node = null;
    @property(Node)
    time_skill: Node = null;
    @property(Node)
    fix_skill: Node = null;

    @property(Node)
    palette_camera: Node = null;
    @property(Node)
    time_camera: Node = null;
    @property(Node)
    fix_camera: Node = null;

    @property(Node)
    palette_number_bg: Node = null;
    @property(Node)
    time_number_bg: Node = null;
    @property(Node)
    fix_number_bg: Node = null;

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

        // 注册 wenhao 按钮触摸事件
        this.registerWenhaoEvent(this.palette_skill, ' 图案显示技能：显示所有拼豆格子\n\n 上的颜色（半透明状态）和对应颜\n\n 色序号，持续十秒');
        this.registerWenhaoEvent(this.time_skill, ' 时间冻结技能：冻结游戏倒计时30\n\n 秒，冻结结束后继续倒计时');
        this.registerWenhaoEvent(this.fix_skill, ' 超级修复技能：修复最大数量同一颜\n\n 色不匹配的拼豆（格子上没有拼豆除\n\n 外）');
    }

    /**
     * 注册 wenhao 子节点的点击事件
     */
    private registerWenhaoEvent(skillNode: Node, tipMessage: string): void {
        if (!skillNode) return;
        const wenhao = skillNode.getChildByName('wenhao');
        if (wenhao) {
            wenhao.on(Node.EventType.TOUCH_END, () => {
                this.onWenhaoClick(tipMessage);
            }, this);
        }
    }

    /**
     * wenhao 点击事件
     */
    private onWenhaoClick(tipMessage: string): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager?.window) return;
        gameManager.vibrateShort();
        gameManager.window.showWithMessage(tipMessage, false);
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

    private consumeStoredSkill(skillKey: 'palette' | 'time' | 'fix'): boolean {
        const userInfo = GameManager.getInstance()?.userInfo;
        if (!userInfo) {
            return false;
        }

        switch (skillKey) {
            case 'palette':
                if (userInfo.paletteSkillCount <= 0) return false;
                userInfo.paletteSkillCount -= 1;
                break;
            case 'time':
                if (userInfo.timeSkillCount <= 0) return false;
                userInfo.timeSkillCount -= 1;
                break;
            case 'fix':
                if (userInfo.fixSkillCount <= 0) return false;
                userInfo.fixSkillCount -= 1;
                break;
        }

        this.refreshSkillInventoryDisplay();
        return true;
    }

    private activateSkillWithCooldown(node: Node, activate: () => void, setCooldown: (value: boolean) => void): void {
        activate();
        setCooldown(true);
        this.startCooldown(node, this.COOLDOWN_TIME, () => {
            setCooldown(false);
        });
    }

    // ==================== 技能点击事件 ====================

    /**
     * palette_skill 点击事件
     * 显示 block 的颜色和 number 文字（半透明），持续3秒后自动隐藏
     */
    private onPaletteSkillClick(): void {
        if (!this.isGameActive()) return;
        if (this.paletteCooldown) return;
        if (GameManager.getInstance()?.isWindowBlocking()) return;

        const levelMode = this.getLevelMode();
        if (!levelMode) return;
        const gameManager = GameManager.getInstance();
        if (!gameManager) return;

        gameManager.vibrateShort();
        AudioManager.instance.playEffect('click_btn');

        // 按下动画
        this.playPressAnim(this.palette_skill);

        if (this.consumeStoredSkill('palette')) {
            this.activateSkillWithCooldown(
                this.palette_skill,
                () => levelMode.activatePaletteSkill(),
                (value) => { this.paletteCooldown = value; }
            );
            return;
        }

        const prevState = gameManager.gameState;
        gameManager.gameState = GameState.PAUSED;

        // 播放激励视频广告，看完后才激活技能
        WXManager.instance.showRewardedVideoAd((success) => {
            gameManager.gameState = prevState;
            if (!success) return; // 中途退出，不执行技能
            this.activateSkillWithCooldown(
                this.palette_skill,
                () => levelMode.activatePaletteSkill(),
                (value) => { this.paletteCooldown = value; }
            );
        });
    }

    /**
     * time_skill 点击事件
     * 冻结时间10秒
     */
    private onTimeSkillClick(): void {
        if (!this.isGameActive()) return;
        if (this.timeCooldown) return;
        if (GameManager.getInstance()?.isWindowBlocking()) return;

        const levelMode = this.getLevelMode();
        if (!levelMode) return;
        const gameManager = GameManager.getInstance();
        if (!gameManager) return;

        gameManager.vibrateShort();
        AudioManager.instance.playEffect('click_btn');

        // 按下动画
        this.playPressAnim(this.time_skill);

        if (this.consumeStoredSkill('time')) {
            this.activateSkillWithCooldown(
                this.time_skill,
                () => levelMode.activateTimeFreeze(),
                (value) => { this.timeCooldown = value; }
            );
            return;
        }

        const prevState = gameManager.gameState;
        gameManager.gameState = GameState.PAUSED;

        // 播放激励视频广告，看完后才激活技能
        WXManager.instance.showRewardedVideoAd((success) => {
            gameManager.gameState = prevState;
            if (!success) return; // 中途退出，不执行技能
            this.activateSkillWithCooldown(
                this.time_skill,
                () => levelMode.activateTimeFreeze(),
                (value) => { this.timeCooldown = value; }
            );
        });
    }

    /**
     * fix_skill 点击事件
     * 修复颜色不匹配的 block
     */
    private onFixSkillClick(): void {
        if (!this.isGameActive()) return;
        if (this.fixCooldown) return;
        if (GameManager.getInstance()?.isWindowBlocking()) return;

        const levelMode = this.getLevelMode();
        if (!levelMode) return;
        const gameManager = GameManager.getInstance();
        if (!gameManager) return;

        gameManager.vibrateShort();
        AudioManager.instance.playEffect('click_btn');

        // 按下动画
        this.playPressAnim(this.fix_skill);

        if (this.consumeStoredSkill('fix')) {
            this.activateSkillWithCooldown(
                this.fix_skill,
                () => levelMode.activateFixSkill(),
                (value) => { this.fixCooldown = value; }
            );
            return;
        }

        const prevState = gameManager.gameState;
        gameManager.gameState = GameState.PAUSED;

        // 播放激励视频广告，看完后才激活技能
        WXManager.instance.showRewardedVideoAd((success) => {
            gameManager.gameState = prevState;
            if (!success) return; // 中途退出，不执行技能
            this.activateSkillWithCooldown(
                this.fix_skill,
                () => levelMode.activateFixSkill(),
                (value) => { this.fixCooldown = value; }
            );
        });
    }

    /**
     * 重置所有技能状态（新关卡开始或重新开始时调用）
     */
    public resetSkills(): void {
        this.paletteCooldown = false;
        this.timeCooldown = false;
        this.fixCooldown = false;

        // 停止所有 tween 并恢复 opacity
        tween(this.palette_skill).stop();
        tween(this.time_skill).stop();
        tween(this.fix_skill).stop();

        // 恢复按钮透明度
        const resetOpacity = (node: Node) => {
            if (node) {
                let uiOpacity = node.getComponent(UIOpacity);
                if (!uiOpacity) {
                    uiOpacity = node.addComponent(UIOpacity);
                }
                uiOpacity.opacity = 255;
            }
        };
        resetOpacity(this.palette_skill);
        resetOpacity(this.time_skill);
        resetOpacity(this.fix_skill);

        this.refreshSkillInventoryDisplay();
    }

    public refreshSkillInventoryDisplay(): void {
        const userInfo = GameManager.getInstance()?.userInfo;
        this.refreshSingleSkillDisplay(this.palette_camera, this.palette_number_bg, userInfo?.paletteSkillCount ?? 0);
        this.refreshSingleSkillDisplay(this.time_camera, this.time_number_bg, userInfo?.timeSkillCount ?? 0);
        this.refreshSingleSkillDisplay(this.fix_camera, this.fix_number_bg, userInfo?.fixSkillCount ?? 0);
    }

    private refreshSingleSkillDisplay(cameraNode: Node | null, numberBgNode: Node | null, count: number): void {
        const safeCount = Math.max(0, Math.floor(count));
        const hasSkill = safeCount > 0;

        if (cameraNode) {
            cameraNode.active = !hasSkill;
        }

        if (numberBgNode) {
            numberBgNode.active = hasSkill;
            const numberNode = numberBgNode.getChildByName('number');
            const numberLabel = numberNode?.getComponent(Label);
            if (numberLabel) {
                numberLabel.string = `${safeCount}`;
            }
        }
    }
}

import { _decorator, Component, Node, input, Input, EventTouch, UITransform, Toggle } from 'cc';
import { GameManager, GameState } from './GameManager';
import { AudioManager } from './AudioManager';
import { LevelConfig } from './LevelConfig';
const { ccclass, property } = _decorator;

@ccclass('SettingController')
export class SettingController extends Component {

    @property({ type: Node })
    border_bg: Node = null;
    @property({ type: Toggle })
    hand_toggle_left: Toggle = null;
    @property({ type: Toggle })
    hand_toggle_right: Toggle = null;
    @property({ type: Toggle })
    shake_toggle: Toggle = null;
    @property({ type: Toggle })
    music_toggle: Toggle = null;
    @property({ type: Toggle })
    audio_toggle: Toggle = null;
    @property({ type: Node })
    restart_btn: Node = null;
    @property({ type: Node })
    home_btn: Node = null;

    public lastState: GameState = null;

    start() {
        this.hand_toggle_left?.node.on(Toggle.EventType.TOGGLE, this.onLeftToggleChanged, this);
        this.hand_toggle_right?.node.on(Toggle.EventType.TOGGLE, this.onRightToggleChanged, this);
        this.shake_toggle?.node.on(Toggle.EventType.TOGGLE, this.onShakeToggleChanged, this);
        this.music_toggle?.node.on(Toggle.EventType.TOGGLE, this.onMusicToggleChanged, this);
        this.audio_toggle?.node.on(Toggle.EventType.TOGGLE, this.onAudioToggleChanged, this);
        this.restart_btn?.on(Node.EventType.TOUCH_END, this.onRestartBtnClick, this);
        this.home_btn?.on(Node.EventType.TOUCH_END, this.onHomeBtnClick, this);
    }

    onEnable() {
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onDisable() {
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onDestroy() {
        this.hand_toggle_left?.node.off(Toggle.EventType.TOGGLE, this.onLeftToggleChanged, this);
        this.hand_toggle_right?.node.off(Toggle.EventType.TOGGLE, this.onRightToggleChanged, this);
        this.shake_toggle?.node.off(Toggle.EventType.TOGGLE, this.onShakeToggleChanged, this);
    }

    /**
     * 左侧切换事件
     */
    private onLeftToggleChanged(toggle: Toggle): void {
        if (toggle.isChecked) {
            const gameManager = GameManager.getInstance();
            if (gameManager) {
                gameManager.hand_setting = -1;
                gameManager.wxManager.setHandSetting(-1);
            }
        }
    }

    /**
     * 右侧切换事件
     */
    private onRightToggleChanged(toggle: Toggle): void {
        if (toggle.isChecked) {
            const gameManager = GameManager.getInstance();
            if (gameManager) {
                gameManager.hand_setting = 1;
                gameManager.wxManager.setHandSetting(1);
            }
        }
    }

    /**
     * 点击边框外任意区域时关闭面板
     */
    private onTouchEnd(event: EventTouch): void {
        const touch = event.touch;
        if (!touch) return;

        // 获取点击位置
        const touchPos = touch.getUILocation();

        // 检查是否点击在内容面板内
        if (this.isTouchInContentPanel(touchPos)) {
            return; // 点击在内容面板内，不关闭
        }

        const gameManager = GameManager.getInstance();
        const levelMode = gameManager.levelMode;
        if (levelMode) {
            levelMode.resumeFromPause();
        }
        // 恢复游戏状态
        gameManager.gameState = this.lastState;
        // 点击边框外，关闭面板
        this.node.active = false;
    }

    /**
     * 检查点击位置是否在内容面板内
     */
    private isTouchInContentPanel(touchPos: { x: number, y: number }): boolean {

        const contentWorldPos = this.border_bg.getWorldPosition();
        const contentTransform = this.border_bg.getComponent(UITransform);
        if (!contentTransform) return false;

        const halfW = contentTransform.width / 2;
        const halfH = contentTransform.height / 2;

        return touchPos.x >= contentWorldPos.x - halfW && touchPos.x <= contentWorldPos.x + halfW &&
               touchPos.y >= contentWorldPos.y - halfH && touchPos.y <= contentWorldPos.y + halfH;
    }

    /**
     * 震动切换事件
     */
    private onShakeToggleChanged(toggle: Toggle): void {
        const gameManager = GameManager.getInstance();
        if (gameManager) {
            gameManager.isShake = toggle.isChecked;
            gameManager.wxManager.setShake(toggle.isChecked);
        }
    }

    /**
     * 音乐切换事件
     */
    private onMusicToggleChanged(toggle: Toggle): void {
        const gameManager = GameManager.getInstance();
        if (gameManager) {
            gameManager.wxManager.setMusic(toggle.isChecked);
            gameManager.audioManager.setMusicEnabled(toggle.isChecked);
        }
    }

    /**
     * 音效切换事件
     */
    private onAudioToggleChanged(toggle: Toggle): void {
        const gameManager = GameManager.getInstance();
        if (gameManager) {
            gameManager.wxManager.setAudio(toggle.isChecked);
            gameManager.audioManager.setAudioEnabled(toggle.isChecked);
        }
    }

    /**
     * 点击重新开始按钮
     */
    private onRestartBtnClick(): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager) return;

        if (gameManager.power <= 0) {
            gameManager.window.showWithMessage(' 能量不足，请等待下次能量更新\n\n 或观看视频获取能量！');
            return;
        }
        // 结束可能正在进行的新手引导
        const tutorialController = gameManager.levelMode?.tutorialController;
        if (tutorialController) {
            tutorialController.endTutorial();
        }

        // 播放音效
        AudioManager.instance.playEffect('click_btn');
        gameManager.vibrateShort();

        // 关闭设置面板
        this.node.active = false;

        // 恢复游戏状态
        gameManager.gameState = this.lastState;

        // 重新开始当前关卡
        const levelMode = gameManager.levelMode;
        if (levelMode) {
            levelMode.resumeFromPause();
            // 获取当前关卡配置重新开始
            const currentLevel = gameManager.currentLevel;
            const config = LevelConfig.getInstance().getCurrentLevel();
            if (config) {
                gameManager.power--;
                // 重置所有 block 状态
                levelMode.resetAllBlocks();
                levelMode.startLevel(currentLevel, config.patternPath);
            }
        }
    }

    /**
     * 点击回到主页按钮
     */
    private onHomeBtnClick(): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager) return;

        // 结束可能正在进行的新手引导
        const tutorialController = gameManager.levelMode?.tutorialController;
        if (tutorialController) {
            tutorialController.endTutorial();
        }

        // 播放音效
        AudioManager.instance.playEffect('click_btn');
        gameManager.vibrateShort();

        // 关闭设置面板
        this.node.active = false;

        // 回到主页
        const menuManager = gameManager.menuManager;
        if (menuManager) {
            menuManager.node.active = true;
            menuManager.backToMenu();
        }

        // 关闭游戏界面
        gameManager.levelMode.node.active = false;
        gameManager.gameState = GameState.WAITING;

        // 恢复背景音乐
        AudioManager.instance.playMenuBgm();
    }
}


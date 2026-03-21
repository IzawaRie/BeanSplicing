import { _decorator, Component, Label, Node } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('ResultPanel')
export class ResultPanel extends Component {

    @property(Label)
    resultLabel: Label = null;

    @property(Node)
    nextLevelBtn: Node = null;

    start() {
        if (this.nextLevelBtn) {
            this.nextLevelBtn.on(Node.EventType.TOUCH_END, this.onNextLevelBtnClick, this);
        }
    }

    onDestroy() {
        if (this.nextLevelBtn) {
            this.nextLevelBtn.off(Node.EventType.TOUCH_END, this.onNextLevelBtnClick, this);
        }
    }

    /**
     * resultPanel.nextLevelBtn 点击事件 - 进入下一关
     */
    private onNextLevelBtnClick(): void {
        this.node.active = false;
        GameManager.getInstance().levelMode.node.active = false;
        GameManager.getInstance().currentLevel++;

        const gameManager = GameManager.getInstance();
        if (gameManager.menuManager) {
            gameManager.menuManager.showProgressPanel();
            gameManager.menuManager.updateLevelButtonText(gameManager.currentLevel);
            gameManager.menuManager.loadLevel(gameManager.currentLevel);
        }
    }
}

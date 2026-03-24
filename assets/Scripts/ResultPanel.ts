import { _decorator, Component, Label, Node } from 'cc';
import { GameManager, GameState } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('ResultPanel')
export class ResultPanel extends Component {

    @property(Node)
    successNode:Node = null;

    @property(Node)
    failNode:Node = null;

    @property(Label)
    resultLabel: Label = null;

    @property(Node)
    nextLevelBtn: Node = null;

    @property(Node)
    restartBtn: Node = null;

    @property(Node)
    homelBtn: Node = null;

    /** 标记当前结果是否为成功 */
    private _isSuccess: boolean = false;

    /**
     * 设置成功状态，并更新界面文字
     */
    public setResult(isSuccess: boolean): void {
        this._isSuccess = isSuccess;

        if (this.resultLabel) {
            this.resultLabel.string = isSuccess ? '制作成功！' : '制作失败！';
        }

        this.successNode.active = isSuccess ? true : false;
        this.failNode.active = (!isSuccess) ? true : false;
    }

    start() {
        this.nextLevelBtn?.on(Node.EventType.TOUCH_END, this.onNextLevelBtnClick, this);
        this.restartBtn?.on(Node.EventType.TOUCH_END, this.onRestartLevelBtnClick, this);
        this.homelBtn?.on(Node.EventType.TOUCH_END, this.onShowHomePanel, this);
            
    }

    onDestroy() {
        this.nextLevelBtn?.off(Node.EventType.TOUCH_END, this.onNextLevelBtnClick, this);
        this.restartBtn?.off(Node.EventType.TOUCH_END, this.onRestartLevelBtnClick, this);  
        this.homelBtn?.off(Node.EventType.TOUCH_END, this.onShowHomePanel, this);
    }

    /**
     * nextLevelBtn 点击事件 - 进入下一关
     */
    private onNextLevelBtnClick(): void {
        GameManager.getInstance().currentLevel++;;
        this.loadLevel();
    }

    /**
     * restartBtn 点击事件 - 重新开始游戏
     */
    private onRestartLevelBtnClick(): void {
        this.loadLevel();
    }

    private loadLevel(){
        this.node.active = false;
        const gameManager = GameManager.getInstance();
        gameManager.levelMode.node.active = false;
        gameManager.menuManager.showProgressPanel();
        gameManager.menuManager.loadLevel(gameManager.currentLevel);
    }

    private onShowHomePanel(){
        this.node.active = false;
        const gameManager = GameManager.getInstance();
        gameManager.gameState = GameState.WAITING;
        gameManager.levelMode.node.active = false;
        gameManager.menuManager.node.active = true;
    }
}

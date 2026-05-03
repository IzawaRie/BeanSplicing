import { _decorator, Component, Label, Node, Sprite } from 'cc';
import { RoadLevelItem } from './RoadLevelItem';
import { RoadReward } from './RoadReward';
const { ccclass, property } = _decorator;

@ccclass('RoadController')
export class RoadController extends Component {

    @property({ type: Node })
    reward_btn: Node = null;

    @property({ type: Node })
    video_btn: Node = null;

    @property({ type: Node })
    reward_btn_point: Node = null;

    @property({ type: Node })
    reward_items_content: Node = null;

    @property({ type: Sprite })
    exp_sp: Sprite = null;

    @property({ type: Sprite })
    progress_sp: Sprite = null;

    @property({ type: Label })
    coin_number: Label = null;

    @property({ type: Label })
    time: Label = null;

    @property({ type: Label })
    exp: Label = null;

    @property({ type: Label })
    level: Label = null;

    @property({ type: Label })
    reward_tip: Label = null;

    @property({ type: Label })
    video_tip: Label = null;

    @property({ type: Label })
    reward_point_number: Label = null;

    @property({ type: RoadLevelItem })
    road_level_item: RoadLevelItem[] = [];

    private _experience: number = 0;

    public get experience(): number {
        return this._experience;
    }

    public set experience(value: number) {
        this._experience = Math.max(0, Math.floor(Number(value) || 0));
        this.updateExperienceLabel();
    }

    public addExperience(amount: number): void {
        if (amount <= 0) {
            return;
        }

        this.experience = this._experience + amount;
    }

    start() {
        this.updateExperienceLabel();
    }

    update(deltaTime: number) {
        
    }

    private updateExperienceLabel(): void {
        if (this.exp) {
            this.exp.string = `${this._experience}`;
        }
    }
}



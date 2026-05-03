import { _decorator, Component, Label, Node, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RoadReward')
export class RoadReward extends Component {

    @property({ type: Node })
    free_road_right: Node = null;

    @property({ type: Node })
    free_road_lock: Node = null;

    @property({ type: Node })
    video_road_right: Node = null;

    @property({ type: Node })
    video_road_lock: Node = null;

    @property({ type: Node })
    road_arrow_down: Node = null;

    @property({ type: Sprite })
    free_road_normal_border: Sprite = null;

    @property({ type: Sprite })
    video_road_normal_border: Sprite = null;

    @property({ type: Sprite })
    free_item_sp: Sprite = null;

    @property({ type: Sprite })
    video_item_sp: Sprite = null;

    @property({ type: Label })
    road_level: Label = null;

    @property({ type: Label })
    free_number: Label = null;

    @property({ type: Label })
    video_number: Label = null;

    start() {

    }

    update(deltaTime: number) {
        
    }
}



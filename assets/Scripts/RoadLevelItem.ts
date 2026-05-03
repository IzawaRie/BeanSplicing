import { _decorator, Component, Label, Node, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RoadLevelItem')
export class RoadLevelItem extends Component {

    @property({ type: Node })
    item_road_arrow_down: Node = null;

    @property({ type: Sprite })
    item_coin: Sprite = null;

    @property({ type: Label })
    item_level: Label = null;

    start() {

    }

    update(deltaTime: number) {
        
    }
}



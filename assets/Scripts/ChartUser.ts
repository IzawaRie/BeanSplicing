import { _decorator, Component, Label, Node, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ChartUser')
export class ChartUser extends Component {
    @property({ type: Node })
    medal_no1: Node = null;

    @property({ type: Node })
    medal_no2: Node = null;

    @property({ type: Node })
    medal_no3: Node = null;

    @property({ type: Sprite })
    owner_avatar_sprite: Sprite = null;

    @property({ type: Label })
    owner_name_label: Label = null;

    @property({ type: Label })
    owner_number_label: Label = null;

    @property({ type: Label })
    owner_level_label: Label = null;

    start() {

    }

    update(deltaTime: number) {
        
    }
}



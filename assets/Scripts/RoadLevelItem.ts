import { _decorator, Component, Label, Node, Sprite, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

const ROAD_ARROW_FLOAT_OFFSET_Y = 10;
const ROAD_ARROW_FLOAT_DURATION = 0.6;

@ccclass('RoadLevelItem')
export class RoadLevelItem extends Component {

    @property({ type: Node })
    item_road_arrow_down: Node = null;

    @property({ type: Sprite })
    item_coin: Sprite = null;

    @property({ type: Label })
    item_level: Label = null;

    private arrowBasePosition: Vec3 | null = null;

    start() {
        this.startArrowFloatAnimation();
    }

    onDestroy() {
        this.stopArrowFloatAnimation();
    }

    private startArrowFloatAnimation(): void {
        if (!this.item_road_arrow_down) {
            return;
        }

        tween(this.item_road_arrow_down).stop();
        this.arrowBasePosition = this.item_road_arrow_down.position.clone();
        const upPosition = this.arrowBasePosition.clone();
        upPosition.y += ROAD_ARROW_FLOAT_OFFSET_Y;

        tween(this.item_road_arrow_down)
            .to(ROAD_ARROW_FLOAT_DURATION, { position: upPosition }, { easing: 'sineInOut' })
            .to(ROAD_ARROW_FLOAT_DURATION, { position: this.arrowBasePosition }, { easing: 'sineInOut' })
            .union()
            .repeatForever()
            .start();
    }

    private stopArrowFloatAnimation(): void {
        if (!this.item_road_arrow_down) {
            return;
        }

        tween(this.item_road_arrow_down).stop();
        if (this.arrowBasePosition) {
            this.item_road_arrow_down.setPosition(this.arrowBasePosition);
        }
    }
}



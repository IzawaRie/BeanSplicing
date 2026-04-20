import { _decorator, Component, Node, tween, Tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

const SUBSCRIBE_OPEN_SCALE_FROM = 0.5;
const SUBSCRIBE_OPEN_SCALE_TO = 1;
const SUBSCRIBE_OPEN_ANIMATION_DURATION = 0.18;

@ccclass('SubscribeController')
export class SubscribeController extends Component {
    public openPanel(): void {
        const containerNode = this.node.parent ?? this.node;
        containerNode.active = true;
        this.node.active = true;
        this.playOpenAnimation();
    }

    private playOpenAnimation(): void {
        const animationTarget = this.node;
        if (!animationTarget) {
            return;
        }

        Tween.stopAllByTarget(animationTarget);
        animationTarget.setScale(new Vec3(SUBSCRIBE_OPEN_SCALE_FROM, SUBSCRIBE_OPEN_SCALE_FROM, 1));
        tween(animationTarget)
            .to(
                SUBSCRIBE_OPEN_ANIMATION_DURATION,
                { scale: new Vec3(SUBSCRIBE_OPEN_SCALE_TO, SUBSCRIBE_OPEN_SCALE_TO, 1) },
                { easing: 'backOut' }
            )
            .start();
    }
}


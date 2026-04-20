import { _decorator, Component, EventTouch, input, Input, Node, tween, Tween, UITransform, Vec2, Vec3 } from 'cc';
import { AudioManager } from './AudioManager';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

const SUBSCRIBE_OPEN_SCALE_FROM = 0.5;
const SUBSCRIBE_OPEN_SCALE_TO = 1;
const SUBSCRIBE_OPEN_ANIMATION_DURATION = 0.18;

@ccclass('SubscribeController')
export class SubscribeController extends Component {
    @property({ type: Node })
    sub_btn: Node = null;

    @property({ type: Node })
    sub_bg: Node = null;

    onLoad(): void {
        this.sub_btn?.on(Node.EventType.TOUCH_END, this.onSubscribeBtnClick, this);
    }

    onEnable(): void {
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onDisable(): void {
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onDestroy(): void {
        this.sub_btn?.off(Node.EventType.TOUCH_END, this.onSubscribeBtnClick, this);
    }

    public openPanel(): void {
        const containerNode = this.node.parent ?? this.node;
        containerNode.active = true;
        this.node.active = true;
        this.playOpenAnimation();
    }

    public closePanel(): void {
        const containerNode = this.node.parent ?? this.node;
        this.node.active = false;
        if (containerNode !== this.node) {
            containerNode.active = false;
        }
    }

    private onTouchEnd(event: EventTouch): void {
        const touch = event.touch;
        if (!touch) {
            return;
        }

        const touchPos = touch.getUILocation();
        if (this.isTouchInContentPanel(touchPos)) {
            return;
        }

        this.closePanel();
    }

    private onSubscribeBtnClick(): void {
        const gameManager = GameManager.getInstance();
        if (!gameManager?.wxManager) {
            return;
        }

        gameManager.vibrateShort();
        AudioManager.instance.playEffect('click_btn');

        const subscribeTask = (async () => {
            const wxManager = gameManager.wxManager;
            const templateId = wxManager.subscribeTemplateId?.trim() || '';
            if (!templateId) {
                return {
                    success: false,
                    error: 'subscribeTemplateId is empty'
                };
            }

            const subscribeResult = await wxManager.requestSubscribeMessage([templateId]);
            if (!subscribeResult.success) {
                return {
                    success: false,
                    error: subscribeResult.error || 'requestSubscribeMessage failed'
                };
            }

            const subscribeStatus = subscribeResult.result[templateId] || '';
            return {
                success: subscribeStatus === 'accept',
                error: subscribeStatus === 'accept' ? undefined : `subscribe status is ${subscribeStatus || 'unknown'}`
            };
        })();

        void subscribeTask.then((result) => {
            console.log('[Subscribe][SubscribeController] onSubscribeBtnClick result:', {
                success: !!result?.success,
                reason: result?.error || (result?.success ? 'success' : 'unknown')
            });

            if (result?.success) {
                gameManager.power += 30;
            }
            
            if (gameManager.menuManager?.sub_btn) {
                gameManager.menuManager.sub_btn.active = false;
            }
            this.closePanel();
        });
    }

    private isTouchInContentPanel(touchPos: Vec2): boolean {
        if (!this.sub_bg) {
            return false;
        }

        const contentTransform = this.sub_bg.getComponent(UITransform);
        if (!contentTransform) {
            return false;
        }

        return contentTransform.getBoundingBoxToWorld().contains(touchPos);
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

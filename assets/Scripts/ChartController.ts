import { _decorator, Component, Label, Node, Sprite } from 'cc';
import { DifficultyMode } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('ChartController')
export class ChartController extends Component {
    @property({ type: Node })
    simple_tag: Node = null;

    @property({ type: Node })
    medium_tag: Node = null;

    @property({ type: Node })
    hard_tag: Node = null;

    @property({ type: Node })
    close_btn: Node = null;

    @property({ type: Sprite })
    owner_avatar_sprite: Sprite = null;

    @property({ type: Label })
    owner_name_label: Label = null;

    @property({ type: Label })
    owner_number_label: Label = null;

    @property({ type: Label })
    owner_level_label: Label = null;

    @property({ type: Node })
    content: Node = null;

    onLoad() {
        this.cacheDifficultyTags();
    }

    private cacheDifficultyTags(): void {
        const chartGroup = this.node.getChildByName('phb_bg')?.getChildByName('phb_group');
        if (!chartGroup) return;

        if (!this.simple_tag) {
            this.simple_tag = chartGroup.getChildByName('phb_tag1');
        }
        if (!this.medium_tag) {
            this.medium_tag = chartGroup.getChildByName('phb_tag2');
        }
        if (!this.hard_tag) {
            this.hard_tag = chartGroup.getChildByName('phb_tag3');
        }
    }

    public getDifficultyTag(difficulty: DifficultyMode): Node | null {
        switch (difficulty) {
            case DifficultyMode.SIMPLE:
                return this.simple_tag;
            case DifficultyMode.MEDIUM:
                return this.medium_tag;
            case DifficultyMode.HARD:
                return this.hard_tag;
            default:
                return null;
        }
    }
}



import { _decorator, Component, Node, Sprite, Color, EventTouch, UITransform, Label, UIOpacity } from 'cc';
import { AudioManager } from './AudioManager';
import { GameManager, GameState } from './GameManager';
import { BlockController, BlockState } from './BlockController';

const { ccclass } = _decorator;

type FloodFillEntry = {
    block: Node;
    level: number;
    key: string;
};

@ccclass('CircleController')
export class CircleController extends Component {
    private static readonly PREVIEW_OPACITY = 140;

    private originalPos: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 };
    private originalScale: { x: number, y: number, z: number } = { x: 1, y: 1, z: 1 };
    private originalRotation: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 };

    private isDragging: boolean = false;

    private _colorIndex: number = 0;
    public get colorIndex(): number { return this._colorIndex; }

    private _colorR: number = 0;
    private _colorG: number = 0;
    private _colorB: number = 0;
    private _colorA: number = 0;

    private targetBlock: Node | null = null;
    private targetBlockIndex: number = 0;
    private hoverStartTime: number = 0;
    private isHovering: boolean = false;
    private readonly HOVER_DURATION: number = 500;
    private readonly HOVER_DELAY: number = 500;
    private readonly DRAG_OFFSET: number = 0;

    private circleNode: Node | null = null;
    private pointNode: Node | null = null;
    private previewedBlocks: FloodFillEntry[] = [];
    private readonly previewedBlockKeys = new Set<string>();
    private readonly currentRegionKeys = new Set<string>();

    private isGameActive(): boolean {
        const gameManager = GameManager.getInstance();
        return gameManager?.gameState === GameState.PLAYING;
    }

    onLoad() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    onDestroy() {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    update(_deltaTime: number) {
        if (!this.isHovering || !this.targetBlock || this.targetBlockIndex <= 0) {
            return;
        }

        const elapsed = Date.now() - this.hoverStartTime;
        if (elapsed < this.HOVER_DELAY) {
            this.updateProgress(0);
            return;
        }

        const actualElapsed = elapsed - this.HOVER_DELAY;
        const progress = actualElapsed / this.HOVER_DURATION;
        if (progress >= 1) {
            this.clearPreviewHighlight();
            const count = this.highlightBlocksByIndex(this.targetBlockIndex, true);
            if (count > 0) {
                GameManager.getInstance().levelMode?.onBlocksHighlighted(count);
            }
            this.resetHover();
            return;
        }

        this.updateProgress(progress);
    }

    public setCircleListNode() {
        this.circleNode = this.node.getChildByName('circle');

        const pos = this.node.position;
        this.originalPos = { x: pos.x, y: pos.y, z: pos.z };
        this.originalScale = { x: this.node.scale.x, y: this.node.scale.y, z: this.node.scale.z };
        this.originalRotation = { x: this.node.eulerAngles.x, y: this.node.eulerAngles.y, z: this.node.eulerAngles.z };

        this.pointNode = this.circleNode?.getChildByName('point') ?? null;
    }

    public setColor(r: number, g: number, b: number, a: number, colorIndex: number): void {
        this._colorR = r;
        this._colorG = g;
        this._colorB = b;
        this._colorA = a;
        this._colorIndex = colorIndex;

        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(r, g, b, a);
        }

        if (this.circleNode) {
            const circleSprite = this.circleNode.getComponent(Sprite);
            if (circleSprite) {
                circleSprite.color = new Color(r, g, b, a);
            }
        }
    }

    public getColor(): { r: number, g: number, b: number, a: number } {
        return { r: this._colorR, g: this._colorG, b: this._colorB, a: this._colorA };
    }

    public resetPosition(): void {
        this.node.setPosition(this.originalPos.x, this.originalPos.y, this.originalPos.z);
    }

    private resetHover(): void {
        this.clearPreviewHighlight();
        this.currentRegionKeys.clear();
        this.isHovering = false;
        this.targetBlock = null;
        this.targetBlockIndex = 0;
        this.hoverStartTime = 0;
        this.updateProgress(0);
    }

    private updateProgress(progress: number): void {
        if (!this.circleNode) return;

        let uiOpacity = this.circleNode.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = this.circleNode.addComponent(UIOpacity);
        }

        uiOpacity.opacity = Math.round(progress * 255);
    }

    private onTouchStart(event: EventTouch) {
        if (!this.isGameActive()) return;

        AudioManager.instance.playEffect('circle');

        this.isDragging = true;
        const gameManager = GameManager.getInstance();
        gameManager.levelMode.tutorialController?.pauseTutorial();

        if (this.circleNode) {
            this.circleNode.active = true;
        }

        this.node.setScale(1, -1, 1);

        const handSetting = GameManager.getInstance().hand_setting;
        const rotationZ = handSetting === -1 ? -50 : 50;
        this.node.setRotationFromEuler(0, 0, rotationZ);

        const pos = event.getUILocation();
        this.node.setWorldPosition(pos.x - this.DRAG_OFFSET, pos.y + this.DRAG_OFFSET, 0);
        this.resetHover();
    }

    private onTouchMove(event: EventTouch) {
        if (!this.isDragging || !this.pointNode) return;

        const pos = event.getUILocation();
        this.node.setWorldPosition(pos.x - this.DRAG_OFFSET, pos.y + this.DRAG_OFFSET, 0);

        const nodeWorldPos = this.pointNode.getWorldPosition();
        const newTargetBlock = this.getBlockAtPosition(nodeWorldPos.x, nodeWorldPos.y);
        if (!newTargetBlock) {
            this.resetHover();
            return;
        }

        const newTargetIndex = this.getBlockNumber(newTargetBlock);
        const blockController = newTargetBlock.getComponent(BlockController);
        if (!blockController || newTargetIndex <= 0) {
            this.resetHover();
            return;
        }

        if (blockController.state === BlockState.IRONED || blockController.state === BlockState.IRONING) {
            this.resetHover();
            return;
        }

        if (this.isBlockColorMatched(newTargetBlock)) {
            this.resetHover();
            return;
        }

        const previewBlocks = this.collectFloodFillBlocks(newTargetBlock);
        if (previewBlocks.length <= 0) {
            return;
        }

        if (this.isBlockInsideCurrentRegion(newTargetBlock)) {
            return;
        }

        this.resetHover();
        this.setCurrentRegion(previewBlocks);
        if (!this.isFloodFillRegionAlreadyHighlighted(previewBlocks)) {
            this.applyPreviewHighlight(previewBlocks);
        }
        this.isHovering = true;
        this.targetBlock = newTargetBlock;
        this.targetBlockIndex = newTargetIndex;
        this.hoverStartTime = Date.now();
    }

    private onTouchEnd(_event: EventTouch) {
        this.isDragging = false;

        const gameManager = GameManager.getInstance();
        gameManager.levelMode.tutorialController?.setPauseTime();
        this.node.setScale(this.originalScale.x, this.originalScale.y, this.originalScale.z);
        this.node.setRotationFromEuler(this.originalRotation.x, this.originalRotation.y, this.originalRotation.z);

        if (this.circleNode) {
            this.circleNode.active = false;
        }

        this.resetHover();
        this.resetPosition();
    }

    private getBlockAtPosition(worldX: number, worldY: number): Node | null {
        const gameManager = GameManager.getInstance();
        if (!gameManager || !gameManager.levelMode.gridDrawer) return null;

        const gridDrawer = gameManager.levelMode.gridDrawer;
        const blocks = gridDrawer.getAllBlocks();
        const bounds = gridDrawer.getContentBounds();
        if (!bounds) return null;

        if (worldX < bounds.minX || worldX > bounds.maxX || worldY < bounds.minY || worldY > bounds.maxY) {
            return null;
        }

        const directBlock = this.findBlockAtPosition(blocks, worldX, worldY);
        if (directBlock && this.getBlockNumber(directBlock) > 0) {
            return directBlock;
        }

        return null;
    }

    private findBlockAtPosition(blocks: Node[][], worldX: number, worldY: number): Node | null {
        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                const block = blocks[row][col];
                if (!block) continue;

                const blockWorldPos = block.getWorldPosition();
                const uiTransform = block.getComponent(UITransform);
                if (!uiTransform) continue;

                let scaleX = 1;
                let scaleY = 1;
                const scaledParent = block.parent?.parent ?? null;
                if (scaledParent) {
                    scaleX *= scaledParent.scale.x;
                    scaleY *= scaledParent.scale.y;
                }

                const width = uiTransform.width * scaleX;
                const height = uiTransform.height * scaleY;
                const halfW = width / 2;
                const halfH = height / 2;

                if (worldX >= blockWorldPos.x - halfW && worldX <= blockWorldPos.x + halfW &&
                    worldY >= blockWorldPos.y - halfH && worldY <= blockWorldPos.y + halfH) {
                    return block;
                }
            }
        }

        return null;
    }

    private getBlockNumber(block: Node): number {
        const numberNode = block.getChildByName('number');
        if (!numberNode) return 0;

        const label = numberNode.getComponent(Label);
        if (!label || !label.string) return 0;

        return parseInt(label.string) || 0;
    }

    private isBlockColorMatched(block: Node): boolean {
        const blockController = block.getComponent(BlockController);
        if (!blockController) {
            return false;
        }

        return blockController.currentColorR === this._colorR &&
            blockController.currentColorG === this._colorG &&
            blockController.currentColorB === this._colorB;
    }

    private getBlockColorIndex(block: Node): string {
        const numNode = block.getChildByName('number');
        if (!numNode) return '';

        const label = numNode.getComponent(Label);
        return label?.string ?? '';
    }

    private getBlockGridKey(block: Node | null): string {
        if (!block) {
            return '';
        }

        const blockController = block.getComponent(BlockController);
        if (!blockController) {
            return '';
        }

        const row = blockController['_row'] as number;
        const col = blockController['_col'] as number;
        if (typeof row !== 'number' || typeof col !== 'number') {
            return '';
        }

        return `${row},${col}`;
    }

    private isBlockInsideCurrentPreview(block: Node | null): boolean {
        const key = this.getBlockGridKey(block);
        return !!key && this.previewedBlockKeys.has(key);
    }

    private isBlockInsideCurrentRegion(block: Node | null): boolean {
        const key = this.getBlockGridKey(block);
        return !!key && this.currentRegionKeys.has(key);
    }

    private isFloodFillRegionAlreadyHighlighted(entries: FloodFillEntry[]): boolean {
        if (entries.length <= 0) {
            return false;
        }

        for (const entry of entries) {
            const blockController = entry.block.getComponent(BlockController);
            if (!blockController || blockController.state !== BlockState.HAS_CIRCLE) {
                return false;
            }
        }

        return true;
    }

    private collectFloodFillBlocks(startBlock: Node | null): FloodFillEntry[] {
        if (!startBlock) {
            return [];
        }

        const gameManager = GameManager.getInstance();
        const gridDrawer = gameManager?.levelMode?.gridDrawer;
        if (!gridDrawer) {
            return [];
        }

        const blocks = gridDrawer.getAllBlocks();
        if (!blocks || blocks.length === 0) {
            return [];
        }

        const targetColorIndex = this.getBlockColorIndex(startBlock);
        if (!targetColorIndex) {
            return [];
        }

        const startController = startBlock.getComponent(BlockController);
        if (!startController) {
            return [];
        }

        const startRow = startController['_row'] as number;
        const startCol = startController['_col'] as number;
        if (typeof startRow !== 'number' || typeof startCol !== 'number') {
            return [];
        }

        const rows = blocks.length;
        const columns = blocks[0]?.length ?? 0;
        const visited = new Set<string>();
        const entries: FloodFillEntry[] = [];
        const queue: [number, number, number][] = [[startRow, startCol, 0]];

        while (queue.length > 0) {
            const current = queue.shift();
            if (!current) {
                continue;
            }

            const [row, col, level] = current;
            if (row < 0 || row >= rows || col < 0 || col >= columns) {
                continue;
            }

            const key = `${row},${col}`;
            if (visited.has(key)) {
                continue;
            }

            const block = blocks[row]?.[col];
            if (!block) {
                continue;
            }

            const blockController = block.getComponent(BlockController);
            if (!blockController || blockController.targetColorA === 0) {
                continue;
            }

            if (blockController.state === BlockState.IRONED || blockController.state === BlockState.IRONING) {
                continue;
            }

            if (this.getBlockColorIndex(block) !== targetColorIndex) {
                continue;
            }

            visited.add(key);
            entries.push({ block, level, key });

            const dirs: [number, number][] = [
                [row - 1, col], [row + 1, col],
                [row, col - 1], [row, col + 1],
                [row - 1, col - 1], [row - 1, col + 1],
                [row + 1, col - 1], [row + 1, col + 1],
            ];

            for (const [nextRow, nextCol] of dirs) {
                const nextKey = `${nextRow},${nextCol}`;
                if (!visited.has(nextKey)) {
                    queue.push([nextRow, nextCol, level + 1]);
                }
            }
        }

        return entries;
    }

    private applyPreviewHighlight(previewBlocks: FloodFillEntry[]): void {
        this.previewedBlocks = previewBlocks;
        this.previewedBlockKeys.clear();

        for (const previewBlock of previewBlocks) {
            this.previewedBlockKeys.add(previewBlock.key);
            this.applyPreviewVisual(previewBlock.block);
        }
    }

    private setCurrentRegion(entries: FloodFillEntry[]): void {
        this.currentRegionKeys.clear();
        for (const entry of entries) {
            this.currentRegionKeys.add(entry.key);
        }
    }

    private applyPreviewVisual(block: Node): void {
        const circleNode = block.getChildByName('circle');
        if (!circleNode) {
            return;
        }

        const sprite = circleNode.getComponent(Sprite);
        if (!sprite) {
            return;
        }

        const sourceCircleSprite = this.circleNode?.getComponent(Sprite) ?? null;
        if (sourceCircleSprite?.spriteFrame) {
            sprite.spriteFrame = sourceCircleSprite.spriteFrame;
        }

        circleNode.active = true;
        sprite.enabled = true;
        sprite.color = new Color(this._colorR, this._colorG, this._colorB, this._colorA);

        let uiOpacity = circleNode.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = circleNode.addComponent(UIOpacity);
        }
        uiOpacity.opacity = CircleController.PREVIEW_OPACITY;
    }

    private restoreBlockCircleVisual(block: Node): void {
        const blockController = block.getComponent(BlockController);
        const circleNode = block.getChildByName('circle');
        if (!blockController || !circleNode) {
            return;
        }

        const sprite = circleNode.getComponent(Sprite);
        if (!sprite) {
            return;
        }

        let uiOpacity = circleNode.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = circleNode.addComponent(UIOpacity);
        }
        uiOpacity.opacity = 255;

        if (blockController.state === BlockState.HAS_CIRCLE) {
            circleNode.active = true;
            sprite.enabled = true;
            sprite.color = new Color(
                blockController.currentColorR,
                blockController.currentColorG,
                blockController.currentColorB,
                blockController.currentColorA >= 0 ? blockController.currentColorA : 255,
            );
            return;
        }

        sprite.enabled = false;
    }

    private clearPreviewHighlight(): void {
        if (this.previewedBlocks.length <= 0) {
            this.previewedBlockKeys.clear();
            return;
        }

        for (const previewBlock of this.previewedBlocks) {
            this.restoreBlockCircleVisual(previewBlock.block);
        }

        this.previewedBlocks = [];
        this.previewedBlockKeys.clear();
    }

    private highlightBlocksByIndex(_blockIndex: number, highlight: boolean): number {
        const gameManager = GameManager.getInstance();
        if (!this.targetBlock) return 0;

        const connectedBlocks = this.collectFloodFillBlocks(this.targetBlock);
        if (connectedBlocks.length <= 0) {
            return 0;
        }

        const levelMap: { block: Node; level: number; delta: number }[] = [];
        for (const connectedBlock of connectedBlocks) {
            const blockController = connectedBlock.block.getComponent(BlockController);
            if (!blockController) {
                continue;
            }

            let delta = 0;
            if (highlight) {
                if (blockController.state === BlockState.NO_CIRCLE) {
                    delta = 1;
                }
            } else if (blockController.state === BlockState.HAS_CIRCLE) {
                delta = -1;
            }

            levelMap.push({
                block: connectedBlock.block,
                level: connectedBlock.level,
                delta,
            });
        }

        if (levelMap.length <= 0) {
            return 0;
        }

        const totalDelta = levelMap.reduce((sum, item) => sum + item.delta, 0);

        const applyHighlight = (block: Node): boolean => {
            const blockController = block.getComponent(BlockController);
            const circleNode = block.getChildByName('circle');
            if (!blockController || !circleNode) {
                return false;
            }

            const sprite = circleNode.getComponent(Sprite);
            if (!sprite) {
                return false;
            }

            if (blockController.state === BlockState.IRONING || blockController.state === BlockState.IRONED) {
                sprite.enabled = false;
                return false;
            }

            let uiOpacity = circleNode.getComponent(UIOpacity);
            if (!uiOpacity) {
                uiOpacity = circleNode.addComponent(UIOpacity);
            }
            uiOpacity.opacity = 255;

            if (highlight) {
                circleNode.active = true;
                sprite.enabled = true;
                const circleSprite = this.circleNode?.getComponent(Sprite) ?? null;
                if (circleSprite?.spriteFrame) {
                    sprite.spriteFrame = circleSprite.spriteFrame;
                }
                sprite.color = new Color(this._colorR, this._colorG, this._colorB, this._colorA);
                blockController.setCurrentColor(this._colorR, this._colorG, this._colorB, this._colorA);
                blockController.state = BlockState.HAS_CIRCLE;
            } else {
                sprite.enabled = false;
                blockController.state = BlockState.NO_CIRCLE;
            }

            return true;
        };

        const delayPerLevel = 0.06;
        const triggeredLevels = new Set<number>();

        for (const { block, level } of levelMap) {
            const delay = level * delayPerLevel;
            if (delay === 0) {
                const applied = applyHighlight(block);
                if (applied && !triggeredLevels.has(0)) {
                    triggeredLevels.add(0);
                    AudioManager.instance.playEffect('boop', 1.5);
                    gameManager.vibrateShort();
                    gameManager.levelMode?.trySpawnCoinForHighlightedBlock(block, gameManager.levelMode.highlightCoinSpawnProbability);
                }
                continue;
            }

            setTimeout(() => {
                const applied = applyHighlight(block);
                if (applied && !triggeredLevels.has(level)) {
                    triggeredLevels.add(level);
                    AudioManager.instance.playEffect('boop', 1.5);
                    gameManager.vibrateShort();
                    gameManager.levelMode?.trySpawnCoinForHighlightedBlock(block, gameManager.levelMode.highlightCoinSpawnProbability);
                }
            }, delay * 1000);
        }

        return totalDelta;
    }
}

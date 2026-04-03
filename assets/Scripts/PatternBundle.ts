import { assetManager, JsonAsset } from 'cc';

const BUNDLE_NAME = 'patterns';

/**
 * 图案资源包加载器
 * 统一管理从 patterns bundle 加载 JSON 资源
 */
export class PatternBundle {
    private static _instance: PatternBundle | null = null;
    private bundle: any = null;
    private bundleLoading: Promise<any> | null = null;
    private loadedAssets: Map<string, JsonAsset> = new Map();

    public static getInstance(): PatternBundle {
        if (!PatternBundle._instance) {
            PatternBundle._instance = new PatternBundle();
        }
        return PatternBundle._instance;
    }

    /**
     * 加载 patterns bundle（异步等待）
     */
    public async loadBundle(): Promise<void> {
        if (this.bundle) return;
        if (this.bundleLoading) {
            await this.bundleLoading;
            return;
        }
        this.bundleLoading = new Promise<void>((resolve) => {
            assetManager.loadBundle(BUNDLE_NAME, (err, b) => {
                if (err) {
                    console.error('加载 patterns bundle 失败:', err);
                    this.bundleLoading = null;
                    resolve();
                    return;
                }
                this.bundle = b;
                this.bundleLoading = null;
                console.log('patterns bundle 加载成功');
                resolve();
            });
        });
        await this.bundleLoading;
    }

    /**
     * 从 bundle 加载 JSON 资源
     * @param bundlePath bundle 中的资源路径（不含扩展名），如 'apple'
     * @param callback 加载完成回调
     */
    public async loadJson(bundlePath: string): Promise<JsonAsset> {
        // 已缓存，直接返回
        const cached = this.loadedAssets.get(bundlePath);
        if (cached) return cached;

        // 等待 bundle 就绪
        await this.loadBundle();

        // 加载资源
        return new Promise<JsonAsset>((resolve) => {
            this.bundle.load(bundlePath, JsonAsset, (err: any, jsonAsset: JsonAsset) => {
                if (err) {
                    console.error(`加载图案 ${bundlePath} 失败:`, err);
                    resolve(null as any);
                    return;
                }
                this.loadedAssets.set(bundlePath, jsonAsset as JsonAsset);
                resolve(jsonAsset as JsonAsset);
            });
        });
    }
}

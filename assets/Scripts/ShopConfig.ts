import { JsonAsset, resources } from 'cc';

export type ShopCategoryId = 'supply' | 'prop' | 'decoration';

export interface ShopPriceRange {
    min: number;
    max: number;
}

export interface ShopConfigItem {
    id: string;
    name: string;
    priceRange: ShopPriceRange;
    imagePath: string;
}

export interface ShopCategoryConfig {
    id: ShopCategoryId;
    name: string;
    items: ShopConfigItem[];
}

export interface ShopConfigData {
    categories: ShopCategoryConfig[];
}

export interface ShopDisplayItem {
    id: string;
    name: string;
    price: number;
    imagePath: string;
    categoryId: ShopCategoryId;
    isPurchased: boolean;
}

export interface ShopRuntimeData {
    supply: ShopDisplayItem[];
    prop: ShopDisplayItem[];
    decoration: ShopDisplayItem[];
}

export class ShopConfig {
    private static instance: ShopConfig | null = null;
    private configData: ShopConfigData | null = null;
    private loadPromise: Promise<ShopConfigData | null> | null = null;

    public static getInstance(): ShopConfig {
        if (!ShopConfig.instance) {
            ShopConfig.instance = new ShopConfig();
        }
        return ShopConfig.instance;
    }

    public async loadConfig(): Promise<ShopConfigData | null> {
        if (this.configData) {
            return this.configData;
        }

        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = new Promise((resolve) => {
            resources.load('shop/shop_config', JsonAsset, (err, data) => {
                this.loadPromise = null;
                if (err) {
                    console.error('Failed to load shop config:', err);
                    resolve(null);
                    return;
                }

                this.configData = (data as JsonAsset).json as ShopConfigData;
                resolve(this.configData);
            });
        });

        return this.loadPromise;
    }

    public async getCategoryItems(categoryId: ShopCategoryId): Promise<ShopConfigItem[]> {
        const configData = await this.loadConfig();
        const category = configData?.categories?.find((item) => item.id === categoryId);
        return category?.items ?? [];
    }
}

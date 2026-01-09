export type RGBA01 = { r: number; g: number; b: number; a: number };
export type ColorKey = string; // "r,g,b,a" using 0-255 integers

export interface PaletteItem {
    key: ColorKey;
    rgba: RGBA01;
    hex: string;
    count: number;
    sources: Array<'fill' | 'stroke' | 'gradient-stop' | 'shadow'>;
}

export interface Metrics {
    visitedNodes: number;
    modifiedPaints?: number;
    modifiedEffects?: number;
    skipped: number;
    failed: number;
}

export interface ScanOptions {
    includeFills: boolean;
    includeStrokes: boolean;
    includeEffects: boolean;
}

export interface ApplyOptions {
    includeFills: boolean;
    includeStrokes: boolean;
    includeEffects: boolean; // 保持兼容，内部逻辑拆分
    // V2 New Options
    keepWhite: boolean;
    keepBlack: boolean;
    keepGray: boolean;
    // 细化的 Effect 控制 (可选，如果 includeEffects 为 true 则这两个都为 true)
    includeInnerShadows?: boolean;
    includeDropShadows?: boolean;
}

// UI -> Main Messages
export interface ScanRequest {
    type: 'SCAN_REQUEST';
    options: {
        includeFills: boolean;
        includeStrokes: boolean;
        includeEffects: boolean;
    };
}
export interface ApplyRequest {
    type: 'APPLY_REQUEST';
    satDelta: number;
    lightDelta: number;
    hueDelta: number; // New in V2: 0-360
    options: ApplyOptions;
}

export type PluginMessage = ScanRequest | ApplyRequest;

// Main -> UI Messages
export interface UIMessage {
    type: 'SCAN_RESULT' | 'APPLY_RESULT' | 'ERROR' | 'PROGRESS';
    palette?: PaletteItem[];
    metrics?: Metrics;
    message?: string;
    processed?: number;
    total?: number;
}

export interface ScanResult extends UIMessage {
    type: 'SCAN_RESULT';
    palette: PaletteItem[];
    metrics: Metrics;
}

export interface ApplyResult extends UIMessage {
    type: 'APPLY_RESULT';
    metrics: Metrics;
}

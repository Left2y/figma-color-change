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
    includeEffects: boolean;
}

// UI -> Main Messages
export type ScanRequest = { type: 'SCAN_REQUEST'; options: ScanOptions };
export type ApplyRequest = {
    type: 'APPLY_REQUEST';
    options: ApplyOptions;
    satDelta: number;   // -1 ~ +1
    lightDelta: number; // -1 ~ +1
};

export type PluginMessage = ScanRequest | ApplyRequest;

// Main -> UI Messages
export type ScanResult = { type: 'SCAN_RESULT'; palette: PaletteItem[]; metrics: Metrics };
export type ApplyResult = { type: 'APPLY_RESULT'; metrics: Metrics };
export type Progress = { type: 'PROGRESS'; processed: number; total?: number };
export type ErrorMsg = { type: 'ERROR'; message: string };

export type UIMessage = ScanResult | ApplyResult | Progress | ErrorMsg;

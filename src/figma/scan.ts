import { PaletteItem, ScanOptions, Metrics, RGBA01 } from '../shared/types';
import { traverse } from './traverse';
import { toColorKey, toHex } from '../shared/color-utils';

function almostEqual(a: number, b: number) {
    return Math.abs(a - b) < 0.001;
}

export function scanSelection(selection: readonly SceneNode[], options: ScanOptions): { palette: PaletteItem[], metrics: Metrics } {
    const paletteMap = new Map<string, PaletteItem>();
    const metrics: Metrics = { visitedNodes: 0, skipped: 0, failed: 0 };

    if (selection.length === 0) return { palette: [], metrics };

    const root = selection[0]; // Only process the first selected node as root per spec

    traverse(root, (node) => {
        metrics.visitedNodes++;

        // Helper to process a color
        const processColor = (color: RGB, opacity: number, source: PaletteItem['sources'][0]) => {
            // Figma RGB is 0-1
            const r = color.r;
            const g = color.g;
            const b = color.b;
            const a = opacity;

            const key = toColorKey(r, g, b, a);
            if (!paletteMap.has(key)) {
                paletteMap.set(key, {
                    key,
                    rgba: { r, g, b, a },
                    hex: toHex(r, g, b),
                    count: 0,
                    sources: []
                });
            }

            const item = paletteMap.get(key)!;
            item.count++;
            if (!item.sources.includes(source)) {
                item.sources.push(source);
            }
        };

        try {
            // 1. Fills
            if (options.includeFills && 'fills' in node) {
                const fills = node.fills;
                if (fills === figma.mixed) {
                    metrics.skipped++;
                } else {
                    for (const paint of fills as Paint[]) {
                        if (!paint.visible) continue;
                        if (paint.type === 'SOLID') {
                            processColor(paint.color, paint.opacity ?? 1, 'fill');
                        } else if (paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL' || paint.type === 'GRADIENT_ANGULAR' || paint.type === 'GRADIENT_DIAMOND') {
                            for (const stop of paint.gradientStops) {
                                processColor(stop.color, stop.color.a, 'gradient-stop');
                            }
                        }
                    }
                }
            }

            // 2. Strokes
            if (options.includeStrokes && 'strokes' in node) {
                const strokes = node.strokes;
                if (strokes === figma.mixed) {
                    metrics.skipped++;
                } else {
                    for (const paint of strokes as Paint[]) {
                        if (!paint.visible) continue;
                        if (paint.type === 'SOLID') {
                            processColor(paint.color, paint.opacity ?? 1, 'stroke');
                        } else if (paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL' || paint.type === 'GRADIENT_ANGULAR' || paint.type === 'GRADIENT_DIAMOND') {
                            for (const stop of paint.gradientStops) {
                                processColor(stop.color, stop.color.a, 'gradient-stop');
                            }
                        }
                    }
                }
            }

            // 3. Effects
            if (options.includeEffects && 'effects' in node) {
                const effects = node.effects;
                if (effects === figma.mixed) {
                    metrics.skipped++;
                } else {
                    for (const effect of effects as Effect[]) {
                        if (!effect.visible) continue;
                        if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
                            // Effect color has 'a' inside it
                            const { r, g, b, a } = effect.color;
                            processColor({ r, g, b }, a, 'shadow');
                        }
                    }
                }
            }

        } catch (e) {
            metrics.failed++;
            console.error('Scan error on node', node.name, e);
        }
    });

    const palette = Array.from(paletteMap.values()).sort((a, b) => b.count - a.count);
    return { palette, metrics };
}

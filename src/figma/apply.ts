import { ApplyOptions, Metrics } from '../shared/types';
import { traverse } from './traverse';
import { adjustColor } from '../color/color-adjust';

export function applyChanges(
    selection: readonly SceneNode[],
    satDelta: number,
    lightDelta: number,
    hueDelta: number,
    options: ApplyOptions,
    reportProgress: (processed: number, total: number) => void
): Metrics {

    const metrics: Metrics = { visitedNodes: 0, modifiedPaints: 0, modifiedEffects: 0, skipped: 0, failed: 0 };

    if (selection.length === 0) return metrics;

    let totalNodes = 0;
    const root = selection[0];
    traverse(root, () => totalNodes++);

    metrics.visitedNodes = 0;

    traverse(root, (node) => {
        metrics.visitedNodes++;
        if (metrics.visitedNodes % 50 === 0) {
            reportProgress(metrics.visitedNodes, totalNodes);
        }

        try {
            // 1. Fills
            if (options.includeFills && 'fills' in node) {
                const currentFills = node.fills;
                if (currentFills === figma.mixed) {
                    metrics.skipped++;
                } else if (Array.isArray(currentFills)) {
                    const fills: Paint[] = [];
                    let modified = false;

                    for (const paint of currentFills) {
                        if (!paint.visible) {
                            fills.push(paint);
                            continue;
                        }

                        if (paint.type === 'SOLID') {
                            const adjusted = adjustColor({ ...paint.color, a: paint.opacity ?? 1 }, satDelta, lightDelta, hueDelta, options);
                            fills.push({
                                ...paint,
                                color: { r: adjusted.r, g: adjusted.g, b: adjusted.b }
                            });
                            modified = true;
                            metrics.modifiedPaints!++;

                        } else if (paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL' || paint.type === 'GRADIENT_ANGULAR' || paint.type === 'GRADIENT_DIAMOND') {
                            const newStops = paint.gradientStops.map(stop => {
                                const adjusted = adjustColor(stop.color, satDelta, lightDelta, hueDelta, options);
                                return { ...stop, color: adjusted };
                            });
                            fills.push({ ...paint, gradientStops: newStops });
                            modified = true;
                            metrics.modifiedPaints!++;
                        } else {
                            fills.push(paint);
                        }
                    }

                    if (modified) {
                        node.fills = fills;
                    }
                }
            }

            // 2. Strokes
            if (options.includeStrokes && 'strokes' in node) {
                const currentStrokes = node.strokes;
                if (currentStrokes === figma.mixed) {
                    metrics.skipped++;
                } else if (Array.isArray(currentStrokes)) {
                    const strokes: Paint[] = [];
                    let modified = false;

                    for (const paint of currentStrokes) {
                        if (!paint.visible) {
                            strokes.push(paint);
                            continue;
                        }

                        if (paint.type === 'SOLID') {
                            const adjusted = adjustColor({ ...paint.color, a: paint.opacity ?? 1 }, satDelta, lightDelta, hueDelta, options);
                            strokes.push({
                                ...paint,
                                color: { r: adjusted.r, g: adjusted.g, b: adjusted.b }
                            });
                            modified = true;
                            metrics.modifiedPaints!++;

                        } else if (paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL' || paint.type === 'GRADIENT_ANGULAR' || paint.type === 'GRADIENT_DIAMOND') {
                            const newStops = paint.gradientStops.map(stop => {
                                const adjusted = adjustColor(stop.color, satDelta, lightDelta, hueDelta, options);
                                return { ...stop, color: adjusted };
                            });
                            strokes.push({ ...paint, gradientStops: newStops });
                            modified = true;
                            metrics.modifiedPaints!++;
                        } else {
                            strokes.push(paint);
                        }
                    }

                    if (modified) {
                        node.strokes = strokes;
                    }
                }
            }

            // 3. Effects (阴影)
            if (options.includeEffects && 'effects' in node) {
                const currentEffects = node.effects;
                if (currentEffects === figma.mixed) {
                    metrics.skipped++;
                } else if (Array.isArray(currentEffects)) {
                    const effects: Effect[] = [];
                    let modified = false;

                    for (const effect of currentEffects) {
                        if (effect.visible === false) {
                            effects.push(effect);
                            continue;
                        }

                        // 细分控制逻辑
                        let shouldProcess = false;
                        if (effect.type === 'DROP_SHADOW') {
                            // 如果 options.includeDropShadows 未定义，则默认为 true (兼容 includeEffects)
                            shouldProcess = options.includeDropShadows !== false;
                        } else if (effect.type === 'INNER_SHADOW') {
                            shouldProcess = options.includeInnerShadows !== false;
                        }

                        if (shouldProcess && (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW')) {
                            const shadowEffect = effect as DropShadowEffect | InnerShadowEffect;
                            const adjusted = adjustColor(shadowEffect.color, satDelta, lightDelta, hueDelta, options);
                            // 创建新的 effect 对象
                            effects.push({
                                ...shadowEffect,
                                color: adjusted
                            } as Effect);
                            modified = true;
                            metrics.modifiedEffects!++;
                        } else {
                            effects.push(effect);
                        }
                    }

                    if (modified) {
                        node.effects = effects;
                    }
                }
            }

        } catch (e) {
            metrics.failed++;
            console.error('Apply error on node', node.name, e);
        }
    });

    return metrics;
}

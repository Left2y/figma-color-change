
// --- Shared Utils ---
function toColorKey(r, g, b, a = 1) {
    const R = Math.round(r * 255);
    const G = Math.round(g * 255);
    const B = Math.round(b * 255);
    const A = Math.round(a * 255);
    return `${R},${G},${B},${A}`;
}

function toHex(r, g, b) {
    const toHexVal = (n) => {
        const hex = Math.round(n * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHexVal(r)}${toHexVal(g)}${toHexVal(b)}`.toUpperCase();
}

// --- Color Model ---
function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
}

function rgbToHsl(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
    }

    return { h, s, l };
}

function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h / 360 + 1 / 3);
        g = hue2rgb(p, q, h / 360);
        b = hue2rgb(p, q, h / 360 - 1 / 3);
    }

    return { r, g, b };
}

// --- Color Adjust ---
function shouldKeepColor(hsl, options) {
    const { s, l } = hsl;

    // 保留白色 (极高亮)
    if (options.keepWhite && l > 0.98) return true;

    // 保留黑色 (极暗)
    if (options.keepBlack && l < 0.02) return true;

    // 保留灰色 (低饱和)
    if (options.keepGray && s < 0.03) return true;

    return false;
}

function adjustColor(
    color,
    satDelta,
    lightDelta,
    hueDelta,
    options
) {
    const { h, s, l } = rgbToHsl(color.r, color.g, color.b);

    // 1. 检查是否保留颜色
    if (shouldKeepColor({ h, s, l }, options)) {
        return color; // 原样返回
    }

    // 2. 调整色相 (Hue)
    // 确保 hue 始终在 0-360 范围内
    let newH = (h + hueDelta) % 360;
    if (newH < 0) newH += 360;

    // 3. 调整饱和度 (Saturation)
    const isAchromatic = s < 0.01;
    let newS = s;

    if (!isAchromatic || hueDelta !== 0) {
        // 如果是有彩色，或者用户正在旋转色相（意图着色），则应用饱和度变化
        newS = clamp(s + satDelta, 0, 1);
    }

    // 一键去饱和逻辑：如果 satDelta 是 -1，强制 S=0
    if (satDelta <= -0.99) {
        newS = 0;
    }

    // 4. 调整明度 (Lightness)
    const newL = clamp(l + lightDelta, 0, 1);

    // 转换回 RGB
    const { r, g, b } = hslToRgb(newH, newS, newL);

    return {
        r: clamp(r, 0, 1),
        g: clamp(g, 0, 1),
        b: clamp(b, 0, 1),
        a: color.a
    };
}

// --- Traverse ---
function traverse(node, callback) {
    callback(node);
    if ('children' in node) {
        for (const child of node.children) {
            traverse(child, callback);
        }
    }
}

function collectNodes(root) {
    const nodes = [];
    traverse(root, (node) => nodes.push(node));
    return nodes;
}

// --- Scan ---
function almostEqual(a, b) {
    return Math.abs(a - b) < 0.001;
}

function scanSelection(selection, options) {
    const paletteMap = new Map();
    const metrics = { visitedNodes: 0, skipped: 0, failed: 0 };

    if (selection.length === 0) return { palette: [], metrics };

    const root = selection[0]; // Only process the first selected node as root per spec

    traverse(root, (node) => {
        metrics.visitedNodes++;

        // Helper to process a color
        const processColor = (color, opacity, source) => {
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

            const item = paletteMap.get(key);
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
                    for (const paint of fills) {
                        if (!paint.visible) continue;
                        if (paint.type === 'SOLID') {
                            const opacity = paint.opacity !== undefined ? paint.opacity : 1;
                            processColor(paint.color, opacity, 'fill');
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
                    for (const paint of strokes) {
                        if (!paint.visible) continue;
                        if (paint.type === 'SOLID') {
                            const opacity = paint.opacity !== undefined ? paint.opacity : 1;
                            processColor(paint.color, opacity, 'stroke');
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
                    for (const effect of effects) {
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

// --- Apply ---
function applyChanges(
    selection,
    satDelta,
    lightDelta,
    hueDelta,
    colorMapping,
    options,
    reportProgress
) {

    const metrics = { visitedNodes: 0, modifiedPaints: 0, modifiedEffects: 0, skipped: 0, failed: 0 };

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
                    const fills = [];
                    let modified = false;

                    for (const paint of currentFills) {
                        if (!paint.visible) {
                            fills.push(paint);
                            continue;
                        }

                        if (paint.type === 'SOLID') {
                            const opacity = paint.opacity !== undefined ? paint.opacity : 1;
                            // FIXED: Removed object spread ...paint.color
                            const colorForAdjust = Object.assign({}, paint.color, { a: opacity });
                            const adjusted = adjustColor(colorForAdjust, satDelta, lightDelta, hueDelta, options);

                            // FIXED: Removed object spread ...paint
                            const newPaint = Object.assign({}, paint, {
                                color: { r: adjusted.r, g: adjusted.g, b: adjusted.b }
                            });
                            fills.push(newPaint);
                            modified = true;
                            metrics.modifiedPaints++;

                        } else if (paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL' || paint.type === 'GRADIENT_ANGULAR' || paint.type === 'GRADIENT_DIAMOND') {
                            const newStops = paint.gradientStops.map(stop => {
                                const { r, g, b, a } = stop.color;
                                const key = toColorKey(r, g, b, a);
                                const effectiveHueDelta = (colorMapping && colorMapping[key] !== undefined)
                                    ? colorMapping[key]
                                    : hueDelta;

                                const adjusted = adjustColor(stop.color, satDelta, lightDelta, effectiveHueDelta, options);
                                // FIXED: Removed object spread ...stop
                                return Object.assign({}, stop, { color: adjusted });
                            });
                            // FIXED: Removed object spread ...paint
                            const newPaint = Object.assign({}, paint, { gradientStops: newStops });
                            fills.push(newPaint);
                            modified = true;
                            metrics.modifiedPaints++;
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
                    const strokes = [];
                    let modified = false;

                    for (const paint of currentStrokes) {
                        if (!paint.visible) {
                            strokes.push(paint);
                            continue;
                        }

                        if (paint.type === 'SOLID') {
                            const { r, g, b } = paint.color;
                            const opacity = paint.opacity !== undefined ? paint.opacity : 1;
                            const key = toColorKey(r, g, b, opacity);

                            const effectiveHueDelta = (colorMapping && colorMapping[key] !== undefined)
                                ? colorMapping[key]
                                : hueDelta;

                            // FIXED: Removed object spread ...paint.color
                            const colorForAdjust = Object.assign({}, paint.color, { a: opacity });
                            const adjusted = adjustColor(colorForAdjust, satDelta, lightDelta, effectiveHueDelta, options);

                            // FIXED: Removed object spread ...paint
                            const newPaint = Object.assign({}, paint, {
                                color: { r: adjusted.r, g: adjusted.g, b: adjusted.b }
                            });
                            strokes.push(newPaint);
                            modified = true;
                            metrics.modifiedPaints++;

                        } else if (paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL' || paint.type === 'GRADIENT_ANGULAR' || paint.type === 'GRADIENT_DIAMOND') {
                            const newStops = paint.gradientStops.map(stop => {
                                const { r, g, b, a } = stop.color;
                                const key = toColorKey(r, g, b, a);
                                const effectiveHueDelta = (colorMapping && colorMapping[key] !== undefined)
                                    ? colorMapping[key]
                                    : hueDelta;

                                const adjusted = adjustColor(stop.color, satDelta, lightDelta, effectiveHueDelta, options);
                                // FIXED: Removed object spread ...stop
                                return Object.assign({}, stop, { color: adjusted });
                            });
                            // FIXED: Removed object spread ...paint
                            const newPaint = Object.assign({}, paint, { gradientStops: newStops });
                            strokes.push(newPaint);
                            modified = true;
                            metrics.modifiedPaints++;
                        } else {
                            strokes.push(paint);
                        }
                    }

                    if (modified) {
                        node.strokes = strokes;
                    }
                }
            }

            // 3. Effects
            if (options.includeEffects && 'effects' in node) {
                const currentEffects = node.effects;
                if (currentEffects === figma.mixed) {
                    metrics.skipped++;
                } else if (Array.isArray(currentEffects)) {
                    const effects = [];
                    let modified = false;

                    for (const effect of currentEffects) {
                        if (effect.visible === false) {
                            effects.push(effect);
                            continue;
                        }

                        let shouldProcess = false;
                        if (effect.type === 'DROP_SHADOW') {
                            shouldProcess = options.includeDropShadows !== false;
                        } else if (effect.type === 'INNER_SHADOW') {
                            shouldProcess = options.includeInnerShadows !== false;
                        }

                        if (shouldProcess && (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW')) {
                            const shadowEffect = effect;

                            const { r, g, b, a } = shadowEffect.color;
                            const key = toColorKey(r, g, b, a);
                            const effectiveHueDelta = (colorMapping && colorMapping[key] !== undefined)
                                ? colorMapping[key]
                                : hueDelta;

                            const adjusted = adjustColor(shadowEffect.color, satDelta, lightDelta, effectiveHueDelta, options);
                            // FIXED: Removed object spread ...shadowEffect
                            const newEffects = Object.assign({}, shadowEffect, {
                                color: adjusted
                            });
                            effects.push(newEffects);
                            modified = true;
                            metrics.modifiedEffects++;
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

// --- Main ---

console.log("Plugin started");
figma.showUI(__html__, { width: 300, height: 530 });

// 自动扫描函数 - 当选择变化时调用
function autoScan() {
    var selection = figma.currentPage.selection;
    if (selection.length === 0) {
        // 没有选中任何元素，发送空结果
        figma.ui.postMessage({
            type: 'SCAN_RESULT',
            palette: [],
            metrics: { visitedNodes: 0, skipped: 0, failed: 0 }
        });
        return;
    }

    try {
        var options = {
            includeFills: true,
            includeStrokes: true,
            includeEffects: true
        };
        var result = scanSelection(selection, options);
        figma.ui.postMessage({
            type: 'SCAN_RESULT',
            palette: result.palette,
            metrics: result.metrics
        });
    } catch (e) {
        figma.ui.postMessage({ type: 'ERROR', message: e.message });
    }
}

// 监听选择变化事件 - 当用户点击不同的 frame/元素时自动扫描
figma.on('selectionchange', function () {
    console.log('Selection changed, auto-scanning...');
    autoScan();
});

figma.ui.onmessage = async (msg) => {
    if (msg.type === 'SCAN_REQUEST') {
        console.log('Main received SCAN_REQUEST', msg.options);

        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
            figma.ui.postMessage({ type: 'ERROR', message: 'Please select a frame first.' });
            return;
        }

        try {
            const { palette, metrics } = scanSelection(selection, msg.options);
            const result = {
                type: 'SCAN_RESULT',
                palette,
                metrics
            };
            figma.ui.postMessage(result);
        } catch (e) {
            figma.ui.postMessage({ type: 'ERROR', message: e.message });
        }

    } else if (msg.type === 'APPLY_REQUEST') {
        console.log('Main received APPLY_REQUEST', msg.satDelta, msg.lightDelta);

        const selection = figma.currentPage.selection;
        if (selection.length === 0) return;

        try {
            // Execute apply logic
            const metrics = applyChanges(
                selection,
                msg.satDelta,
                msg.lightDelta,
                msg.hueDelta,
                msg.colorMapping, // V2.1
                msg.options,
                (processed, total) => {
                    figma.ui.postMessage({ type: 'PROGRESS', processed, total });
                }
            );

            const result = {
                type: 'APPLY_RESULT',
                metrics
            };
            figma.ui.postMessage(result);

            // Apply 成功后，自动重新扫描并更新 UI 的 originalColors
            // 这样"重置"按钮才能正确回到最新的颜色状态
            setTimeout(function () {
                autoScan();
            }, 100);

        } catch (e) {
            figma.ui.postMessage({ type: 'ERROR', message: e.message });
        }
    }
};

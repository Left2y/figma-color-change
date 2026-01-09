import { RGBA01, ApplyOptions } from '../shared/types';
import { rgbToHsl, hslToRgb, clamp } from './color-model';

/**
 * 判断颜色是否应该被保留（不修改）
 */
function shouldKeepColor(hsl: { h: number, s: number, l: number }, options: ApplyOptions): boolean {
    const { s, l } = hsl;

    // 保留白色 (极高亮)
    if (options.keepWhite && l > 0.98) return true;

    // 保留黑色 (极暗)
    if (options.keepBlack && l < 0.02) return true;

    // 保留灰色 (低饱和)
    if (options.keepGray && s < 0.03) return true;

    return false;
}

export function adjustColor(
    color: RGBA01,
    satDelta: number,
    lightDelta: number,
    hueDelta: number,
    options: ApplyOptions
): RGBA01 {
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
    // 逻辑优化：如果是无彩色(S=0)且没有强制保留，增加饱和度时如果不给色相，它仍然是灰的。
    // 在 V2 中，如果用户调整了色相，说明他们想给灰色上色。
    // 但如果只是调整饱和度，对灰色还是没用。
    // 如果 hueDelta != 0，我们假设用户想给灰色“着色”，所以此时允许饱和度增加。
    // 否则保持 V1 的逻辑：对无彩色不增加饱和度。

    const isAchromatic = s < 0.01;
    let newS = s;

    if (!isAchromatic || hueDelta !== 0) {
        // 如果是有彩色，或者用户正在旋转色相（意图着色），则应用饱和度变化
        newS = clamp(s + satDelta, 0, 1);

        // 如果原本是灰色但有了色相旋转，且新饱和度仍为0，可能用户想把灰色变成有彩色？
        // 如果 satDelta > 0 且 isAchromatic，我们给它一个基础饱和度？
        // 暂时简单处理：只做加法。如果S=0，satDelta=0，结果还是0。
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

import { RGBA01 } from '../shared/types';
import { rgbToHsl, hslToRgb, clamp } from './color-model';

// satDelta / lightDelta 的值通常在 -1 到 +1 之间
// V1 逻辑：加法调整 (S = S + delta)
export function adjustColor(color: RGBA01, satDelta: number, lightDelta: number): RGBA01 {
    const { h, s, l } = rgbToHsl(color.r, color.g, color.b);

    // 关键优化：对于无彩色（饱和度接近 0），不应用饱和度调整
    // 因为无彩色没有有效的色相信息，强行增加饱和度会导致颜色偏移
    const isAchromatic = s < 0.01; // 容差值，处理浮点误差

    let newS = s;
    if (!isAchromatic) {
        // 只对有彩色应用饱和度调整
        newS = clamp(s + satDelta, 0, 1);
    }

    // 明度调整始终生效
    const newL = clamp(l + lightDelta, 0, 1);

    const { r, g, b } = hslToRgb(h, newS, newL);

    return {
        r: clamp(r, 0, 1),
        g: clamp(g, 0, 1),
        b: clamp(b, 0, 1),
        a: color.a // Alpha 保持不变
    };
}

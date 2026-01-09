export interface RGB { r: number; g: number; b: number; }
export interface RGBA extends RGB { a: number; }

export function toColorKey(r: number, g: number, b: number, a: number = 1): string {
    const R = Math.round(r * 255);
    const G = Math.round(g * 255);
    const B = Math.round(b * 255);
    const A = Math.round(a * 255);
    return `${R},${G},${B},${A}`;
}

export function toHex(r: number, g: number, b: number): string {
    const toHexVal = (n: number) => {
        const hex = Math.round(n * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHexVal(r)}${toHexVal(g)}${toHexVal(b)}`.toUpperCase();
}

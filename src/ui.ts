import { UIMessage, ScanRequest, ApplyRequest, ApplyOptions, PaletteItem } from './shared/types';
import { toColorKey } from './shared/color-utils';

// Declare iro global
declare const iro: any;

let colorPicker: any;
let hasScanned = false;

// UI Elements
const wheelContainer = document.getElementById('wheel-container')!;
const lockBtn = document.getElementById('lock-btn')!;
const satRange = document.getElementById('sat-range') as HTMLInputElement;
const lightRange = document.getElementById('light-range') as HTMLInputElement;
const satVal = document.getElementById('sat-val')!;
const lightVal = document.getElementById('light-val')!;
const applyBtn = document.getElementById('apply-btn')!;
const statsDiv = document.getElementById('stats')!;
const errorDiv = document.getElementById('error-msg')!;

const settingsBtn = document.getElementById('settings-btn')!;
const closeSettingsBtn = document.getElementById('close-settings')!;
const settingsPanel = document.getElementById('settings-panel')!;
const settingsOverlay = document.getElementById('settings-overlay')!;

// Settings Inputs
const keepWhiteCb = document.getElementById('keep-white') as HTMLInputElement;
const keepBlackCb = document.getElementById('keep-black') as HTMLInputElement;
const keepGrayCb = document.getElementById('keep-gray') as HTMLInputElement;
const scopeFillsCb = document.getElementById('scope-fills') as HTMLInputElement;
const scopeStrokesCb = document.getElementById('scope-strokes') as HTMLInputElement;
const scopeInnerShadowCb = document.getElementById('scope-inner-shadow') as HTMLInputElement;
const scopeDropShadowCb = document.getElementById('scope-drop-shadow') as HTMLInputElement;

// Top Actions
const desaturateBtn = document.getElementById('desaturate-btn')!;
const resetBtn = document.getElementById('reset-btn')!;

// State
let currentSat = 0;
let currentLight = 0;

let isLinked = true;
let currentHueDelta = 0; // Global delta
let hueDeltas: { [key: string]: number } = {}; // Individual overrides { key: delta }

// Store original HSL values of the palette to calculate delta
// Added 'key' to identify specific colors
let originalColors: { h: number, s: number, l: number, key: string }[] = [];
let activeIndex = -1; // Index of the color being dragged

// Initialize Iro JS Color Wheel
function initColorWheel() {
    colorPicker = new iro.ColorPicker("#wheel-container", {
        width: 160,
        borderWidth: 2,
        borderColor: "#fff",
        layout: [
            {
                component: iro.ui.Wheel,
                options: {}
            }
        ]
    });

    // --- Interaction Logic ---

    // 1. When specific handle starts dragging
    colorPicker.on('input:start', (color: any) => {
        activeIndex = color.index;
    });

    // 2. When dragging
    colorPicker.on('input:move', (color: any) => {
        if (activeIndex === -1 || !originalColors.length) return;

        const currentH = color.hsl.h;
        const original = originalColors[activeIndex];
        const originalH = original.h;

        let delta = currentH - originalH;

        if (isLinked) {
            // LINKED MODE: Global Rotation
            currentHueDelta = delta;
            hueDeltas = {}; // Clear individual overrides

            // Update all OTHER colors
            colorPicker.colors.forEach((c: any, index: number) => {
                if (index !== activeIndex) {
                    let newH = (originalColors[index].h + delta) % 360;
                    if (newH < 0) newH += 360;
                    c.hsl = { h: newH, s: originalColors[index].s, l: originalColors[index].l };
                }
            });
        } else {
            // UNLINKED MODE: Individual Adjustment
            hueDeltas[original.key] = delta;
            // Only the dragged handle updates (handled by iro.js internally)
        }
    });

    colorPicker.on('input:end', () => {
    });
}

// Convert palette item's RGBA to HSL for display
function rgbToHsl(r: number, g: number, b: number) {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
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
    return { h: h < 0 ? h + 360 : h, s: s * 100, l: l * 100 };
}

function scan() {
    const msg: ScanRequest = {
        type: 'SCAN_REQUEST',
        options: {
            includeFills: true,
            includeStrokes: true,
            includeEffects: true
        }
    };
    parent.postMessage({ pluginMessage: msg }, '*');

    errorDiv.textContent = '';
    statsDiv.textContent = 'Scanning...';
}

function reset() {
    currentSat = 0;
    currentLight = 0;
    currentHueDelta = 0;
    hueDeltas = {};

    satRange.value = '0';
    lightRange.value = '0';
    satVal.textContent = '0';
    lightVal.textContent = '0';

    // Reset colors
    if (colorPicker && originalColors.length > 0) {
        const resetColors = originalColors.map(c => ({ h: c.h, s: c.s, l: c.l }));
        colorPicker.setColors(resetColors);
    }
}

// Toggle Lock
lockBtn.onclick = () => {
    isLinked = !isLinked;
    lockBtn.textContent = isLinked ? '🔗' : '🔓';
    lockBtn.title = isLinked ? '切换到独立模式' : '切换到联动模式';

    // If switching back to Linked, clear overrides and align to global?
    // User expectation: maybe reset to current average? Or reset to 0?
    // Simplest: Reset overrides, snapping everything back to Global Hue Delta.
    if (isLinked) {
        hueDeltas = {};
        // Re-apply global delta to all handles
        colorPicker.colors.forEach((c: any, index: number) => {
            let newH = (originalColors[index].h + currentHueDelta) % 360;
            if (newH < 0) newH += 360;
            c.hsl = { h: newH, s: originalColors[index].s, l: originalColors[index].l };
        });
    }
};

// --- Event Listeners ---

window.onload = () => {
    initColorWheel();
    setTimeout(scan, 100);
};

satRange.oninput = () => {
    currentSat = parseInt(satRange.value) / 100;
    satVal.textContent = satRange.value;
};

lightRange.oninput = () => {
    currentLight = parseInt(lightRange.value) / 100;
    lightVal.textContent = lightRange.value;
};

// Apply
applyBtn.onclick = () => {
    if (!hasScanned) {
        scan();
        return;
    }

    const options: ApplyOptions = {
        includeFills: scopeFillsCb.checked,
        includeStrokes: scopeStrokesCb.checked,
        includeEffects: true,
        includeInnerShadows: scopeInnerShadowCb.checked,
        includeDropShadows: scopeDropShadowCb.checked,
        keepWhite: keepWhiteCb.checked,
        keepBlack: keepBlackCb.checked,
        keepGray: keepGrayCb.checked
    };

    const msg: ApplyRequest = {
        type: 'APPLY_REQUEST',
        satDelta: currentSat,
        lightDelta: currentLight,
        hueDelta: currentHueDelta,
        colorMapping: Object.keys(hueDeltas).length > 0 ? hueDeltas : undefined,
        options
    };
    parent.postMessage({ pluginMessage: msg }, '*');
};

// Settings Panel
settingsBtn.onclick = () => {
    settingsOverlay.style.display = 'block';
    setTimeout(() => settingsPanel.classList.add('open'), 10);
};

const closeSettings = () => {
    settingsPanel.classList.remove('open');
    setTimeout(() => settingsOverlay.style.display = 'none', 300);
};

closeSettingsBtn.onclick = closeSettings;
settingsOverlay.onclick = (e) => {
    if (e.target === settingsOverlay) closeSettings();
};

resetBtn.onclick = reset;
desaturateBtn.onclick = () => {
    currentSat = -1;
    satRange.value = '-100';
    satVal.textContent = '-100';
};

// Message Handling
onmessage = (event: MessageEvent) => {
    const msg = event.data?.pluginMessage as UIMessage | undefined;
    if (!msg || !msg.type) return;

    if (msg.type === 'SCAN_RESULT') {
        hasScanned = true;
        statsDiv.textContent = `Scanned ${msg.metrics?.visitedNodes} nodes. Found ${msg.palette?.length || 0} colors.`;

        if (msg.palette && msg.palette.length > 0) {
            const colorsToShow = msg.palette.slice(0, 15).map(p => {
                const hsl = rgbToHsl(p.rgba.r, p.rgba.g, p.rgba.b);
                // Generate key locally to be sure
                const key = toColorKey(p.rgba.r, p.rgba.g, p.rgba.b, p.rgba.a);
                return { ...hsl, key };
            });

            colorPicker.setColors(colorsToShow); // iro.js ignores extra props 'key'

            // Save state
            originalColors = JSON.parse(JSON.stringify(colorsToShow));
            currentHueDelta = 0;
            hueDeltas = {};
            activeIndex = -1;

        } else {
            colorPicker.setColors([{ h: 0, s: 0, l: 50 }]);
            originalColors = [{ h: 0, s: 0, l: 50, key: '' }];
        }

    } else if (msg.type === 'APPLY_RESULT') {
        statsDiv.textContent = `Done! Modified ${msg.metrics?.modifiedPaints || 0} paints.`;
    } else if (msg.type === 'ERROR') {
        errorDiv.textContent = msg.message || 'Unknown error';
    } else if (msg.type === 'PROGRESS') {
        statsDiv.textContent = `Processing: ${msg.processed} / ${msg.total}`;
    }
};

import { UIMessage, ScanRequest, ApplyRequest, ApplyOptions, PaletteItem } from './shared/types';

// Declare iro global
declare const iro: any;

let colorPicker: any;
let hasScanned = false;

// UI Elements
const wheelContainer = document.getElementById('wheel-container')!;
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
let currentHueDelta = 0;

// Store original HSL values of the palette to calculate delta
let originalColors: { h: number, s: number, l: number }[] = [];
let activeIndex = -1; // Index of the color being dragged

// Initialize Iro JS Color Wheel
function initColorWheel() {
    colorPicker = new iro.ColorPicker("#wheel-container", {
        width: 160,
        // color: "hsl(0, 100%, 50%)", // Removed, set dynamically
        borderWidth: 2,
        borderColor: "#fff",
        layout: [
            {
                component: iro.ui.Wheel,
                options: {}
            }
        ]
    });

    // --- Linked Hue Rotation Logic ---

    // 1. When specific handle starts dragging
    colorPicker.on('input:start', (color: any) => {
        // Find which color index is being dragged
        activeIndex = color.index;
    });

    // 2. When dragging
    colorPicker.on('input:move', (color: any) => {
        if (activeIndex === -1 || !originalColors.length) return;

        // Logic: 
        // 1. Get current H of the active handle
        const currentH = color.hsl.h;
        // 2. Get its original H
        const originalH = originalColors[activeIndex].h;
        // 3. Calculate global delta
        let delta = currentH - originalH;

        // Normalize delta to ensure smooth rotation logic globally?
        // Actually, we just need to send this delta to Main.
        // But for UI visualization, we must update OTHER handles too.

        // Update global state
        currentHueDelta = delta;

        // Update other handles in the UI so they spin together
        // We use `setColors` or update individual color objects?
        // iro.js `colorPicker.colors` is array.

        // To avoid infinite loop, we temporarily unbind or use a flag, 
        // OR we manually value set without firing events?
        // iro.js typically fires events on set.

        // BETTER APPROACH:
        // Update all OTHER colors based on their original + delta.
        colorPicker.colors.forEach((c: any, index: number) => {
            if (index !== activeIndex) {
                let newH = (originalColors[index].h + delta) % 360;
                if (newH < 0) newH += 360;
                // Set Hue only. Preserve active S/L or original S/L?
                // Usually user just rotates hue.
                c.hsl = { h: newH, s: originalColors[index].s, l: originalColors[index].l };
            }
        });
    });

    // 3. Reset active index on end
    colorPicker.on('input:end', () => {
        // activeIndex = -1; // Handle persistence? No need.
    });
}

// Convert palette item's RGBA to HSL for display
// We need a helper or just rely on 'ScanResult' giving us RGBA, convert here.
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

// Helper to send scan request
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

// Reset all controls
function reset() {
    currentSat = 0;
    currentLight = 0;
    currentHueDelta = 0;

    satRange.value = '0';
    lightRange.value = '0';
    satVal.textContent = '0';
    lightVal.textContent = '0';

    // Reset colors to original state
    if (colorPicker && originalColors.length > 0) {
        const resetColors = originalColors.map(c => ({ h: c.h, s: c.s, l: c.l }));
        colorPicker.setColors(resetColors);
    }
}

// --- Event Listeners ---

window.onload = () => {
    initColorWheel();
    // Auto scan on load
    setTimeout(scan, 100);
};

// Sliders
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

// Top Actions
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

        // UPDATE COLOR WHEEL
        if (msg.palette && msg.palette.length > 0) {
            // Convert to HSL and filter redundant hues?
            // User requested "Show included colors".
            // We limit to top 15 unique colors to prevent crashing UI.
            const colorsToShow = msg.palette.slice(0, 15).map(p => {
                const hsl = rgbToHsl(p.rgba.r, p.rgba.g, p.rgba.b);
                return hsl;
            });

            // Set to Picker
            colorPicker.setColors(colorsToShow);

            // Save original state for delta calculation
            originalColors = JSON.parse(JSON.stringify(colorsToShow));
            currentHueDelta = 0;
            activeIndex = -1;

        } else {
            // No colors found? Set a default grey?
            colorPicker.setColors([{ h: 0, s: 0, l: 50 }]);
            originalColors = [{ h: 0, s: 0, l: 50 }];
        }

    } else if (msg.type === 'APPLY_RESULT') {
        statsDiv.textContent = `Done! Modified ${msg.metrics?.modifiedPaints || 0} paints.`;
    } else if (msg.type === 'ERROR') {
        errorDiv.textContent = msg.message || 'Unknown error';
    } else if (msg.type === 'PROGRESS') {
        statsDiv.textContent = `Processing: ${msg.processed} / ${msg.total}`;
    }
};

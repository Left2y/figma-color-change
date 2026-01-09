import { UIMessage, ScanRequest, ApplyRequest } from './shared/types';

const scanBtn = document.getElementById('scan-btn') as HTMLButtonElement;
const applyBtn = document.getElementById('apply-btn') as HTMLButtonElement;
const satRange = document.getElementById('sat-range') as HTMLInputElement;
const lightRange = document.getElementById('light-range') as HTMLInputElement;
const satVal = document.getElementById('sat-val') as HTMLSpanElement;
const lightVal = document.getElementById('light-val') as HTMLSpanElement;
const statsDiv = document.getElementById('stats') as HTMLDivElement;
const errorDiv = document.getElementById('error-msg') as HTMLDivElement;
const adjustSection = document.getElementById('adjust-section') as HTMLDivElement;
const paletteList = document.getElementById('palette-list') as HTMLDivElement;

// State
let currentSat = 0;
let currentLight = 0;

// Update labels
satRange.oninput = () => {
    currentSat = parseInt(satRange.value);
    satVal.textContent = (currentSat > 0 ? '+' : '') + currentSat + '%';
};

lightRange.oninput = () => {
    currentLight = parseInt(lightRange.value);
    lightVal.textContent = (currentLight > 0 ? '+' : '') + currentLight + '%';
};

scanBtn.onclick = () => {
    const msg: ScanRequest = {
        type: 'SCAN_REQUEST',
        options: { includeFills: true, includeStrokes: true, includeEffects: true }
    };
    parent.postMessage({ pluginMessage: msg }, '*');

    errorDiv.textContent = '';
    statsDiv.textContent = 'Scanning...';
    paletteList.innerHTML = '';
    adjustSection.style.opacity = '0.5';
    adjustSection.style.pointerEvents = 'none';
};

applyBtn.onclick = () => {
    const msg: ApplyRequest = {
        type: 'APPLY_REQUEST',
        options: { includeFills: true, includeStrokes: true, includeEffects: true },
        satDelta: currentSat / 100, // convert to -1 ~ 1
        lightDelta: currentLight / 100
    };
    parent.postMessage({ pluginMessage: msg }, '*');

    statsDiv.textContent = 'Applying...';
};

onmessage = (event: MessageEvent) => {
    const msg = event.data?.pluginMessage as UIMessage | undefined;

    // 忽略非插件消息
    if (!msg || !msg.type) return;

    if (msg.type === 'SCAN_RESULT') {
        statsDiv.textContent = `Scanned ${msg.metrics.visitedNodes} nodes. Found ${msg.palette.length} colors.`;

        // Render Palette
        paletteList.innerHTML = '';
        msg.palette.forEach(item => {
            const div = document.createElement('div');
            div.className = 'swatch';
            const { r, g, b, a } = item.rgba;
            div.style.backgroundColor = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
            div.title = `${item.hex}\nCount: ${item.count}\nSources: ${item.sources.join(', ')}`;
            paletteList.appendChild(div);
        });

        // 重置滑杆到 0%
        currentSat = 0;
        currentLight = 0;
        satRange.value = '0';
        lightRange.value = '0';
        satVal.textContent = '0%';
        lightVal.textContent = '0%';

        // Enable adjust section
        adjustSection.style.opacity = '1';
        adjustSection.style.pointerEvents = 'auto';

    } else if (msg.type === 'APPLY_RESULT') {
        statsDiv.textContent = `Applied changes.\nNodes: ${msg.metrics.visitedNodes}\nPaints Modified: ${msg.metrics.modifiedPaints || 0}\nColors Skipped: ${msg.metrics.skipped}`;
    } else if (msg.type === 'ERROR') {
        errorDiv.textContent = msg.message;
    } else if (msg.type === 'PROGRESS') {
        statsDiv.textContent = `Processing: ${msg.processed} / ${msg.total || '?'}`;
    }
};

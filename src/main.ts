import { PluginMessage, ScanResult, ApplyResult } from './shared/types';
import { scanSelection } from './figma/scan';
// 引入 applyChanges
import { applyChanges } from './figma/apply';

console.log("Plugin started");
figma.showUI(__html__, { width: 300, height: 500 });

figma.ui.onmessage = async (msg: PluginMessage) => {
    if (msg.type === 'SCAN_REQUEST') {
        console.log('Main received SCAN_REQUEST', msg.options);

        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
            figma.ui.postMessage({ type: 'ERROR', message: 'Please select a frame first.' });
            return;
        }

        try {
            const { palette, metrics } = scanSelection(selection, msg.options);
            const result: ScanResult = {
                type: 'SCAN_RESULT',
                palette,
                metrics
            };
            figma.ui.postMessage(result);
        } catch (e: any) {
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
                msg.options,
                (processed, total) => {
                    figma.ui.postMessage({ type: 'PROGRESS', processed, total });
                }
            );

            const result: ApplyResult = {
                type: 'APPLY_RESULT',
                metrics
            };
            figma.ui.postMessage(result);

        } catch (e: any) {
            figma.ui.postMessage({ type: 'ERROR', message: e.message });
        }
    }
};

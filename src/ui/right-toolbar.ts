import { Button, Container, Element } from '@playcanvas/pcui';

import type { CameraControlMode } from '../camera';
import { CAMERA_CONTROL_MODES } from '../camera';
import type { Events } from '../events';
import type { ShortcutManager } from '../shortcut-manager';

import { i18n } from './localization';
import appearanceSvg from './svg/appearance.svg';
import cameraFrameSelectionSvg from './svg/camera-frame-selection.svg';
import cameraResetSvg from './svg/camera-reset.svg';
import flyCameraSvg from './svg/fly-camera.svg';
import freeCameraSvg from './svg/free-camera.svg';
import orbitCameraSvg from './svg/orbit-camera.svg';
import overlaysSvg from './svg/overlays.svg';
import type { Tooltips } from './tooltips';

const createSvg = (svgString: string) => {
    const decodedStr = decodeURIComponent(svgString.substring('data:image/svg+xml,'.length));
    return new DOMParser().parseFromString(decodedStr, 'image/svg+xml').documentElement;
};

class RightToolbar extends Container {
    constructor(events: Events, tooltips: Tooltips, args = {}) {
        args = {
            ...args,
            id: 'right-toolbar'
        };

        super(args);

        this.dom.addEventListener('pointerdown', (event) => {
            event.stopPropagation();
        });

        const appearance = new Button({
            id: 'right-toolbar-appearance',
            class: 'right-toolbar-toggle'
        });

        const cameraFrameSelection = new Button({
            id: 'right-toolbar-frame-selection',
            class: 'right-toolbar-button'
        });

        const cameraReset = new Button({
            id: 'right-toolbar-camera-origin',
            class: 'right-toolbar-button'
        });

        const overlays = new Button({
            id: 'right-toolbar-overlays',
            class: 'right-toolbar-toggle'
        });

        const settings = new Button({
            id: 'right-toolbar-settings',
            class: 'right-toolbar-toggle',
            icon: 'E283'
        });

        // Helper to compose localized tooltip text with shortcut
        const shortcutManager: ShortcutManager = events.invoke('shortcutManager');
        const tooltip = (localeKey: string, shortcutId?: string) => () => {
            const text = i18n.t(localeKey);
            if (shortcutId) {
                const shortcut = shortcutManager.formatShortcut(shortcutId);
                if (shortcut) {
                    return i18n.formatTooltipWithShortcut(text, shortcut);
                }
            }
            return text;
        };

        // camera mode buttons are data-driven: a new mode only needs an entry
        // here and the camera implementation
        const modeInfo: Record<CameraControlMode, { icon: string; labelKey: string }> = {
            orbit: { icon: orbitCameraSvg, labelKey: 'tooltip.right-toolbar.orbit-camera' },
            fly: { icon: flyCameraSvg, labelKey: 'tooltip.right-toolbar.fly-camera' },
            free: { icon: freeCameraSvg, labelKey: 'tooltip.right-toolbar.free-camera' }
        };
        const modeButtons = CAMERA_CONTROL_MODES.map((mode) => {
            const button = new Button({
                id: `right-toolbar-${mode}-mode`,
                class: mode === 'orbit' ? ['right-toolbar-toggle', 'active'] : 'right-toolbar-toggle'
            });
            button.dom.appendChild(createSvg(modeInfo[mode].icon));
            i18n.onChange(() => button.dom.setAttribute('aria-label', i18n.t(modeInfo[mode].labelKey)), button);
            return { mode, button };
        });

        appearance.dom.appendChild(createSvg(appearanceSvg));
        cameraFrameSelection.dom.appendChild(createSvg(cameraFrameSelectionSvg));
        cameraReset.dom.appendChild(createSvg(cameraResetSvg));
        overlays.dom.appendChild(createSvg(overlaysSvg));

        // icon-only buttons: keep accessible names in sync with the language
        const buttonLabels: [Button, string][] = [
            [appearance, 'panel.appearance'],
            [overlays, 'panel.overlays'],
            [cameraFrameSelection, 'tooltip.right-toolbar.frame-selection'],
            [cameraReset, 'tooltip.right-toolbar.reset-camera'],
            [settings, 'panel.settings']
        ];
        buttonLabels.forEach(([button, key]) => {
            i18n.onChange(() => button.dom.setAttribute('aria-label', i18n.t(key)), button);
        });

        this.append(appearance);
        this.append(overlays);
        this.append(new Element({ class: 'right-toolbar-separator' }));
        modeButtons.forEach(({ button }) => this.append(button));
        this.append(new Element({ class: 'right-toolbar-separator' }));
        this.append(cameraFrameSelection);
        this.append(cameraReset);
        this.append(new Element({ class: 'right-toolbar-separator' }));
        this.append(settings);

        tooltips.register(appearance, tooltip('panel.appearance'), 'left');
        modeButtons.forEach(({ mode, button }) => {
            tooltips.register(button, tooltip(modeInfo[mode].labelKey, 'camera.toggleControlMode'), 'left');
        });
        tooltips.register(
            cameraFrameSelection,
            tooltip('tooltip.right-toolbar.frame-selection', 'camera.focus'),
            'left'
        );
        tooltips.register(cameraReset, tooltip('tooltip.right-toolbar.reset-camera', 'camera.reset'), 'left');
        tooltips.register(overlays, tooltip('panel.overlays'), 'left');
        tooltips.register(settings, tooltip('panel.settings'), 'left');

        // add event handlers

        appearance.on('click', () => events.fire('appearancePanel.toggleVisible'));
        modeButtons.forEach(({ mode, button }) => {
            button.on('click', () => events.fire('camera.setControlMode', mode));
        });
        cameraFrameSelection.on('click', () => events.fire('camera.focus'));
        cameraReset.on('click', () => events.fire('camera.reset'));
        overlays.on('click', () => events.fire('overlaysPanel.toggleVisible'));
        settings.on('click', () => events.fire('settingsPanel.toggleVisible'));

        events.on('appearancePanel.visible', (visible: boolean) => {
            appearance.class[visible ? 'add' : 'remove']('active');
        });

        events.on('camera.controlMode', (mode: CameraControlMode) => {
            modeButtons.forEach(({ mode: buttonMode, button }) => {
                button.class[buttonMode === mode ? 'add' : 'remove']('active');
            });
        });

        events.on('overlaysPanel.visible', (visible: boolean) => {
            overlays.class[visible ? 'add' : 'remove']('active');
        });

        events.on('settingsPanel.visible', (visible: boolean) => {
            settings.class[visible ? 'add' : 'remove']('active');
        });
    }
}

export { RightToolbar };

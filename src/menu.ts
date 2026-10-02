import Java from "frida-java-bridge";

import { Api, GONE, VERTICAL, VISIBLE } from "./api";
import { overlay } from "./utils/permission";
import { add, remove } from "./utils/operations";
import { onDestroy, onPause, onResume } from "./utils/hook";
import { SharedPreferences } from "./misc/sharedPreferences";
import { OnTouch } from "./misc/onTouch";
import { activityInstance, app } from "./runtime";
import { Layout } from "./ui/layout";
import { Icon } from "./ui/icon";
import { Settings } from "./layout/lgl/settings";
import { GenericConfig } from "./layout/config";
import { GenericLayout } from "./layout/generic";

/** `Composer` class instance */
export let instance: Composer;
/** Config instance for layout */
export let config: GenericConfig;

export function setConfig(cfg: GenericConfig) {
    config = cfg;
}

/** Shared Preferences storage. Feel free to store own values */
export const sharedPreferences = new SharedPreferences();

/** Main class for menu */
export class Composer<T extends GenericLayout = GenericLayout> {
    /** @internal */
    rootFrame: Layout;
    /** Icon holder */
    $icon: Icon;
    /** Layout layout */
    layout: T;

    constructor (title: string, subtitle: string, layout: T) {
        instance = this;

        if (!overlay.check()) {
            overlay.ask();
            setTimeout(async () => (await activityInstance).finish(), 3000);
        }

        this.rootFrame = new Layout(Api.FrameLayout);

        this.layout = layout;
        this.layout.title.text = title;
        this.layout.subtitle.text = subtitle;
        this.layout.ensureInitialized();

        this.layout.handleAdd(add);
        add(this.layout.me, this.rootFrame);

        onDestroy(() => this.destroy);
        onPause(() => this.hide());
        onResume(() => this.show());
    }

    /**
     * Sets icon for menu
     *
     * @param {string} value can be base64-encoded image or link (only for Web type)
     * @param {("Normal" | "Web")} [type="Normal"] Normal accepts only base64-encoded image. Web accepts links to images/gifs, etc
     */
    icon(value: string, type: "Normal" | "Web" = "Normal") {
        Java.scheduleOnMainThread(() => {
            this.$icon = new Icon(type, value);
            this.$icon.visibility = VISIBLE;

            this.layout.initializeIcon();

            new OnTouch(this.rootFrame);
            new OnTouch(this.$icon);

            add(this.$icon, this.rootFrame);
        });
    }

    /** Sets menu settings */
    settings(label: string, state: boolean = false): Layout {
        const settings = new Settings(label, state);
        settings.orientation = VERTICAL;
        add(settings.settings, this.layout.titleLayout);
        return settings;
    }

    /** Hides menu */
    hide() {
        Java.scheduleOnMainThread(() => {
            try {
                this.rootFrame.visibility = GONE;
                remove(this.rootFrame, app.windowManager);
            }
            catch (e) {
                (globalThis as any).console.warn("Menu already destroyed, ignoring `destroy` call");
            }
        });
    }

    /** Disposes instance of `Composer` */
    destroy() {
        // Unhook java methods
        onPause();
        onResume();
        onDestroy();
        // Remove views
        this.hide();
        remove(this.layout.me, this.rootFrame);
        this.layout.handleRemove(remove);

        instance = undefined as unknown as Composer;
    }

    /** Shows menu */
    show() {
        Java.scheduleOnMainThread(() => {
            try {
                app.windowManager.addView(this.rootFrame.instance, this.layout.params);
                this.rootFrame.visibility = VISIBLE;
            }
            catch (e) {
                (globalThis as any).console.warn("Menu already showed, ignoring `show` call");
            }
        });
    }
}

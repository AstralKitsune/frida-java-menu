import Java from "frida-java-bridge";

import {
    ALIGN_PARENT_LEFT,
    ALIGN_PARENT_RIGHT,
    Api,
    CENTER,
    CENTER_HORIZONTAL,
    GONE,
    MATCH_PARENT, TRANSPARENT,
    VERTICAL,
    VISIBLE,
    WRAP_CONTENT
} from "../../api";
import { dp } from "../../ui/misc";
import { ThisCallback, ThisWithIndexCallback } from "../../types";
import { stateHolder } from "../../utils/stateHolder";
import { add } from "../../utils/operations";
import { Layout } from "../../ui/layout";
import { GenericConfig } from "../config";
import { ComposerHandler, GenericLayout } from "../generic";
import { TextView, textView } from "../../ui/textView";
import { toast } from "../../ui/toast";
import { Button, button } from "../../ui/button";
import { DialogCallback, Dialog, dialog } from "../../ui/dialog";
import { RadioGroup, makeButtonInstances, radioGroup } from "../../ui/radioGroup"
import { format } from "../../utils/format";
import { SeekBarCallback, seekbar } from "../../ui/seekbar";
import { Spinner, spinner } from "../../ui/spinner";
import { SwitchCallback, Switch, toggle } from "../../ui/switch";
import { View } from "../../ui/view";
import { config, instance } from "../../menu";

/** First layout - to add to the layout; Second - for your widgets */
export declare type CollapseReturn = [Layout, Layout];
/** LGL Layout configuration */
export const LGLConfig: GenericConfig = {
    color: {
        primaryText: "#82CAFD",
        secondaryText: "#FFFFFF",
        buttonBg: "#1C262D",
        layoutBg: "#DD141C22",
        collapseBg: "#222D38",
        categoryBg: "#2F3D4C",
        menu: "#EE1C2A35"
    },

    menu: {
        width: 290,
        height: 210,
        x: 50,
        y: 100,
    },

    icon: {
        size: 45,
        alpha: 0.7
    },

    strings: {
        noOverlayPermission: "Overlay permission required to show menu",
        hide: "HIDE/KILL (Hold)",
        close: "MINIMIZE",
        hideCallback: "Icon hidden. Remember the hidden icon position",
        killCallback: "Menu killed"
    }
};

/** LGL Mod Menu layout */
export class LGLLayout extends GenericLayout {
    constructor(cfg?: GenericConfig) {
        super(cfg ?? LGLConfig);
        this.titleLayout = new Layout(Api.RelativeLayout);
        this.titleLayout.padding = [10, 5, 10, 5];
        this.titleLayout.verticalGravity = 16;

        const titleParams = Layout.RelativeLayoutParams(WRAP_CONTENT, WRAP_CONTENT); // For `this.title`
        titleParams.addRule(CENTER_HORIZONTAL);

        this.title = new TextView();
        this.title.textColor = config.color.primaryText;
        this.title.textSize = 18;
        this.title.gravity = CENTER;
        this.title.layoutParams = titleParams;

        this.subtitle = new TextView();
        this.subtitle.ellipsize = Api.TruncateAt.MARQUEE.value;
        this.subtitle.marqueeRepeatLimit = -1;
        this.subtitle.singleLine = true;
        this.subtitle.selected = true;
        this.subtitle.textColor = config.color.primaryText;
        this.subtitle.textSize = 10;
        this.subtitle.gravity = CENTER;
        this.subtitle.padding = [0, 0, 0, 5];
    }

    initializeParams(): void {
        super.initializeParams();
        this.params.gravity.value = 51;
        this.params.x.value = config.menu.x;
        this.params.y.value = config.menu.y;
    }

    initializeLayout(): void {
        this.me = new Layout(Api.LinearLayout);
        this.me.visibility = GONE;
        this.me.backgroundColor = config.color.menu;
        this.me.orientation = VERTICAL;
        this.me.layoutParams = Layout.LinearLayoutParams(Math.floor(dp(config.menu.width)), WRAP_CONTENT);
    }

    initializeIcon(): void {}

    initializeProxy(): void {
        super.initializeProxy();
        this.proxy.layoutParams = Layout.LinearLayoutParams(MATCH_PARENT, Math.floor(dp(config.menu.height)));
        this.proxy.backgroundColor = config.color.layoutBg;
    }

    initializeMainLayout(): void {
        this.layout = new Layout(Api.LinearLayout);
        this.layout.orientation = VERTICAL;
    }

    initializeButtons(): void {
        const hideButtonParams = Layout.RelativeLayoutParams(WRAP_CONTENT, WRAP_CONTENT);
        hideButtonParams.addRule(ALIGN_PARENT_LEFT);

        const closeButtonParams = Layout.RelativeLayoutParams(WRAP_CONTENT, WRAP_CONTENT);
        closeButtonParams.addRule(ALIGN_PARENT_RIGHT);

        this.buttonLayout = new Layout(Api.RelativeLayout);
        this.buttonLayout.padding = [10, 3, 10, 3];
        this.buttonLayout.verticalGravity = CENTER;

        this.hide = new Button(config.strings.hide);
        this.hide.layoutParams = hideButtonParams;
        this.hide.backgroundColor = TRANSPARENT;
        this.hide.textColor = config.color.primaryText;
        this.hide.onClickListener = () => {
            instance.$icon.visibility = VISIBLE;
            instance.$icon.alpha = 0;
            this.me.visibility = GONE;
            toast(config.strings.hideCallback, 1);
        }
        this.hide.onLongClickListener = () => {
            instance.destroy();
            toast(config.strings.killCallback, 1);
        }

        this.close = new Button(config.strings.close);
        this.close.layoutParams = closeButtonParams;
        this.close.backgroundColor = 0;
        this.close.textColor = config.color.primaryText;
        this.close.onClickListener = () => {
            instance.$icon.visibility = VISIBLE;
            instance.$icon.alpha = config.icon.alpha;
            this.me.visibility = GONE;
        }
    }

    ensureInitialized(): void {
        this.initializeParams();
        this.initializeLayout();
        this.initializeProxy();
        this.initializeMainLayout();
        this.initializeButtons();
    }

    handleAdd(add: ComposerHandler): void {
        add(this.title, this.titleLayout);
        add(this.titleLayout, this.me);
        add(this.subtitle, this.me);
        add(this.layout, this.proxy);
        add(this.proxy, this.me);
        add(this.hide, this.buttonLayout);
        add(this.close, this.buttonLayout);
        add(this.buttonLayout, this.me);
    }

    handleRemove(remove: ComposerHandler): void {
        remove(this.buttonLayout, this.me);
        remove(this.close, this.buttonLayout);
        remove(this.hide, this.buttonLayout);
        remove(this.proxy, this.me);
        remove(this.layout, this.proxy);
        remove(this.subtitle, this.me);
        remove(this.titleLayout, this.me);
        remove(this.title, this.titleLayout);
    }

    button(text: string, callback?: ThisCallback<Button>, longCallback?: ThisCallback<Button>): Button {
        const params = Layout.LinearLayoutParams(MATCH_PARENT, MATCH_PARENT);
        params.setMargins(7, 5, 7, 5);

        const btn = button(text, callback, longCallback);
        btn.layoutParams = params;
        btn.allCaps = false;
        btn.textColor = config.color.secondaryText;
        btn.backgroundColor = config.color.buttonBg;

        return btn;
    }

    async dialog(title: string, message: string, positiveCallback?: DialogCallback, negativeCallback?: DialogCallback, view?: Java.Wrapper): Promise<Dialog> {
        const dlg = await dialog(title, message, positiveCallback, negativeCallback, view);
        // I have no idea should I show dialog
        // But let user care about this
        // Reference: https://github.com/LGLTeam/Android-Mod-Menu/blob/2e6095c7cb85458fff07f413d95d98a22e195cfa/app/src/main/java/com/android/support/Menu.java#L812
        return dlg;
    }

    radioGroup(label: string, buttons: string[], callback?: ThisWithIndexCallback<Button>): RadioGroup {
        const radioGroupLabel = this.textView(format(label, ""));

        const radioGroupLabelParams = Layout.LinearLayoutParams(WRAP_CONTENT, WRAP_CONTENT);

        const instances = makeButtonInstances(buttons, function (index: number) {
            radioGroupLabel.text = format(label, this.text);
            callback?.call(this, index);
        }).map(e => {
            e.textColor = config.color.secondaryText;
            return e;
        });

        const rg = radioGroup(instances);
        rg.padding = [10, 5, 10, 5];
        rg.orientation = VERTICAL;
        rg.instance.addView(Java.cast(radioGroupLabel.instance, Api.View), buttons.length, radioGroupLabelParams);

        return rg;
    }

    seekbar(label: string, max: number, min: number = 0, callback?: SeekBarCallback): View {
        const sb = seekbar(label, max, min, (progress: number) => {
            seekbarLabel.text = format(label, progress);
            callback?.call(sb, progress);
        });
        sb.padding = [25, 10, 35, 10];

        const seekbarLabel = this.textView(format(label, sb.progress));

        const layout = new Layout(Api.LinearLayout);
        layout.layoutParams = Layout.LinearLayoutParams(MATCH_PARENT, MATCH_PARENT);
        layout.orientation = VERTICAL;

        add(seekbarLabel, layout);
        add(sb, layout);

        return layout;
    }

    spinner(items: string[], callback?: ThisWithIndexCallback<Spinner>): Spinner {
        const sp = spinner(items, callback);
        sp.background.setColorFilter(1, Api.Mode.SRC_ATOP.value);

        return sp;
    }

    toggle(label: string, callback?: SwitchCallback): Switch {
        const tg = toggle(label, callback);
        tg.textColor = config.color.secondaryText;
        tg.padding = [10, 5, 10, 5];

        return tg;
    }

    textView(label: string): TextView {
        const tv = textView(label);
        tv.textColor = config.color.secondaryText;
        tv.padding = [10, 5, 10, 5];

        return tv;
    }

    category(label: string): TextView {
        const tv = textView(label);
        tv.backgroundColor = config.color.categoryBg;
        tv.gravity = CENTER;
        tv.padding = [0, 5, 0, 5];
        tv.typeface = Api.Typeface.DEFAULT_BOLD.value;

        return tv;
    }

    collapse(label: string, state: boolean): CollapseReturn {
        const params = Layout.LinearLayoutParams(MATCH_PARENT, MATCH_PARENT);
        params.setMargins(0, 5, 0, 0);

        const parentLayout = new Layout(Api.LinearLayout);
        parentLayout.layoutParams = params;
        parentLayout.verticalGravity = 16;
        parentLayout.orientation = VERTICAL;

        const layout = new Layout(Api.LinearLayout);
        layout.verticalGravity = 16;
        layout.padding = [0, 5, 0, 5];
        layout.orientation = VERTICAL;
        layout.backgroundColor = config.color.layoutBg;
        layout.visibility = GONE;

        const textView = this.category(`▽ ${label} ▽`);
        textView.backgroundColor = config.color.collapseBg;
        textView.padding = [0, 20, 0, 20];
        textView.onClickListener = stateHolder(state, (s: boolean) => {
            if (s) {
                layout.visibility = VISIBLE;
                textView.text = `△ ${label} △`;
            }
            else {
                layout.visibility = GONE;
                textView.text = `▽ ${label} ▽`;
            }
        });

        add(textView, parentLayout);
        add(layout, parentLayout);

        return [parentLayout, layout];
    }
}

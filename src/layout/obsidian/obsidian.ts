import Java from "frida-java-bridge";

import {
    ALIGN_PARENT_RIGHT,
    Api,
    CENTER,
    GONE,
    HORIZONTAL,
    MATCH_PARENT,
    TRANSPARENT,
    VERTICAL,
    VISIBLE,
    WRAP_CONTENT
} from "../../api";
import { ColorConfig, GenericConfig, MenuConfig } from "../config";
import { ThisCallback, ThisWithIndexCallback } from "../../types";
import { Button, button } from "../../ui/button";
import { Layout } from "../../ui/layout";
import { ComposerHandler, GenericLayout } from "../generic";
import { toast } from "../../ui/toast";
import { GradientDrawable } from "../../ui/gradientDrawable";
import { TextView, textView } from "../../ui/textView";
import { dp } from "../../ui/misc";
import { Spinner, spinner } from "../../ui/spinner";
import { add } from "../../utils/operations";
import { format } from "../../utils/format";
import { SeekBarCallback, seekbar } from "../../ui/seekbar";
import { View } from "../../ui/view";
import { DialogCallback, Dialog, dialog } from "../../ui/dialog";
import { RadioGroup, makeButtonInstances, radioGroup } from "../../ui/radioGroup";
import { SwitchCallback, Switch, toggle } from "../../ui/switch";
import { instance, config } from "../../menu";

interface ObsidianColorConfig extends ColorConfig {
    tabFocusedBg: string,
    tabUnfocusedBg: string,
    hideFg: string,
    closeFg: string
}

interface ObsidianMenuConfig extends MenuConfig {
    cornerRadius: number
}

export interface ObsidianConfig extends GenericConfig {
    color: ObsidianColorConfig,
    menu: ObsidianMenuConfig
}
/** Own layout configuration */
export const ObsidianLayoutConfig: ObsidianConfig = {
    color: {
        primaryText: "#78281F",
        secondaryText: "#5B2C6F",
        buttonBg: "#1D1D1D",
        layoutBg: "#111111",
        collapseBg: "#3B3B3B",
        categoryBg: "#296368",
        tabUnfocusedBg: "#3E3E3E",
        tabFocusedBg: "#454545",
        hideFg: "#1E75A4",
        closeFg: "#970000",
        menu: "#000000"
    },

    menu: {
        width: 300,
        height: 200,
        x: 100,
        y: 100,
        cornerRadius: 45
    },

    icon: {
        size: 35,
        alpha: 0.6
    },

    strings: {
        noOverlayPermission: "Overlay permission is needed to show the menu",
        hide: "<b>_</b>",
        close: "✖",
        hideCallback: "Icon hidden",
        killCallback: "Menu killed"
    }
};


/** Obsidian layout */
export class ObsidianLayout extends GenericLayout {
    declare hide: TextView;
    declare close: TextView;
    buttonProxyLayout: Layout;

    constructor(cfg?: GenericConfig) {
        super(cfg ?? ObsidianLayoutConfig);
        const titleParams = Layout.RelativeLayoutParams(WRAP_CONTENT, WRAP_CONTENT); // For `this.title`
        titleParams.addRule(Api.RelativeLayout.CENTER_IN_PARENT.value);

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

    /** @internal */
    roundedDrawable(): GradientDrawable {
        const gradientDrawable = new GradientDrawable();
        gradientDrawable.cornerRadius = (config as ObsidianConfig).menu.cornerRadius;

        return gradientDrawable;
    }

    initializeParams(): void {
        super.initializeParams();
        this.params.gravity.value = 51;
        this.params.x.value = config.menu.x;
        this.params.y.value = config.menu.y;
    }

    initializeLayout(): void {
        const gradientDrawable = this.roundedDrawable();
        gradientDrawable.color = config.color.menu;

        this.me = new Layout(Api.LinearLayout);
        this.me.visibility = GONE;
        this.me.background = gradientDrawable;
        this.me.orientation = VERTICAL;
        this.me.layoutParams = Layout.LinearLayoutParams(Math.floor(dp(config.menu.width)), WRAP_CONTENT);
    }

    initializeIcon(): void {}

    initializeProxy(): void {
        super.initializeProxy();

        // without roundind proxy it only top corners will be rounded
        const gradientDrawable = this.roundedDrawable();
        gradientDrawable.color = config.color.layoutBg;

        this.proxy.layoutParams = Layout.LinearLayoutParams(MATCH_PARENT, Math.floor(dp(config.menu.height)));
        this.proxy.background = gradientDrawable;
    }

    initializeMainLayout(): void {
        this.layout = new Layout(Api.LinearLayout);
        this.layout.orientation = VERTICAL;
    }

    initializeButtons(): void {
        const buttonProxyLayoutParams = Layout.RelativeLayoutParams(WRAP_CONTENT, WRAP_CONTENT);
        buttonProxyLayoutParams.addRule(ALIGN_PARENT_RIGHT);

        this.buttonProxyLayout = new Layout(Api.LinearLayout);
        this.buttonProxyLayout.orientation = HORIZONTAL;
        this.buttonProxyLayout.layoutParams = buttonProxyLayoutParams;

        this.buttonLayout = new Layout(Api.RelativeLayout);
        this.buttonLayout.padding = [10, 3, 10, 3];
        this.buttonLayout.verticalGravity = CENTER;

        this.hide = new TextView(config.strings.hide);
        this.hide.padding = [15, 3, 15, 3];
        this.hide.backgroundColor = TRANSPARENT;
        this.hide.textColor = (config as ObsidianConfig).color.hideFg;
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

        this.close = new TextView(config.strings.close);
        this.close.padding = [15, 3, 15, 3];
        this.close.backgroundColor = TRANSPARENT;
        this.close.textColor = (config as ObsidianConfig).color.closeFg;
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
        const filler = this.textView("\u2800");
        filler.textColor = "#000000";

        add(this.buttonProxyLayout, this.buttonLayout);
        add(this.buttonLayout, this.me);
        add(this.title, this.buttonLayout);
        add(this.subtitle, this.me);
        add(this.layout, this.proxy);
        add(this.proxy, this.me);
        add(filler, this.me);
        add(this.hide, this.buttonProxyLayout);
        add(this.close, this.buttonProxyLayout);
    }

    handleRemove(remove: ComposerHandler): void {
        remove(this.buttonProxyLayout, this.buttonLayout);
        remove(this.buttonLayout, this.me);
        remove(this.close, this.buttonProxyLayout);
        remove(this.hide, this.buttonProxyLayout);
        remove(this.proxy, this.me);
        remove(this.layout, this.proxy);
        remove(this.subtitle, this.me);
        remove(this.title, this.buttonLayout);
    }

    button(text: string, callback?: ThisCallback<Button>, longCallback?: ThisCallback<Button>): Button {
        const gradientDrawable = this.roundedDrawable();
        gradientDrawable.color = config.color.buttonBg;

        const params = Layout.LinearLayoutParams(MATCH_PARENT, MATCH_PARENT);
        params.setMargins(7, 5, 7, 5);

        const btn = button(text, callback, longCallback);
        btn.layoutParams = params;
        btn.allCaps = false;
        btn.textColor = config.color.secondaryText;
        btn.background = gradientDrawable;

        return btn;
    }

    async dialog(title: string, message: string, positiveCallback?: DialogCallback, negativeCallback?: DialogCallback, view?: Java.Wrapper): Promise<Dialog> {
        const dlg = await dialog(title, message, positiveCallback, negativeCallback, view);
        return dlg;
    }

    radioGroup(label: string, buttons: string[], callback?: ThisWithIndexCallback<Button>): RadioGroup {
        const gradientDrawable = this.roundedDrawable();

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
        rg.background = gradientDrawable;

        return rg;
    }

    seekbar(label: string, max: number, min: number = 0, callback?: SeekBarCallback): View {
        const gradientDrawable = this.roundedDrawable();

        const sb = seekbar(label, max, min, (progress: number) => {
            seekbarLabel.text = format(label, progress);
            callback?.call(sb, progress);
        });
        sb.padding = [25, 10, 35, 10];

        const seekbarLabel = this.textView(format(label, sb.progress));

        const layout = new Layout(Api.LinearLayout);
        layout.layoutParams = Layout.LinearLayoutParams(MATCH_PARENT, MATCH_PARENT);
        layout.orientation = VERTICAL;
        layout.background = gradientDrawable;

        add(seekbarLabel, layout);
        add(sb, layout);

        return layout;
    }

    spinner(items: string[], callback?: ThisWithIndexCallback<Spinner>): Spinner {
        const gradientDrawable = this.roundedDrawable();

        const sp = spinner(items, callback);
        sp.background = gradientDrawable;
        sp.background.setColorFilter(1, Api.Mode.SRC_ATOP.value);

        return sp;
    }

    toggle(label: string, callback?: SwitchCallback): Switch {
        const gradientDrawable = this.roundedDrawable();

        const tg = toggle(label, callback);
        tg.textColor = config.color.secondaryText;
        tg.background = gradientDrawable;
        tg.padding = [10, 5, 10, 5];

        return tg;
    }

    textView(label: string): TextView {
        const gradientDrawable = this.roundedDrawable();

        const tv = textView(label);
        tv.textColor = config.color.secondaryText;
        tv.background = gradientDrawable;
        tv.padding = [10, 5, 10, 5];

        return tv;
    }
}

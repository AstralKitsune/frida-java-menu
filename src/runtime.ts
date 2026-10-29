import Java from "frida-java-bridge";

import { Api, WINDOW_SERVICE } from "./api";

export const app = {
    /** Returns app instance */
    get instance(): Java.Wrapper {
        return Api.ActivityThread.currentApplication();
    },

    /** @returns PackageManager instance to find global package information */
    get packageManager(): Java.Wrapper {
        return this.instance.getPackageManager();
    },

    /** @returns The name of this application's package */
    get packageName(): string {
        return this.instance.getPackageName();
    },

    /** @returns The context of the single, global Application object of the current process */
    get context(): Java.Wrapper {
        return this.instance.getApplicationContext();
    },

    /** Returns app orientation */
    get orientation(): number {
        return this.instance.getResources().getConfiguration().orientation.value;
    },

    /** Returns window manager instance */
    get windowManager(): Java.Wrapper {
        return Java.cast(app.context.getSystemService(WINDOW_SERVICE), Api.ViewManager);
    }
};

/** App main activity instance
 *
 * Since this field hacked example call is:
 *
 * ```typescript
 * const activity = await Menu.activityInstance;
 * ```
 */
export const activityInstance: Promise<Java.Wrapper> = new Promise((resolve, reject) => {
    Java.choose(Api.Activity.$className, {
        onMatch: (instance) => {
            if (instance.getComponentName().getClassName() == launcher) {
                resolve(Java.retain(instance));
                return "stop";
            }
        },
        onComplete() {}
    });
});

/** Android version */
export const androidVersion: string = Java.androidVersion;

/** Android API level */
export const apiLevel: number = Api.Build_VERSION.SDK_INT.value;

/** Determines main activity name */
export const launcher: Java.Wrapper = app.packageManager
    .getLaunchIntentForPackage(app.packageName)
    .resolveActivityInfo(app.packageManager, 0)
    .name
    .value;

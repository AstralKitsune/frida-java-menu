import Java from "frida-java-bridge";

import { Api } from "../api";
import { app } from "../runtime";

/** App's SharedPreferences storage */
export class SharedPreferences {
    /**
     * @internal Instance of `SharedPreferences`
     *
     * SharedPreferences is an Android interface that provides a way to store and retrieve key-value pairs of primitive data types in a persistent storage.
     * It is used to save user preferences, settings, and other small amounts of data that need to be retained across app sessions.
     *
     * To write to a shared preferences file, we create a `SharedPreferences.Editor` by calling `edit()` on our `SharedPreferences`.
     * We then put keys and values into the preferences file by using methods like `putString()` and `putInt()`.
     * Finally, we call `apply()` on the editor, which writes the updates to disk asynchronously.
     *
     * Reading values from a shared preferences file is done by calling methods such as `getInt()` and `getString()`,
     * passing in the key for the value we want, and optionally a default value to return if the key isn't present.
     *
     * @see https://developer.android.com/reference/android/content/SharedPreferences
     * @see https://developer.android.com/training/data-storage/shared-preferences
     */
    instance: Java.Wrapper;

    /**
     * Initialize the SharedPreferences instance using the app's context and a unique name for the preferences file.
     * If a preferences file by this name does not exist, it will be created when we retrieve an editor and commit changes.
     * Only one instance of the SharedPreferences object is returned to any callers for the same name.
     *
     * Definition: `public abstract SharedPreferences getSharedPreferences (String name, int mode)`
     *
     * `MODE_PRIVATE` is the default file creation mode, where the created file can only be accessed by our app.
     *
     * @see https://developer.android.com/reference/android/content/Context
     */
    constructor() {
        this.instance = app.context.getSharedPreferences(app.packageName + "_menuprefs", app.context.MODE_PRIVATE.value);
    }
    /** Gets string */
    getString(key: string): string {
        return this.instance.getString(Api.JavaString.$new(key), Api.JavaString.$new(""));
    }
    /** Writes string */
    putString(key: string, value: string) {
        this.instance.edit().putString(Api.JavaString.$new(key), Api.JavaString.$new(value)).apply();
    }
    /** Gets int */
    getInt(key: string): number {
        return this.instance.getInt(Api.JavaString.$new(key), -1);
    }
    /** Writes int */
    putInt(key: string, value: number) {
        this.instance.edit().putInt(Api.JavaString.$new(key), value).apply();
    }
    /** Gets float */
    getFloat(key: string): number {
        return this.instance.getFloat(Api.JavaString.$new(key), -1);
    }
    /** Writes float */
    putFloat(key: string, value: number) {
        this.instance.edit().putFloat(Api.JavaString.$new(key), value).apply();
    }
    /** Gets long */
    getLong(key: string): number {
        return this.instance.getLong(Api.JavaString.$new(key), -1);
    }
    /** Writes long */
    putLong(key: string, value: number) {
        this.instance.edit().putLong(Api.JavaString.$new(key), value).apply();
    }
    /** Gets bool */
    getBool(key: string): boolean {
        return this.instance.getBoolean(Api.JavaString.$new(key), false);
    }
    /** Writes bool */
    putBool(key: string, value: boolean) {
        this.instance.edit().putBoolean(Api.JavaString.$new(key), value).apply();
    }
    /**
     * Retrieves all values from the preferences.
     * You must not modify the collection returned by this method, or alter any of its contents.
     *
     * @returns java.util.Map<java.lang.String, ?>
     * @see https://developer.android.com/reference/android/content/SharedPreferences#getAll()
     */
    getAll(): Java.Wrapper {
        return this.instance.getAll();
    }
    /** Is `key` inside */
    contains(key: string): boolean {
        return !!this.instance.contains(key);
    }
    /** Clears storage */
    clear(): void {
        this.instance.edit().clear().apply();
    }
}

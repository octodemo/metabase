import { createThunkAction } from "metabase/lib/redux";
import Settings from "metabase/lib/settings";
import { Locale } from "./types";

export const SET_LOCALE = "metabase/setup/SET_LOCALE";

export const setLocale = createThunkAction(SET_LOCALE, (locale: Locale) => {
  return () => {
    Settings.set("user-locale", locale.code);
  };
});

# Language Management Guide

This project uses [i18next](https://www.i18next.com/) with the React bindings to drive all translated copy. Each language loads from JSON resource files located in `public/locales/{language}/common.json`.

## Add A New Language

1. **Create the resource file**  
   Duplicate an existing translation file (for example `public/locales/en/common.json`) and place it in a new folder named after the language code you want to add, e.g. `public/locales/fr/common.json`.

2. **Populate translations**  
   Update every key in the new file with the translated text. Keep the JSON structure identical so that components continue to receive the same keys.

3. **Register the language**  
   Open `src/i18n.js` and append the new code to `SUPPORTED_LANGUAGES`. This automatically exposes it to the language detector and the language switcher component.

4. **Expose a user label**  
   Add a new option label under `languageSwitcher.options.<code>` in each translation file so the dropdown can show a user-friendly name (for example `"fr": "Français"`).

5. **Hot reload the dev server**  
   Restart `npm run dev` if it is running so Vite picks up the new static assets.

## Updating Existing Copy

- **Add new keys in English first.** Treat `public/locales/en/common.json` as the reference file and keep other languages in sync.  
- **Keep keys descriptive.** Names such as `calendar.modal.save` provide context for translators and avoid collisions.  
- **Fallback behaviour.** If a key is missing in the active language, the UI falls back to the key name (`nav.home`). Use this as a warning sign during development.

## Testing A Locale

1. Switch languages with the header control or set the `lang` parameter in localStorage (`smgb.language`).
2. Confirm the URL path updates to include the language code (e.g. `/ja/...`).
3. Run `npm run build` to ensure all translation files are loaded by the production build without missing-key warnings.

## Good Practices

- Group related strings in nested objects (e.g. `calendar`, `nav`, `widgets`).
- Keep plain punctuation in the translation files; avoid concatenating sentences in code.
- When adding interpolated values, pass explicit placeholders (`t('widgetPicker.add', { name })`).
- Use the `useI18nFormats` hook in `src/lib/i18n-format.js` for locale-aware date and number formatting rather than formatting manually.

Following these steps keeps every language consistent and simplifies future localisation work.

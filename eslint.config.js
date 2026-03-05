import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import { define } from "./define.config";

const viteDefineGlobals = Object.keys(define).reduce((acc, key) => {
  acc[key] = "readonly";
  return acc;
}, {});

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      globals: globals.browser,
      viteDefineGlobals,
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".vue"],
      },
      globals: globals.browser,
    },
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/html-indent": "off",
      "vue/max-attributes-per-line": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/attributes-order": "off",
      "vue/html-self-closing": "off",
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        chrome: "readonly",
        viteDefineGlobals,
      },
    },
  },
  eslintPluginPrettier,
  eslintConfigPrettier
);

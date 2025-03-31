module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignora archivos compilados.
    "/generated/**/*", // Ignora archivos generados.
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "indent": ["error", 2],
    "valid-jsdoc": "off", // Deshabilita validación de JSDoc
    "max-len": ["error", {"code": 120}], // Aumenta límite de línea a 120 caracteres
    "@typescript-eslint/no-var-requires": "off", // Permite el uso de require
  },
};

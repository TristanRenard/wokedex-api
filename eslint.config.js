import js from "@eslint/js"
import { defineConfig } from "eslint/config"
import globals from "globals"
import tseslint from "typescript-eslint"

export default defineConfig([
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{ts,tsx}"],

        plugins: {
            "@typescript-eslint": tseslint.plugin,
        },

        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                project: "./tsconfig.json",
            },
            globals: {
                ...globals.node,
            },
        },

        rules: {
            "@typescript-eslint/no-unused-vars": ["error", {
                argsIgnorePattern: "^_",
            }],
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/explicit-function-return-type": ["error", {
                allowExpressions: true,
            }],
            "@typescript-eslint/no-inferrable-types": "off",
            "@typescript-eslint/prefer-nullish-coalescing": "error",
            "@typescript-eslint/prefer-optional-chain": "error",
            "@typescript-eslint/no-non-null-assertion": "error",
            "@typescript-eslint/no-unnecessary-type-assertion": "error",
            "@typescript-eslint/prefer-as-const": "error",
            "@typescript-eslint/consistent-type-imports": ["error", {
                prefer: "type-imports",
            }],
            "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
            "@typescript-eslint/no-duplicate-enum-values": "error",
            "@typescript-eslint/no-empty-interface": ["error", {
                allowSingleExtends: true,
            }],
            "@typescript-eslint/no-misused-promises": "error",
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/await-thenable": "error",
            "@typescript-eslint/require-await": "error",

            // Désactiver les règles JavaScript en conflit
            "no-unused-vars": "off",
            "require-await": "off",

            // Règles JavaScript conservées
            "array-callback-return": ["error", {
                allowImplicit: false,
                checkForEach: true,
                allowVoid: true,
            }],

            "no-await-in-loop": "error",
            "no-constant-binary-expression": "error",
            "no-constructor-return": "error",

            "no-duplicate-imports": ["error", {
                includeExports: true,
            }],

            "no-new-native-nonconstructor": "error",

            "no-promise-executor-return": ["error", {
                allowVoid: true,
            }],

            "no-self-compare": "error",
            "no-template-curly-in-string": "error",
            "no-unmodified-loop-condition": "error",
            "no-unreachable-loop": "error",
            "no-unused-private-class-members": "error",
            "arrow-body-style": ["error", "as-needed"],

            camelcase: ["error", {
                properties: "always",
                ignoreDestructuring: true,
                ignoreImports: true,
                ignoreGlobals: true,
            }],

            "capitalized-comments": ["error", "always", {
                ignoreConsecutiveComments: true,
            }],

            "class-methods-use-this": ["error", {
                enforceForClassFields: true,
            }],

            complexity: ["warn", 40],
            "consistent-return": "error",
            curly: ["error", "all"],
            "default-param-last": "error",
            "dot-notation": "error",
            eqeqeq: ["error", "always"],
            "func-name-matching": "error",
            "func-names": "error",

            "func-style": ["error", "expression", {
                allowArrowFunctions: true,
            }],

            "no-restricted-syntax": ["error", {
                selector: "FunctionDeclaration",
                message: "Avoid using function declarations. Use arrow functions instead.",
            }, {
                    selector: "ExportDefaultDeclaration > FunctionDeclaration",
                    message: "Avoid using function keyword in export default. Use arrow functions instead.",
                }, {
                    selector: "MethodDefinition[kind='method'][value.type='FunctionExpression']",
                    message: "Avoid using function keyword in class methods. Use arrow functions instead.",
                }],

            "grouped-accessor-pairs": ["error", "getBeforeSet"],
            "guard-for-in": "error",
            "init-declarations": ["error", "always"],

            "logical-assignment-operators": ["error", "always", {
                enforceForIfStatements: true,
            }],

            "max-classes-per-file": ["error", {
                ignoreExpressions: true,
            }],

            "max-depth": ["error", 4],

            "max-lines": ["error", {
                max: 600,
                skipBlankLines: true,
                skipComments: true,
            }],

            "max-lines-per-function": ["warn", {
                max: 300,
                skipBlankLines: true,
                skipComments: true,
            }],

            "max-nested-callbacks": ["error", 3],
            "max-params": ["error", 3],
            "multiline-comment-style": ["error", "separate-lines"],
            "new-cap": "error",
            "no-bitwise": "error",
            "no-caller": "error",
            "no-console": "warn",
            "no-else-return": "error",
            "no-empty-function": "error",
            "no-empty-static-block": "error",
            "no-eq-null": "error",
            "no-eval": "error",
            "no-extend-native": "error",
            "no-extra-label": "error",
            "no-implicit-coercion": "error",
            "no-implicit-globals": "error",
            "no-implied-eval": "error",
            "no-inline-comments": "error",
            "no-invalid-this": "error",
            "no-iterator": "error",
            "no-labels": "error",
            "no-lone-blocks": "error",
            "no-lonely-if": "error",
            "no-loop-func": "error",
            "no-multi-assign": "error",
            "no-multi-str": "error",
            "no-nested-ternary": "off",
            "no-new": "error",
            "no-new-func": "error",
            "no-new-wrappers": "error",
            "no-object-constructor": "error",
            "no-octal-escape": "error",
            "no-param-reassign": "error",
            "no-proto": "error",
            "no-return-assign": ["error", "always"],
            "no-script-url": "error",
            "no-sequences": "error",
            "no-shadow": "error",
            "no-throw-literal": "error",
            "no-undef-init": "error",

            "no-underscore-dangle": ["error", {
                allowFunctionParams: false,
                allow: ["_id"],
            }],

            "no-unneeded-ternary": ["error", {
                defaultAssignment: false,
            }],

            "no-unused-expressions": ["error", {
                enforceForJSX: false,
            }],

            "no-useless-call": "error",

            "no-useless-computed-key": ["error", {
                enforceForClassMembers: true,
            }],

            "no-useless-concat": "error",
            "no-useless-constructor": "error",
            "no-useless-rename": "error",
            "no-useless-return": "error",
            "no-var": "error",

            "no-warning-comments": ["error", {
                terms: ["todo"],
            }],

            "object-shorthand": ["error", "always"],
            "one-var": ["error", "never"],
            "operator-assignment": ["error", "always"],
            "prefer-arrow-callback": "error",

            "prefer-const": ["error", {
                destructuring: "any",
                ignoreReadBeforeAssign: false,
            }],

            "prefer-destructuring": "error",
            "prefer-exponentiation-operator": "error",
            "prefer-numeric-literals": "error",
            "prefer-object-has-own": "error",
            "prefer-object-spread": "error",
            "prefer-promise-reject-errors": "error",

            "prefer-regex-literals": ["error", {
                disallowRedundantWrapping: true,
            }],

            "prefer-rest-params": "error",
            "prefer-spread": "error",
            "prefer-template": "error",
            radix: "error",
            "symbol-description": "error",
            yoda: "error",

            "line-comment-position": ["error", {
                position: "above",
            }],

            indent: "off",
            "linebreak-style": ["error", "unix"],
            "newline-before-return": "error",
            "no-undef": "error",
            "padded-blocks": ["error", "never"],

            "padding-line-between-statements": ["error", {
                blankLine: "always",
                prev: "*",

                next: [
                    "break",
                    "case",
                    "cjs-export",
                    "class",
                    "continue",
                    "do",
                    "if",
                    "switch",
                    "try",
                    "while",
                    "return",
                ],
            }, {
                    blankLine: "always",

                    prev: [
                        "break",
                        "case",
                        "cjs-export",
                        "class",
                        "continue",
                        "do",
                        "if",
                        "switch",
                        "try",
                        "while",
                        "return",
                    ],

                    next: "*",
                }, {
                    blankLine: "never",
                    prev: ["const", "export"],
                    next: "const",
                }],

            quotes: ["error", "double", {
                avoidEscape: true,
                allowTemplateLiterals: true,
            }],

            "space-before-blocks": "error",
            semi: ["error", "never"],
        },
    }])
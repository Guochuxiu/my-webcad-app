import globals from 'globals';
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
    js.configs.recommended,
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            globals: {
                ...globals.browser
            }
        },
        plugins: {
            '@typescript-eslint': tsPlugin
        },
        rules: {
            // 基础规则
            'no-debugger': 'warn', // 禁止使用debugger
            'no-alert': 'warn', // 禁止使用alert
            'no-var': 'error', // 禁止使用var
            'prefer-const': 'error', // 建议使用const
            'no-unused-vars': 'off', // 禁止定义未使用的变量

            // 代码风格
            'indent': ['error', 4, {
                'SwitchCase': 1, // switch case 语句缩进1个层级
                'VariableDeclarator': 1, // 变量声明缩进1个层级
                'outerIIFEBody': 1, // 立即执行函数缩进1个层级
                'MemberExpression': 1, // 链式调用缩进1个层级
                'FunctionDeclaration': {
                    'parameters': 1, // 函数参数缩进1个层级
                    'body': 1 // 函数体缩进1个层级
                },
                'FunctionExpression': {
                    'parameters': 1, // 函数表达式参数缩进1个层级
                    'body': 1 // 函数表达式体缩进1个层级
                },
                'CallExpression': {
                    'arguments': 1 // 函数调用参数缩进1个层级
                },
                'ArrayExpression': 1, // 数组缩进1个层级
                'ObjectExpression': 1, // 对象缩进1个层级
                'ImportDeclaration': 1, // import语句缩进1个层级
                'flatTernaryExpressions': false, // 三元表达式不允许平铺
                'offsetTernaryExpressions': true, // 三元表达式缩进
                'ignoreComments': false // 注释跟随代码缩进
            }], 
            'quotes': ['error', 'single'], // 使用单引号
            'semi': ['error', 'always'], // 必须使用分号
            'comma-dangle': ['error', 'never'], // 禁止末尾逗号
            'no-multiple-empty-lines': ['error', { 
                'max': 1,                    // 最多允许连续一个空行
                'maxEOF': 1,                 // 文件末尾最多一个空行
                'maxBOF': 0                  // 文件开头不允许空行
            }],
            'padding-line-between-statements': [
                'error',
                { blankLine: 'always', prev: '*', next: 'return' },          // return 语句前必须有空行
                // { blankLine: 'always', prev: ['const', 'let'], next: '*' },  // 变量声明后必须有空行
                { blankLine: 'any',    prev: ['const', 'let'], next: ['const', 'let'] }, // 连续变量声明可不需要空行
                { blankLine: 'always', prev: 'directive', next: '*' },       // 指令后必须有空行
                { blankLine: 'always', prev: ['case', 'default'], next: '*' }, // case/default 后必须有空行
                { blankLine: 'always', prev: '*', next: 'function' },        // 函数声明前必须有空行
                { blankLine: 'always', prev: '*', next: 'class' },           // class 声明前必须有空行
                { blankLine: 'always', prev: '*', next: 'block-like' }       // 代码块前必须有空行
            ],
            'lines-between-class-members': ['error', 'always', { 
                exceptAfterSingleLine: true  // 单行类成员后可以不空行
            }],
            'eol-last': ['error', 'always'], // 文件末尾必须有一个空行
            'object-curly-spacing': ['error', 'always'], // 对象字面量大括号前后必须有空格
            'comma-spacing': ['error', { 'before': false, 'after': true }], // 逗号前不空格，后空格
            'key-spacing': ['error', { 
                'beforeColon': false,  // 冒号前不要空格
                'afterColon': true,    // 冒号后必须有空格
                'mode': 'strict'       // 严格模式
            }], // 对象属性冒号的空格规则
            'space-before-blocks': ['error', 'always'], // 大括号前必须有空格
            'space-before-function-paren': ['error', {
                'anonymous': 'always',
                'named': 'never',
                'asyncArrow': 'always'
            }], // 函数括号前的空格规则
            'space-in-parens': ['error', 'never'], // 禁止圆括号内的空格
            'space-infix-ops': 'error', // 操作符前后必须有空格
            'array-bracket-spacing': ['error', 'never'], // 数组括号内不要空格
            'semi-spacing': ['error', {
                'before': false,  // 分号前不允许空格
                'after': true    // 分号后需要空格
            }],

            // TypeScript 相关
            '@typescript-eslint/explicit-function-return-type': 'off', // 函数返回值类型
            '@typescript-eslint/no-explicit-any': 'off', // 允许使用any
            '@typescript-eslint/no-unused-vars': 'off', // 未使用的变量
            '@typescript-eslint/no-empty-interface': 'warn', // 空接口警告
            '@typescript-eslint/no-empty-function': 'warn', // 空函数警告

            // 导入导出
            'import/no-unresolved': 'off', // 导入模块检查
            'import/prefer-default-export': 'off', // 默认导出
            'import/no-extraneous-dependencies': 'off' // 外部依赖检查
        }
    }
];

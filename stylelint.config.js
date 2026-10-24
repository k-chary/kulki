// CSS Modules may only use design tokens: no raw colors, sizes, durations
// or font names (docs/SPEC.md, "Design system and components").
const keywords = [
  'inherit',
  'initial',
  'unset',
  'revert',
  'none',
  'auto',
  'currentColor',
  'transparent',
  '0',
  '100%',
];

const strictProperties = [
  // Colors
  '/color$/',
  'fill',
  'stroke',
  // Type
  'font-family',
  'font-size',
  'line-height',
  'letter-spacing',
  // Sizes and spacing
  '/^(min-|max-)?(width|height)$/',
  '/^(min-|max-)?(block|inline)-size$/',
  '/^(margin|padding)/',
  '/^(row-|column-)?gap$/',
  '/^(top|right|bottom|left|inset)$/',
  '/^border(-(top|right|bottom|left))?-width$/',
  '/radius$/',
  'box-shadow',
  'outline-offset',
  // Layers
  'z-index',
  // Motion
  '/^(transition|animation)-(duration|delay|timing-function)$/',
];

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-declaration-strict-value'],
  // A verbatim copy of the design canvas's file (docs/design/README.md).
  ignoreFiles: ['src/styles/tokens.css'],
  rules: {
    'selector-class-pattern': null,
  },
  overrides: [
    {
      files: ['**/*.module.css'],
      rules: {
        'scale-unlimited/declaration-strict-value': [strictProperties, { ignoreValues: keywords }],
        // Shorthands (border, background, transition, font...) can hide raw
        // values from the rule above, so ban the raw forms outright too.
        'color-no-hex': true,
        'color-named': 'never',
        'function-disallowed-list': [
          'rgb',
          'rgba',
          'hsl',
          'hsla',
          'hwb',
          'lab',
          'lch',
          'oklab',
          'oklch',
          'color',
        ],
        'unit-disallowed-list': ['px', 'rem', 'em', 'pt', 'ms', 's'],
      },
    },
  ],
};

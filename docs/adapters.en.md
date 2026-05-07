# Site adapters

English | [中文版](adapters.md)

Adapters isolate site-specific DOM details from generic content-script behavior.

## Interface

- `match()`: whether adapter is active on current page
- `getInputBoxes()`: provide additional rewrite targets
- `injectRewriteButton()`: reserved for special injection cases
- `extractContext()`: optional short context extraction

## Built-in

- X/Twitter adapter: `extension/src/adapters/x.ts`

## Rule

Keep adapter files focused and maintainable so site DOM changes are fixed in one place.

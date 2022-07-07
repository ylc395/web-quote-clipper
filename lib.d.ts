declare module 'unique-selector';
declare module 'block-elements';
declare module 'dom-highlight-range';
declare module 'md-attr-parser';

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

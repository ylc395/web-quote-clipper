import { unified, PluggableList, Processor } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkHtml from 'remark-html';
import type { Image, Parent } from 'mdast';

export default class Markdown {
  private readonly renderer: Processor;
  private readonly transformer: Processor;
  constructor(options?: {
    renderPlugins?: PluggableList;
    transformPlugins?: PluggableList;
  }) {
    this.renderer = unified()
      .use(remarkParse)
      .use(remarkHtml)
      .use(options?.renderPlugins || []);

    this.transformer = unified()
      .use(remarkParse)
      .use(remarkStringify)
      .use(options?.transformPlugins || []);
  }
  render(md: string) {
    return this.renderer.processSync(md).toString();
  }

  async transform(md: string) {
    return await (await this.transformer.process(md)).toString();
  }

  static isImageNode(node: any): node is Image {
    return node.type === 'image';
  }

  static isParent(node: any): node is Parent {
    return Array.isArray(node.children);
  }
}

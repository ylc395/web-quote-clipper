import { container, singleton } from 'tsyringe';
import { Ref, ref } from '@vue/reactivity';
import MarkdownIt from 'markdown-it';
import { load as loadHtml } from 'cheerio';
import type { Quote, Note } from 'model/index';
import { databaseToken, storageToken } from 'model/index';

const TAG = 'web-quote';
const WRITE_TARGET_ID = 'WRITE_TARGET_ID';

@singleton()
export default class DataService {
  private readonly md = new MarkdownIt();
  private readonly db = container.resolve(databaseToken);
  private readonly storage = container.resolve(storageToken);
  readonly writeTargetPath = ref('');
  private writeTargetId = '';
  readonly quotes: Ref<Required<Quote>[]> = ref([]);
  constructor() {
    // this.md.use(MarkdownItAttrs).use(MarkdownItAttribution);
    this.initQuotes();
    this.initWriteTarget();
  }

  private async initQuotes() {
    await this.db.ready();
    const notes = await this.db.getNotesByTag(TAG);
    this.quotes.value = notes.flatMap((note) => this.extractQuotes(note));
  }

  private async initWriteTarget() {
    this.writeTargetId = await this.storage.get(WRITE_TARGET_ID);

    try {
      this.writeTargetPath.value = (
        await this.db.getNoteById(this.writeTargetId)
      ).id;
    } catch {
      this.writeTargetId = '';
      await this.storage.set(WRITE_TARGET_ID, '');
    }
  }

  private extractQuotes(note: Required<Note>) {
    const html = this.md.render(note.content);
    const htmlDocument = this.md.render(html);
    const $ = loadHtml(htmlDocument);
    const blockquoteContainers = $('.c-blockquote');
    const quotes: Required<Quote>[] = [];

    blockquoteContainers.each((_, el) => {
      const $el = $(el);
      const sourceUrl = $el.find('.c-cite a').attr('href');
      const content = $el
        .find('blockquote > p')
        .toArray()
        .map((el) => $(el).text());
      const locator = $el.find('blockquote').data('locator') as string;
      const comment = $el
        .find('.c-quote-comment')
        .toArray()
        .map((el) => $(el).text())
        .join('\n');

      if (sourceUrl && content && locator) {
        quotes.push({
          sourceUrl,
          content,
          locator,
          comment,
          note: {
            id: note.id,
            path: note.path,
          },
        });
      }
    });

    return quotes;
  }

  async setWriteTarget({ id, path }: Note) {
    this.writeTargetPath.value = path;
    this.writeTargetId = id;
    await this.storage.set(WRITE_TARGET_ID, id);
  }

  async createQuote(quote: Quote) {
    if (!this.writeTargetId) {
      throw new Error('empty write target id');
    }

    const newQuote: Required<Quote> = {
      ...quote,
      note: { id: this.writeTargetId, path: this.writeTargetPath.value },
    };
    await this.db.postQuote(newQuote);
    this.quotes.value.push(newQuote);
  }

  async updateQuote(quote: Required<Quote>) {
    const comment = quote.comment.replace(/\n/g, '\n>\n');
    quote.comment = comment;
    await this.db.putQuote(quote);
  }
}

import MarkManager from './MarkManager';
import HighlightTooltip from './HighlightTooltip';

export default class App {
  readonly markManager: MarkManager;
  readonly highlightTooltip: HighlightTooltip;
  constructor() {
    this.markManager = new MarkManager(this);
    this.highlightTooltip = new HighlightTooltip(this);
  }
}

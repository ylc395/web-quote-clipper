import MarkManager from './MarkManager';
import HighlightTooltip from './HighlightTooltip';

export default class App {
  readonly markManager: MarkManager;
  readonly highlightTooltip: HighlightTooltip;
  constructor() {
    this.highlightTooltip = new HighlightTooltip(this);
    this.markManager = new MarkManager(this);
  }
}

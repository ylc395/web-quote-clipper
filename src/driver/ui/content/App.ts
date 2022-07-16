import MarkManager from './MarkManager';
import Tooltip from './Tooltip';

export default class App {
  readonly markManager: MarkManager;
  readonly tooltip: Tooltip;
  constructor() {
    this.markManager = new MarkManager(this);
    this.tooltip = new Tooltip(this);
  }
}

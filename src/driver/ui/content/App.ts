import MarkManager from './MarkManager';
import Tooltip from './Tooltip';

export default class App {
  readonly markManager: MarkManager;
  readonly tooltip: Tooltip;
  constructor() {
    this.markManager = MarkManager.init(this);
    this.tooltip = Tooltip.init(this);
  }
}

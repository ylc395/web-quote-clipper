import { onUpdated, onBeforeUpdate, inject } from 'vue';
import type DomMonitor from '../service/DomMonitor';
import { token } from '../service/MarkManager';

export default function useDomMonitor(domMonitor?: DomMonitor) {
  domMonitor = domMonitor || inject(token)!.domMonitor;
  onBeforeUpdate(domMonitor.stop);
  onUpdated(domMonitor.start);
}

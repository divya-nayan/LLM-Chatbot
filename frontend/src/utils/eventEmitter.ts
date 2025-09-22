class EventEmitter {
  private events: { [key: string]: Array<(...args: any[]) => void> } = {};

  on(event: string, listener: (...args: any[]) => void) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: (...args: any[]) => void) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(...args));
  }
}

export const documentEvents = new EventEmitter();

export const DOCUMENT_EVENTS = {
  UPLOADED: 'document:uploaded',
  DELETED: 'document:deleted',
  PROCESSED: 'document:processed'
};
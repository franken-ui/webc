class DarkModeObserver {
  private observer: MutationObserver;

  private subscribers: ((isDark: boolean) => void)[] = [];

  constructor() {
    this.observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      this.subscribers.forEach((subscriber) => subscriber(isDark));
    });

    this.observer.observe(document.documentElement, {
      attributeFilter: ["class"],
      attributeOldValue: true,
    });
  }

  subscribe(subscriber: (isDark: boolean) => void) {
    this.subscribers.push(subscriber);
  }

  unsubscribe(subscriber: (isDark: boolean) => void) {
    const index = this.subscribers.indexOf(subscriber);
    if (index !== -1) {
      this.subscribers.splice(index, 1);
    }
  }
}

export const darkModeObserver = new DarkModeObserver();

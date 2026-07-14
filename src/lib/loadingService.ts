import { useState, useEffect } from "react";

class LoadingService {
  private activeCount = 0;
  private listeners: Set<(loading: boolean) => void> = new Set();

  show() {
    this.activeCount++;
    this.notify();
  }

  hide() {
    this.activeCount = Math.max(0, this.activeCount - 1);
    this.notify();
  }

  get isLoading() {
    return this.activeCount > 0;
  }

  subscribe(listener: (loading: boolean) => void) {
    this.listeners.add(listener);
    // Call immediately with current state
    listener(this.isLoading);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const current = this.isLoading;
    this.listeners.forEach((listener) => listener(current));
  }
}

export const loadingService = new LoadingService();

export function useGlobalLoading() {
  const [loading, setLoading] = useState(loadingService.isLoading);

  useEffect(() => {
    return loadingService.subscribe((state) => {
      setLoading(state);
    });
  }, []);

  return loading;
}

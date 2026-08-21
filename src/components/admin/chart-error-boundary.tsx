"use client";

import { Component, type ReactNode } from "react";

/** Keeps a chart failure from taking down the training attendance workspace. */
export class ChartErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return this.props.fallback ?? <p className="text-sm text-zvv-muted">Grafiek tijdelijk niet beschikbaar.</p>;
    }
    return this.props.children;
  }
}

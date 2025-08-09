declare namespace JSX {
  interface IntrinsicElements {
    'spline-viewer': {
      url?: string
      ref?: any
      style?: React.CSSProperties
      className?: string
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'spline-viewer': HTMLElement
  }
} 
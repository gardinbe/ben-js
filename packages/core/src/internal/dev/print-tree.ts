import { type Component } from '../../index.dev'
import { getComponentDebugInfo } from './utils'

export const printTree = (component: Component) => {
  const lines: Array<string> = []
  const colors: Array<string> = []

  const walk = (inner: Component, indent = '') => {
    const info = getComponentDebugInfo(inner)
    lines.push(`${indent}${info.name}`)
    colors.push(`color:${info.color}`)

    for (const child of info.getChildren()) {
      walk(child, `${indent}  `)
    }
  }

  walk(component)
  console.log(lines.map(line => `%c${line}`).join('\n'), ...colors)
}

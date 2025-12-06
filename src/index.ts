// Export the main Trace class and utility function for easy importing
export { Trace, runTrace } from './trace.js'

// Demo usage when run directly as main module
// In ESM, we check if this module is being run directly
import { fileURLToPath } from 'url'
import { argv } from 'process'

if (fileURLToPath(import.meta.url) === argv[1]) {
  const { runTrace } = await import('./trace.js')
  console.log(`1 + 10 = ${runTrace('1 + 10')}`)
}


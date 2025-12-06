// Export the main Trace class and utility function for easy importing
export { Trace, runTrace } from './trace.js'

// Demo usage when run directly as main module
// In ESM, we check process.argv to see if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const { runTrace } = await import('./trace.js')
  console.log(`1 + 10 = ${runTrace('1 + 10')}`)
}


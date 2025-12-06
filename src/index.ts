// Export the main Trace class and utility function for easy importing
export { Trace, runTrace } from './trace'

// Demo usage when run directly
if (require.main === module) {
  // Import the function we just exported
  const { runTrace: run } = require('./index')
  console.log(`1 + 10 = ${run('1 + 10')}`)
}


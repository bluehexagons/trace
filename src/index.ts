// Export the main Trace class and utility function for easy importing
export { Trace, runTrace } from './trace'

// Demo usage when run directly
if (require.main === module) {
  const { runTrace } = require('./trace')
  console.log(`1 + 10 = ${runTrace('1 + 10')}`)
}


import { fileURLToPath } from 'url'
import { argv } from 'process'
import { runTrace } from './trace.js'

if (fileURLToPath(import.meta.url) === argv[1]) {
  try {
    console.log(`1 + 10 = ${runTrace('1 + 10')}`)
  } catch (e) {
    console.error('Error:', e)
    process.exit(1)
  }
}

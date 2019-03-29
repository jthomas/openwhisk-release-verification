// pass-thru logger which captures all log messages.
// needed to retrieved logging output for validation tasks
const _logs = []

const log = str => {
  _logs.push(str)
  console.log(str)
}

const logs = () => _logs 

const clear = () => _logs.length = 0

module.exports = { log, logs, clear }

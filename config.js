const os = require('os')
const { machineIdSync } = require('node-machine-id')

if (process.env.NODE_ENV == 'development') {
    const machineId = machineIdSync() + '_' + os.hostname()
    process.env.VUE_APP_WHITEBOX_CONTEXT = machineId
}

module.exports = {
    outputDir: 'out',
}
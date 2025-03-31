const { execSync } = require('child_process')
const { logger } = require('../utils/logger')

function GenCVESync() {
  try {
    // 执行 grep 命令并获取输出
    const cmdSBOM = `/app/syft scan /workdir -o cyclonedx-json > /app/sbom.json` // -vv
    logger.Debug(cmdSBOM)
    execSync(cmdSBOM).toString()
    const CVE = `bomber scan /app/sbom.json --output=json > /workdir/cve.json` //--debug
    logger.Debug(CVE)
    execSync(CVE).toString()
  } catch (error) {
    logger.Info(error)
  }
}

module.exports = {
  GenCVESync
}

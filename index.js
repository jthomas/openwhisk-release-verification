"use strict";

const releases = require('./lib/releases.js')
const verify = require('./lib/verify.js')
const archive = require('./lib/archive.js')
const fs = require('fs')

;(async ()=>{
  const project = 'openwhisk'
  const versions = await releases.versions(project)
  console.log(versions)

  const version = 'apache-openwhisk-3.19.0-incubating-rc1'
  const files = await releases.files(project, version)
  console.log(files)

  const keys = await releases.keys(project)

  const file_checks = files.map(async file => {
    console.log('verifying', file)
    const sig = await releases.file_sig(project, version, file)
    const hash = await releases.file_hash(project, version, file)

    const file_name = await releases.download_file(project, version, file)

    const hash_operation = verify.hash(fs.createReadStream(file_name), hash)
    const sig_operation = verify.signature(fs.createReadStream(file_name), sig, keys)

    const [hash_result, sig_result] = await Promise.all([hash_operation, sig_operation])

    const result = { name: file, is_sig_valid: sig_result.valid, is_hash_valid: hash_result.valid, is_disclaimer_valid: false, is_notice_valid: false, is_license_valid: false } 

    const file_stream = fs.createReadStream(file_name)
    try {
      const contents = await archive.files(file_stream, ['DISCLAIMER.txt', 'NOTICE.txt', 'LICENSE.txt'])

      if (contents['DISCLAIMER.txt']) {
        result.is_disclaimer_valid = verify.disclaimer(contents['DISCLAIMER.txt'])
      }
      if (contents['NOTICE.txt']) {
        result.is_notice_valid = verify.notice(contents['NOTICE.txt'])
      }

      if (contents['LICENSE.txt']) {
        result.is_license_valid = verify.license(contents['LICENSE.txt'])
      }

    } catch (err)  {
      console.log(err)
    }

    return result
  })

  const result = await Promise.all(file_checks)
  console.log(result)
})();

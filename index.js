"use strict";

const releases = require('./lib/releases.js')
const verify = require('./lib/verify.js')
const fs = require('fs')

// NEED TO WORK ON ERRORS
;(async ()=>{
  const project = 'openwhisk'
  const versions = await releases.versions(project)
  console.log(versions)

  const version = 'apache-openwhisk-0.10.0-incubating-rc1'
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
    const archive_operation = verify.archive_files(fs.createReadStream(file_name), sig, keys)

    const [hash_result, sig_result, archive_files] = await Promise.all([hash_operation, sig_operation, archive_operation])

    const result = { name: file, is_sig_valid: sig_result.valid, is_hash_valid: hash_result.valid, archive_files } 

    return result
  })

  // what about errors?
  const result = await Promise.all(file_checks)
  console.log(result)
})();

"use strict";

const path = require('path')
const crypto = require('crypto')
const openpgp = require('openpgp')
const archive = require('./archive.js')
const logger = require('./logger.js')
const keys = require('./keys.js')
const diff = require('./diff.js')

const parse_hash_from_file = (file_contents) => {
  const [file, signature] = file_contents.split(':')

  const signature_string = signature.toLowerCase().replace(/[^A-Za-z0-9]/g, "")
  return {name: file, signature: signature_string}
}

const hash = async (file_stream, hash_file, name) => {
  return new Promise((resolve, reject) => {
    const sha512 = parse_hash_from_file(hash_file)

    const hmac = crypto.createHash('sha512')
    file_stream.pipe(hmac)

    hmac.on('readable', () => {
      const stream_hash = hmac.read().toString('hex')
      const valid = stream_hash === sha512.signature
      logger.log(`file (${name}) calculated hash: ${stream_hash}`)
      logger.log(`file (${name}) hash from file:  ${sha512.signature}`)
      resolve({valid})
    })

    hmac.on('error', err => reject(err))
  })
}

const signature = async (file_stream, signature, public_keys, name) => {
  const options = {
    message: openpgp.message.fromBinary(file_stream),
    signature: await openpgp.signature.readArmored(signature),
    publicKeys: await keys.parse(public_keys)
  }

  const verified = await openpgp.verify(options)
  await openpgp.stream.readToEnd(verified.data)
  const valid = await verified.signatures[0].verified; // true

  const pks_ids = options.publicKeys.map(pk => pk.getKeyId().toHex())
  logger.log(`file (${name}) signature checking against public keys with ids: ${pks_ids.join(', ')}`)

  if (valid) {
    logger.log(`file (${name}) signed by key with id: ${verified.signatures[0].keyid.toHex()}`)
  } else {
    logger.log(`file (${name}) signature validation failed, not signed using available public keys`)
  }

  return { valid }
}

// DISCLAIMER files should be missing from archive.
// These were only relevant in the incubator phase.
// Check error code refers to missing file...
const disclaimer = (err, file, contents) => {
  const missing_disclaimer = !!(err && err.code == 'ENOENT')
  logger.log(`file (${file}) DISCLAIMER.txt is not included in archive: ${missing_disclaimer}`)

  return missing_disclaimer
}

// README should not include ASF incubation disclaimer notice.
const readme = (err, file, contents) => {
  const missing_disclaimer = !contents.match(/undergoing incubation at The Apache Software Foundation/)
  logger.log(`file (${file}) README.md does not have incubation disclaimer: ${missing_disclaimer}`)

  return missing_disclaimer
}
  
const license = (err, file, contents, name) => check_file_contents(
  diff.license(contents, file), file, 'LICENSE.txt'
)

const notice = (err, file, contents, name) => check_file_contents(
  diff.notice(contents, file, name), file, 'NOTICE.txt'
)

const check_file_contents = (patch, file, filename) => {
  const correct_contents= !patch
  logger.log(`file (${file}) ${filename} has valid contents: ${correct_contents}`)

  if (!correct_contents) {
    patch.split('\n').forEach(logger.log)
  }
  return correct_contents
}

const file_to_dir = file => {
  const project = file.match(/openwhisk-.*\d/)[0]
  return project
}

const find_binary_paths = async (file, path) => {
  const binary_paths = await archive.binary_files(path)

  if (binary_paths.length) {
    logger.log(`file (${file}) has binary files at the following paths: ${binary_paths}`)
  } else {
    logger.log(`file (${file}) has no binary files in the archive`)
  }

  return binary_paths
}

const find_third_party_libs = async (file, path) => {
  const third_party_libs = await archive.third_party_libs(path)
  
  if (third_party_libs.length) {
    logger.log(`file (${file}) has third party libs in the following directories: ${third_party_libs}`)
  } else {
    logger.log(`file (${file}) has no third party lib directories in the archive`)
  }

  return third_party_libs
}

const archive_files = async (archive_stream, project_id, file) => {
  const validators = {
    'DISCLAIMER.txt': disclaimer, 'NOTICE.txt': notice, 'LICENSE.txt': license, 'README.md': readme
  }

  // archive directory has source files under top-level directory based
  // on project name
  const archive_path = await archive.extract(archive_stream)
  const archive_dir = file_to_dir(file)
  const dir_path = path.format({ dir: archive_path, base: archive_dir})

  const binary_paths = await find_binary_paths(file, dir_path)
  const third_party_libs = await find_third_party_libs(file, dir_path)
  const files = await archive.file_validators(dir_path, validators, project_id, file)

  return { files, binary_paths, third_party_libs }
}

module.exports = { hash, signature, archive_files, license, notice, disclaimer, readme }

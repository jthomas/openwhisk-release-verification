"use strict";

const crypto = require('crypto')
const openpgp = require('openpgp')
const fs = require('fs')
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

const disclaimer = (file, contents, name) => check_file_contents(
  diff.disclaimer(contents, file, name), file, 'DISCLAIMER.txt'
)

const license = (file, contents) => check_file_contents(
  diff.license(contents, file), file, 'LICENSE.txt'
)

const notice = (file, contents, name) => check_file_contents(
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

const archive_files = async (archive_stream, project_id, file) => {
  const files_valid = {
    'DISCLAIMER.txt': disclaimer, 'NOTICE.txt': notice, 'LICENSE.txt': license
  }
  const file_names = Object.keys(files_valid)
  const archive_files = await archive.files(archive_stream, file_names)

  const results = file_names.reduce((result, name) => {
    result[name] = archive_files[name] 
      && files_valid[name](file, archive_files[name], project_id)
    return result
  }, {})

  return results
}

const excluded_files = async (archive_stream, file) => {
  const paths = await archive.paths(archive_stream, archive.excluded)
  if (paths.length) {
    paths.forEach(path => {
      logger.log(`file (${file}) contains non-source file in the archive: ${path}`)
    })
  } else {
    logger.log(`file (${file}) only contains source files in the archive`)
  }

  return paths
}

module.exports = { hash, signature, archive_files, excluded_files, license, notice, disclaimer }

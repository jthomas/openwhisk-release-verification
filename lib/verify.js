"use strict";

const crypto = require('crypto')
const openpgp = require('openpgp')
const fs = require('fs')
const archive = require('./archive.js')
const logger = require('./logger.js')
const keys = require('./keys.js')

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

const disclaimer = (file, contents, name) => matches_template(file, 'DISCLAIMER.txt', `Apache OpenWhisk ${name}`, contents)
const license = (file, contents) => matches_template(file, 'LICENSE.txt', '', contents)
const notice = (file, contents, name) => matches_template(file, 'NOTICE.txt', `Apache OpenWhisk ${name}`, contents)

const matches_template = (file, id, prefix, contents) => {
  const template = fs.readFileSync(`templates/${id}`, 'utf-8')
  const correct_project_name = contents.startsWith(prefix) 
  const correct_contents = contents.includes(template)

  if (prefix) {
    logger.log(`file (${file}) checking ${id} has correct project name: ${correct_project_name}`)
  }

  logger.log(`file (${file}) checking ${id} has valid contents: ${correct_contents}`)

  return correct_project_name && correct_contents
}

const archive_files = async (archive_stream, project_id, file) => {
  const files_valid = {
    'DISCLAIMER.txt': disclaimer, 'NOTICE.txt': notice, 'LICENSE.txt': license
  }
  const file_names = Object.keys(files_valid)
  const contents = await archive.files(archive_stream, file_names)

  const results = file_names.reduce((result, name) => {
    result[name] = contents[name] && files_valid[name](file, contents[name], project_id)
    return result
  }, {})

  return results
}

module.exports = { hash, signature, archive_files, license, notice, disclaimer }

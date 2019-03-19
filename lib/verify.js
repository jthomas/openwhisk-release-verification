"use strict";

const crypto = require('crypto')
const openpgp = require('openpgp')
const fs = require('fs')

const parse_hash_from_file = (file_contents) => {
  const [file, signature] = file_contents.split(':')

  const signature_string = signature.toLowerCase().replace(/[^A-Za-z0-9]/g, "")
  return {name: file, signature: signature_string}
}

const hash = async (file_stream, hash_file) => {
  return new Promise((resolve, reject) => {
    const sha512 = parse_hash_from_file(hash_file)

    const hmac = crypto.createHash('sha512')
    file_stream.pipe(hmac)

    hmac.on('readable', () => {
      const stream_hash = hmac.read().toString('hex')
      const valid = stream_hash === sha512.signature
      console.log('hash from stream', stream_hash, 'from file', sha512.signature)
      resolve({valid})
    })

    hmac.on('error', err => reject(err))
  })
}

const signature = async (file_stream, signature, public_keys) => {
  const options = {
    message: openpgp.message.fromBinary(file_stream),
    signature: await openpgp.signature.readArmored(signature),
    publicKeys: (await openpgp.key.readArmored(public_keys)).keys
  }

  const verified = await openpgp.verify(options)
  await openpgp.stream.readToEnd(verified.data)
  const valid = await verified.signatures[0].verified; // true
  if (valid) {
    console.log('file signed by key with id:', verified.signatures[0].keyid.toHex())
  }

  return { valid }
}

const disclaimer = contents => matches_template('DISCLAIMER.txt', 'Apache OpenWhisk', contents)
const license = contents => matches_template('LICENSE.txt', '', contents)
const notice = contents => matches_template('NOTICE.txt', 'Apache OpenWhisk', contents)

const matches_template = (id, prefix, contents) => {
  const template = fs.readFileSync(`templates/${id}`, 'utf-8')
  return contents.startsWith(prefix) && contents.includes(template)
}

module.exports = { hash, signature, disclaimer, notice, license }

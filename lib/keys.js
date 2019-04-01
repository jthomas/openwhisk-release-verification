"use strict";

const openpgp = require('openpgp')

const parse = async source => {
  const armored_keys = source.match(/-----BEGIN([^])*?END(.)*/g)

  const public_keys = armored_keys.map(async key => {
    const pks = (await openpgp.key.readArmored(key)).keys
    return pks[0]
  })

  return Promise.all(public_keys)
}

module.exports = { parse }

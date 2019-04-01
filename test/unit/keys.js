import test from 'ava'
import keys from '../../lib/keys.js'
import fs from 'fs'

test('should return single key from text', async t => {
  const key = fs.readFileSync('./test/unit/resources/SINGLE-KEY', 'utf-8')
  const pks = await keys.parse(key)
  t.is(pks.length, 1)
  t.is(pks[0].getKeyId().toHex(), '72AF0CC22C4CF320'.toLowerCase())
})

test('should multiple keys from text', async t => {
  const key = fs.readFileSync('./test/unit/resources/KEYS', 'utf-8')
  const pks = await keys.parse(key)
  t.is(pks.length, 3)
  t.is(pks[0].getKeyId().toHex(), '72AF0CC22C4CF320'.toLowerCase())
  t.is(pks[1].getKeyId().toHex(), '22907064147F886E'.toLowerCase())
  t.is(pks[2].getKeyId().toHex(), '44667BC927C86D51'.toLowerCase())
})

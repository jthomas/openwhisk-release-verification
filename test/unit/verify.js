import test from 'ava'
import verify from '../../lib/verify.js'
import fs from 'fs'

test('should validate sha512 hash against archive', async t => {
  const archive = fs.createReadStream('./test/unit/resources/release.tar.gz')
  const hash = fs.readFileSync('./test/unit/resources/release.tar.gz.sha512', 'utf-8')
  const result = await verify.hash(archive, hash)
  t.true(result.valid)
});

test('should validate PGP signature against archive', async t => {
  const archive = fs.createReadStream('./test/unit/resources/release.tar.gz')
  const signature = fs.readFileSync('./test/unit/resources/release.tar.gz.asc', 'utf-8')
  const keys = fs.readFileSync('./test/unit/resources/KEYS', 'utf-8')
  const result = await verify.signature(archive, signature, keys)
  t.true(result.valid)
});

test('should extract relevant files from archive', async t => {
  const archive = fs.createReadStream('./test/unit/resources/release.tar.gz')
  const result = await verify.archive_files(archive)
  const files = {
    'DISCLAIMER.txt': true, 'NOTICE.txt': true, 'LICENSE.txt': true
  }
  t.deepEqual(result, files)
});

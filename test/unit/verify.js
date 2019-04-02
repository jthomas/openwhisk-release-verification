import test from 'ava'
import verify from '../../lib/verify.js'
import fs from 'fs'

console.log = () => {}

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

test('should check LICENSE matches template', async t => {
  const valid_license = fs.readFileSync('./test/unit/resources/LICENSE-valid.txt', 'utf-8')
  t.true(verify.license('', valid_license))

  const invalid_license = fs.readFileSync('./test/unit/resources/LICENSE-invalid.txt', 'utf-8')
  t.false(verify.license('', invalid_license))
});

test('should check NOTICE matches template with project name', async t => {
  const valid_notice = fs.readFileSync('./test/unit/resources/NOTICE-valid.txt', 'utf-8')
  t.true(verify.notice('', valid_notice, 'Project Name'))
  t.false(verify.notice('', valid_notice, 'Different Name'))

  const invalid_notice = fs.readFileSync('./test/unit/resources/NOTICE-invalid.txt', 'utf-8')
  t.false(verify.notice('', invalid_notice, 'Project Name'))
});

test('should check DISCLAIMER matches template with project name', async t => {
  const valid_disclaimer = fs.readFileSync('./test/unit/resources/DISCLAIMER-valid.txt', 'utf-8')
  t.true(verify.disclaimer('', valid_disclaimer, 'Project Name'))
  t.false(verify.disclaimer('', valid_disclaimer, 'Different Name'))

  const invalid_disclaimer = fs.readFileSync('./test/unit/resources/DISCLAIMER-invalid.txt', 'utf-8')
  t.false(verify.disclaimer('',invalid_disclaimer, 'Project Name'))
});

test('should extract relevant files from archive', async t => {
  const archive = fs.createReadStream('./test/unit/resources/release.tar.gz')
  const result = await verify.archive_files(archive, 'Client Go', '')
  const files = {
    'DISCLAIMER.txt': true, 'NOTICE.txt': true, 'LICENSE.txt': true
  }
  t.deepEqual(result, files)
});

test('should return excluded file paths from archive', async t => {
  const archive = fs.createReadStream('./test/unit/resources/archive.tar.gz')
  const result = await verify.excluded_files(archive)
  t.deepEqual(result, [], 'archive should have no excluded files')

  const bin_archive = fs.createReadStream('./test/unit/resources/archive-binary.tar.gz')
  const bin_result = await verify.excluded_files(bin_archive)
  const expected = ['archive/hello.py', 'archive/hello.tar', 'archive/node_modules/', 'archive/hello.sh', 'archive/.gradle/']
  t.deepEqual(bin_result, expected, 'archive should have excluded files')
});

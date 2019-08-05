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
  t.true(verify.license(null, '', valid_license))

  const invalid_license = fs.readFileSync('./test/unit/resources/LICENSE-invalid.txt', 'utf-8')
  t.false(verify.license(null, '', invalid_license))
});

test('should check NOTICE matches template with project name', async t => {
  const valid_notice = fs.readFileSync('./test/unit/resources/NOTICE-valid.txt', 'utf-8')
  t.true(verify.notice(null, '', valid_notice, 'Project Name'))
  t.false(verify.notice(null, '', valid_notice, 'Different Name'))

  const invalid_notice = fs.readFileSync('./test/unit/resources/NOTICE-invalid.txt', 'utf-8')
  t.false(verify.notice(null, '', invalid_notice, 'Project Name'))
});

test('should check DISCLAIMER does not exist', async t => {
  t.plan(2)
  try {
    fs.readFileSync('./test/unit/resources/MISSING-FILE.txt', 'utf-8')
  } catch (err) {
    t.true(verify.disclaimer(err, '', null, 'Project Name'))
  }

  const disclaimer = fs.readFileSync('./test/unit/resources/DISCLAIMER-valid.txt', 'utf-8')
  t.false(verify.disclaimer(null, '', disclaimer, 'Different Name'))
});

test('should check README does not contain incubation disclaimer', async t => {
  const valid_readme = fs.readFileSync('./test/unit/resources/README-valid.md', 'utf-8')
  t.true(verify.readme(null, '', valid_readme, 'Project Name'))

  const invalid_readme = fs.readFileSync('./test/unit/resources/README-invalid.md', 'utf-8')
  t.false(verify.readme(null, '', invalid_readme, 'Project Name'))
});

test('should check relevant files in archive', async t => {
  const archive = fs.createReadStream('./test/unit/resources/release.tar.gz')
  const result = await verify.archive_files(archive, 'Client Go', 'openwhisk-client-go-0.10.0-source.tar.gz')
  const files = {
    'DISCLAIMER.txt': true, 'NOTICE.txt': true, 'LICENSE.txt': true, 'README.md': true
  }
  t.deepEqual(result, { files, binary_paths: [], third_party_libs: [] })
});

test('should check relevant files in invalid archive', async t => {
  const archive = fs.createReadStream('./test/unit/resources/release-invalid.tar.gz')
  const result = await verify.archive_files(archive, 'Client Go', 'openwhisk-client-go-0.10.0-source.tar.gz')
  const files = {
    'DISCLAIMER.txt': false, 'NOTICE.txt': false, 'LICENSE.txt': false, 'README.md': false
  }
  const binary_paths = ['archive-binary.tar.gz', 'Main.jar']
  const third_party_libs = ['node_modules']
  t.deepEqual(result.files, files)
  t.deepEqual(result.third_party_libs, third_party_libs)
  t.deepEqual(result.binary_paths.sort(), binary_paths.sort())
})

import test from 'ava'
import diff from '../../lib/diff.js'
import fs from 'fs'

test('should return null when diffing same license text', async t => {
  const source = fs.readFileSync('./test/unit/resources/LICENSE-valid.txt', 'utf-8')

  const patch = diff.license(source)
  t.is(patch, null)
})

test('should return null when diffing same license text with suffix', async t => {
  const source = fs.readFileSync('./test/unit/resources/LICENSE-valid-suffix.txt', 'utf-8')

  const patch = diff.license(source)
  t.is(patch, null)
})

test('should return patch when diffing license with incorrect footer', async t => {
  const source = fs.readFileSync('./test/unit/resources/LICENSE-invalid-footer.txt', 'utf-8')

  const patch = diff.license(source)
  t.truthy(patch)
  t.true(patch.includes('+   Copyright 2019 Some User'))
  t.true(patch.includes('-   Copyright [yyyy] [name of copyright owner]'))
})

test('should return patch when diffing incorrect license', async t => {
  const source = fs.readFileSync('./test/unit/resources/LICENSE-invalid.txt', 'utf-8')

  const patch = diff.license(source)
  t.truthy(patch)
  t.true(patch.includes('+   Copyright 2019 Some Person'))
  t.true(patch.includes('-   APPENDIX: How to apply the Apache License to your work.'))
})

test('should return null when diffing same NOTICE', async t => {
  const source = fs.readFileSync('./test/unit/resources/NOTICE-valid.txt', 'utf-8')

  const patch = diff.notice(source, 'project', 'Project Name')
  t.is(patch, null)
})

test('should return patch when diffing NOTICE with incorrect name', async t => {
  const source = fs.readFileSync('./test/unit/resources/NOTICE-valid.txt', 'utf-8')

  const patch = diff.notice(source, 'project', 'Different Name')
  t.truthy(patch)
  t.true(patch.includes('+Apache OpenWhisk Project Name'))
  t.true(patch.includes('-Apache OpenWhisk Different Name'))
})

test('should return null when diffing same DISCLAIMER', async t => {
  const source = fs.readFileSync('./test/unit/resources/DISCLAIMER-valid.txt', 'utf-8')

  const patch = diff.disclaimer(source, 'project', 'Project Name')
  t.is(patch, null)
})

test('should return patch when diffing DISCLAIMER with incorrect name', async t => {
  const source = fs.readFileSync('./test/unit/resources/DISCLAIMER-valid.txt', 'utf-8')

  const patch = diff.notice(source, 'project', 'Different Name')
  t.truthy(patch)
  t.true(patch.includes('+Apache OpenWhisk Project Name'))
  t.true(patch.includes('-Apache OpenWhisk Different Name'))
})



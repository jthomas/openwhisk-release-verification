import test from 'ava'
import archive from '../../lib/archive.js'
import fs from 'fs'

test('should extract archive contents into tmp directory', async t => {
  const stream = fs.createReadStream('./test/unit/resources/archive.tar.gz')
  const path = await archive.extract(stream)
  const files = fs.readdirSync(`${path}/archive`)
  const expected = ['a', 'b', 'c', 'd', 'e']
  t.deepEqual(files, expected)
})

test('should find 3rd party lib directories from extracted archive path', async t => {
  const path = 'test/unit/resources/binary_archive'
  const result = await archive.third_party_libs(path)

  const lib_dirs = ['.gradle', 'node_modules']
  t.deepEqual(result, lib_dirs)
})

test('should find binary files from extracted archive path', async t => {
  const path = 'test/unit/resources/binary_archive'
  const result = await archive.binary_files(path)

  const binary_files = ['archive.tar', 'archive.tar.gz', 'archive.tgz', 'keys.zip', 'main.jar']
  t.deepEqual(result.sort(), binary_files.sort())
})

test('should run each file validator and return result', async t => {
  t.plan(7)
  const path = './test/unit/resources/'

  const validators = {
    'LICENSE-valid.txt': (file, contents, project) => {
      t.is(file, 'project-archive.tar.gz')
      t.is(contents, fs.readFileSync(`${path}LICENSE-valid.txt`, 'utf-8'))
      t.is(project, 'project-id')
      return true
    },
    'DISCLAIMER-valid.txt': (file, contents, project) => {
      t.is(file, 'project-archive.tar.gz')
      t.is(contents, fs.readFileSync(`${path}DISCLAIMER-valid.txt`, 'utf-8'))
      t.is(project, 'project-id')
      return false
    },
  }
  const result = archive.file_validators(path, validators, 'project-id', 'project-archive.tar.gz')
  t.deepEqual(result, {'LICENSE-valid.txt': true, 'DISCLAIMER-valid.txt': false})
})

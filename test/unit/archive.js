import test from 'ava'
import archive from '../../lib/archive.js'
import fs from 'fs'

test('should extract file contents from archive', async t => {
  const stream = fs.createReadStream('./test/unit/resources/archive.tar.gz')
  const expected = {
    'a': 'some file a\n',
    'b': 'some file b\n',
    'c': 'some file c\n',
  }
  const result = await archive.files(stream, Object.keys(expected))
  t.deepEqual(result, expected)
});

test('should return file paths with matching filename suffix', async t => {
  const stream = fs.createReadStream('./test/unit/resources/archive-binary.tar.gz')
  const matching = path => !!path.match(/\.py$|\.tar$/)
  const result = await archive.paths(stream, matching)
  const expected = ['archive/hello.py', 'archive/hello.tar']
  t.deepEqual(result, expected)
});

test('should match excluded file paths', async t => {
  const file_paths = ['some_dir/hello.py', 'some_dir/script.sh', 'some_dir/index.php',
    'some_dir/gradlew', 'some_dir/gradlew.bat']

  file_paths.forEach(path => {
    t.true(archive.excluded(path), path)
  })

  const archive_paths = ['some_dir/app.zip', 'some_dir/app.tar', 'some_dir/app.tar.gz',
    'some_dir/app.tgz', 'some_dir/app.jar']

  archive_paths.forEach(path => {
    t.true(archive.excluded(path), path)
  })

  const dir_paths = ['some_dir/node_modules/', 'some_dir/.gradle/' ]

  dir_paths.forEach(path => {
    t.true(archive.excluded(path), path)
  })
});

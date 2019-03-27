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
  const contents = await archive.files(stream, Object.keys(expected))
  t.deepEqual(contents, expected)
});

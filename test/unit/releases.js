import test from 'ava'
import releases from '../../lib/releases.js'
import fs from 'fs'


test('should parse release versions from html page', async t => {
  const html = fs.readFileSync('./test/unit/resources/versions.html', 'utf-8')
  const project = 'openwhisk'
  const expected =  [
    'apache-openwhisk-0.10.0-incubating-rc1', 'apache-openwhisk-0.9.0-incubating-rc1',
    'apache-openwhisk-0.9.0-incubating-rc2', 'apache-openwhisk-0.9.8-incubating-rc1',
    'apache-openwhisk-1.12.0-incubating-rc1', 'apache-openwhisk-2.0.0-incubating-rc1',
    'apache-openwhisk-2.0.0-incubating-rc2', 'apache-openwhisk-3.19.0-incubating-rc1'
  ]

  t.plan(2)

  const fetch = url => {
    t.is(url, `https://dist.apache.org/repos/dist/dev/incubator/${project}/`)
    return Promise.resolve(html)
  }

  const versions = await releases.versions(project, fetch)
  t.deepEqual(versions, expected)
});

test('should parse release version files from html page', async t => {
  const html = fs.readFileSync('./test/unit/resources/version.html', 'utf-8')
  const project = 'openwhisk'
  const version = 'apache-openwhisk-1.12.0-incubating-rc1'
  const expected = [
    'openwhisk-runtime-docker-1.12.0-incubating-sources.tar.gz', 'openwhisk-runtime-java-1.12.0-incubating-sources.tar.gz',
    'openwhisk-runtime-nodejs-1.12.0-incubating-sources.tar.gz', 'openwhisk-runtime-php-1.12.0-incubating-sources.tar.gz',
    'openwhisk-runtime-python-1.12.0-incubating-sources.tar.gz', 'openwhisk-runtime-swift-1.12.0-incubating-sources.tar.gz'
  ]

  t.plan(2)

  const fetch = url => {
    t.is(url, `https://dist.apache.org/repos/dist/dev/incubator/${project}/${version}`)
    return Promise.resolve(html)
  }

  const files = await releases.files(project, version, fetch)
  t.deepEqual(files, expected)
});

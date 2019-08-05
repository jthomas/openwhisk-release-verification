import test from 'ava'
import releases from '../../lib/releases.js'
import fs from 'fs'

test('should parse project id from project file name', t => {
  let id = releases.project_file('openwhisk-something-0.0.0-sources.tar.gz')
  t.is(id, 'Something')

  id = releases.project_file('openwhisk-multi-word-project-1.2.3-sources.tar.gz')
  t.is(id, 'Multi Word Project')

  // deal with all the corner cases in naming!
  id = releases.project_file('openwhisk-0.9.0-sources.tar.gz')
  t.is(id, '')

  id = releases.project_file('openwhisk-apigateway-0.9.0-sources.tar.gz')
  t.is(id, 'API Gateway')

  id = releases.project_file('openwhisk-cli-0.9.0-sources.tar.gz')
  t.is(id, 'Command-line Interface (CLI)')

  id = releases.project_file('openwhisk-runtime-php-1.13.0-sources.tar.gz')
  t.is(id, 'Runtime PHP')
})

test('should parse release versions from html page', async t => {
  const html = fs.readFileSync('./test/unit/resources/versions.html', 'utf-8')
  const project = 'openwhisk'
  const expected =  [
    'apache-openwhisk-0.10.0-rc1', 'apache-openwhisk-0.9.0-rc1',
    'apache-openwhisk-0.9.0-rc2', 'apache-openwhisk-0.9.8-rc1',
    'apache-openwhisk-1.12.0-rc1', 'apache-openwhisk-2.0.0-rc1',
    'apache-openwhisk-2.0.0-rc2', 'apache-openwhisk-3.19.0-rc1'
  ]

  t.plan(2)

  const fetch = url => {
    t.is(url, `https://dist.apache.org/repos/dist/dev/${project}/`)
    return Promise.resolve(html)
  }

  const versions = await releases.versions(project, fetch)
  t.deepEqual(versions, expected)
});

test('should parse release version files from html page', async t => {
  const html = fs.readFileSync('./test/unit/resources/version.html', 'utf-8')
  const project = 'openwhisk'
  const version = 'apache-openwhisk-1.12.0-rc1'
  const expected = [
    'openwhisk-runtime-docker-1.12.0-sources.tar.gz', 'openwhisk-runtime-java-1.12.0-sources.tar.gz',
    'openwhisk-runtime-nodejs-1.12.0-sources.tar.gz', 'openwhisk-runtime-php-1.12.0-sources.tar.gz',
    'openwhisk-runtime-python-1.12.0-sources.tar.gz', 'openwhisk-runtime-swift-1.12.0-sources.tar.gz'
  ]

  t.plan(2)

  const fetch = url => {
    t.is(url, `https://dist.apache.org/repos/dist/dev/${project}/${version}`)
    return Promise.resolve(html)
  }

  const files = await releases.files(project, version, fetch)
  t.deepEqual(files, expected)
});

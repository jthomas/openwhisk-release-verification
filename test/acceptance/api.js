import test from 'ava'
import fetch from 'node-fetch'
import releases from '../../lib/releases.js'

if (!process.env.HOST) throw new Error('HOST environment variable is not defined')
const API_HOST = process.env['HOST']

const state = {}

test.serial('should return list of release candidates', async t => {
  const versions_api = `https://${API_HOST}/api/versions`
  t.log('running api testing against', versions_api)
  const resp = await fetch(versions_api)
  const result = await resp.json()

  state.versions = await releases.versions('openwhisk')
  t.deepEqual(result, { versions: state.versions })
})

test.serial('should return 404 for file list when release candidate is invalid', async t => {
  const version = 'unknown'
  const files_api = `https://${API_HOST}/api/versions/${version}`
  t.log('running api testing against', files_api)
  const resp = await fetch(files_api)
  t.is(resp.status, 404)
  const result = await resp.json()
  t.deepEqual(result.error, 'release file at https://dist.apache.org/repos/dist/dev/incubator/openwhisk/unknown unavailable, status code: 404')
})

test.serial('should return 404 for validation when release candidate is invalid', async t => {
  const version = 'unknown'
  const files_api = `https://${API_HOST}/api/versions/${version}/validate`
  t.log('running api testing against', files_api)
  const resp = await fetch(files_api)
  t.is(resp.status, 404)
  const result = await resp.json()
  t.deepEqual(result.error, 'release file at https://dist.apache.org/repos/dist/dev/incubator/openwhisk/unknown unavailable, status code: 404')
})

test.serial('should return file list of each release candidate', async t => {
  const reqs = state.versions.map(async version => {
    const files_api = `https://${API_HOST}/api/versions/${version}`
    t.log('running api testing against', files_api)
    const resp = await fetch(files_api)
    if (!resp.ok) throw new Error(`Non-200 HTTP response returned @ ${files_api}: ${resp.status}`)
    const result = await resp.json()
    state[version] = await releases.files('openwhisk', version)
    t.deepEqual(result.files, state[version] )
  })

  await Promise.all(reqs)
})

test.serial('should validate each release file for release candidate', async t => {
  const reqs = state.versions.map(async version => {
    const validate_api = `https://${API_HOST}/api/versions/${version}/validate`
    t.log('running api testing against', validate_api)

    const resp = await fetch(validate_api)
    if (!resp.ok) throw new Error(`Non-200 HTTP response returned @ ${validate_api}: ${resp.status}`)

    const result = await resp.json()
    state[version] = await releases.files('openwhisk', version)
    const file_names = result.files.map(file => file.name)
    t.deepEqual(file_names, state[version])
  })

  await Promise.all(reqs)
})

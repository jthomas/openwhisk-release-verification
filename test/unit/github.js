import test from 'ava'
import GitHub from '../../lib/github.js'

console.log = () => {}

test('should return null when commit results is empty', async t => {
  t.plan(2)
  const repo = 'org/repo'
  const path = 'dir/path.json'

  const fetch = async url => {
    t.is(url, `https://api.github.com/repos/${repo}/commits?path=${path}`)
    return { json: async () => [] }
  }

  const result = await GitHub(repo, fetch).search_history(path)
  t.is(result, null)
})

// should handle errors
test('should return null when file matches does not find match', async t => {
  const repo = 'org/repo'
  const path = 'dir/path.json'

  let after_commits = false
  let counter = -1
  let matcher = 1

  const commits = [{sha: 0}, {sha: 1}, {sha:2}]
  const contents = [{value: 1}, {value: 2}, {value:3}]
  const last_content = contents[contents.length - 1]

  const fetch = async url => {
    if (!after_commits) {
      return { json: async () => commits }
    } 

    counter++
    return { json: async () => contents[counter]}
  }

  const result = await GitHub(repo, fetch).search_history(path, content => false)
  t.is(result, null)
})
test('should retrieve file at each commit result, run matcher function and return matching contents', async t => {
  const repo = 'org/repo'
  const path = 'dir/path.json'

  t.plan(8)

  let after_commits = false
  let counter = -1
  let matcher = 1

  const commits = [{sha: 0}, {sha: 1}, {sha:2}]
  const contents = [{value: 1}, {value: 2}, {value:3}]
  const last_content = contents[contents.length - 1]

  const fetch = async url => {
    if (!after_commits) {
      t.is(url, `https://api.github.com/repos/${repo}/commits?path=${path}`)
      after_commits = true
      return { json: async () => commits }
    }

    counter++
    t.is(url, `https://raw.githubusercontent.com/${repo}/${counter}/${path}`)
    return { json: async () => contents[counter]}
  }

  const result = await GitHub(repo, fetch).search_history(path, content => {
    t.is(content, contents[counter])
    return content.value === last_content.value
  })
  t.deepEqual(result, last_content)
})

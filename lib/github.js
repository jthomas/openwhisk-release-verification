"use strict";

const node_fetch = require('node-fetch')

const headers = {}
const username = process.env['GITHUB_USER']
const token = process.env['GITHUB_TOKEN']

if (username && token) {
  headers['Authorization'] = 'Basic ' + Buffer.from(username + ":" + token).toString('base64')
}

const config_file_commits_url = 
  (repo, path) => `https://api.github.com/repos/${repo}/commits?path=${path}`

const repo_file_url = (repo, file, hash) => 
  `https://raw.githubusercontent.com/${repo}/${hash}/${file}`

module.exports = (repo, fetch = node_fetch) => {
  const search_history = async (path, matches) => {
    console.log(`searching github repo (${repo}) file history at path: ${path}`)
    const resp = await fetch(config_file_commits_url(repo, path), { headers })
    const result = await resp.json()

    let contents = null

    // need to add error handling here...
    console.log(`number of search results returned: ${result.length}`)
    for(let commit of result) {
      console.log(`retrieving file version at commit: ${commit.sha}`)
      const config_file_url = repo_file_url(repo, path, commit.sha)
      const resp = await fetch(config_file_url)
      try {
        const content = await resp.json()
        if (matches(content)) {
          console.log(`file version at commit: ${commit.sha} <-- MATCHES!`)
          contents = content
          break
        }
      } catch (err) {
        console.log(err)
      }
    }

    return contents
  }

  return { search_history }
}

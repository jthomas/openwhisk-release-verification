"use strict";

const fetch = require('node-fetch')
const cheerio = require('cheerio')
const fs = require('fs')

const incubator_releases_url = project => {
  return `https://dist.apache.org/repos/dist/dev/incubator/${project}/`
}
const keys_url = project => `${incubator_releases_url(project)}KEYS`
const release_files_url = (project, file) => `${incubator_releases_url(project)}${file}`

const keys = project => fetch_text(keys_url(project))

const versions = async (project, fetch = fetch_text) => {
  const html = await fetch(incubator_releases_url(project))
  const $ = cheerio.load(html)

  const links = $("li > a")
    .map((i, el) => $(el).attr('href')).get()
    
  const version_names = links
    .filter(link => link.startsWith(`apache`))
    .map(name => name.replace('/', ''))

  return version_names
}

const files = async (project, version, fetch = fetch_text) => {
  const html = await fetch(release_files_url(project, version))
  const $ = cheerio.load(html)

  const links = $("li > a")
    .map((i, el) => $(el).attr('href')).get()
    
  const version_names = links
    .filter(link => link.endsWith(`tar.gz`))

  return version_names
}

const file_sig = (project, version, file) => {
  const url = release_files_url(project, `${version}/${file}.asc`)
  return fetch_text(url)
}

const file_hash = (project, version, file) => {
  const url = release_files_url(project, `${version}/${file}.sha512`)
  return fetch_text(url)
}

const temp_file = filename => {
  const tmpdir = process.env['TMPDIR']
  return `${tmpdir}${filename}`
}

const fetch_url = async url => {
  const resp = await fetch(url)

  if (!resp.ok) {
    const err = new Error(`release file at ${url} unavailable, status code: ${resp.status}`)
    err.status = resp.status
    throw err
  }

  return resp
}

const fetch_text = async url => {
  const resp = await fetch_url(url)
  const text = await resp.text()
  return text 
}

const download_file = async (project, version, file) => {
  return new Promise(async (resolve, reject) => {
    const url = release_files_url(project, `${version}/${file}`)
    const resp = await fetch_url(url)

    // pipe release file body to local file under TMPDIR directory
    const filename = temp_file(file)
    const dest = fs.createWriteStream(filename)
    const pipe_stream = resp.body.pipe(dest)
      
    pipe_stream.on('finish', () => resolve(filename))
    pipe_stream.on('error', reject)
  })
}

module.exports = { keys, versions, files, file_sig, file_hash, download_file }

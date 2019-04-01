"use strict";

const fs = require('fs')
const JsDiff = require('diff')

const LICENSE_SOURCE = fs.readFileSync('./templates/LICENSE.txt', 'utf-8').trim()
const NOTICE_SOURCE = fs.readFileSync('./templates/NOTICE.txt', 'utf-8').trim()
const DISCLAIMER_SOURCE = fs.readFileSync('./templates/DISCLAIMER.txt', 'utf-8').trim()

const trim = text => {
  const has_extra_text = text.indexOf('=====')
  const contents = (has_extra_text > 0) ? text.slice(0, has_extra_text) : text

  return contents.trim()
}

const compare = (file, source, text, project) => {
  const trimmed = trim(text)

  const diff_result = JsDiff.diffTrimmedLines(source, trimmed)
  const diff_not_empty = (diff_result.find(d => d.added || d.removed))

  const patch = diff_not_empty ? 
    JsDiff.createPatch(file, source, trimmed, 'original', project) : null

  return patch
}

const license = (text, project) => compare('LICENSE.txt', LICENSE_SOURCE, text, project)

const notice = (text, project, name) => {
  const prefix = `Apache OpenWhisk ${name}`
  const source = `${prefix}\n${NOTICE_SOURCE}`

  return compare('NOTICE.txt', source, text, project)
}

const disclaimer = (text, project, name) => {
  const prefix = `Apache OpenWhisk ${name}`
  const source = `${prefix} ${DISCLAIMER_SOURCE}`

  return compare('DISCLAIMER.txt', source, text, project)
}

module.exports = { license, notice, disclaimer }

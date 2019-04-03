"use strict";

const fs = require('fs')
const path = require('path')
const stream = require('stream');
const util = require('util');
const tar = require('tar')
const isBinaryFile = require("isbinaryfile").isBinaryFile;
const recursive = require("recursive-readdir");
const listdirs = require('listdirs')
const tmp = require('tmp')

const extract = async archive_stream => {
  return new Promise((resolve, reject) => {
    tmp.dir((err, path, cleanupCallback) => {
      if (err) return reject(err);

      const options = { cwd: path }
      const tar_stream = archive_stream.pipe(tar.x(options))

      tar_stream.on('end', () => resolve(path))
      tar_stream.on('error', err => reject(err))
    })
  })
}

const file_validators = (dir, validators, project_id, file) => {
  const file_names = Object.keys(validators)

  const results = file_names.reduce((result, name) => {
    const file_path = path.format({ dir, base: name})
    const contents = fs.readFileSync(file_path, 'utf-8')
    result[name] = validators[name](file, contents, project_id)
    return result
  }, {})

  return results
}

const binary_files = async path => {
  const binary_files = []
  return new Promise((resolve, reject) => {
    recursive(path, async function (err, files) {
      const results = files.map(async file => {
        const result = await isBinaryFile(file)
        if (result) {
          binary_files.push(file.slice(path.length + 1))
        }
      })
      await Promise.all(results)
      resolve(binary_files)
    });
  })
}

const third_party_libs = async path => {
  return new Promise((resolve, reject) => {
    const LIB_DIRS = /node_modules$|\.gradle$/

    listdirs(path, (err, list) => {
      if (err) return reject(err)

      const lib_dirs = list
        .filter(dir => dir.match(LIB_DIRS))
        .map(dir => dir.slice(path.length + 1))
      resolve(lib_dirs)
    }, [])
  })
}

module.exports = { extract, file_validators, binary_files, third_party_libs }

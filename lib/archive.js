"use strict";

const stream = require('stream');
const util = require('util');
const tar = require('tar')

// need to extract readable stream into a buffer
// from https://github.com/npm/node-tar/issues/181#issuecomment-390812117
function CollectStream() {
  stream.Transform.call(this);
  this._chunks = [];
  this._transform = (chunk, enc, cb) => { this._chunks.push(chunk); cb(); }
  this.collect = () => { return Buffer.concat(this._chunks); this._chunks = []; }
}

util.inherits(CollectStream, stream.Transform);

const filter_name = filenames => {
  return path => {
    const subpaths = path.split('/')

    // only looking for top-level files e.g. dir/file.txt
    if (subpaths.length !== 2) {
      return false
    }

    const [dir, file] = subpaths
    return filenames.includes(file)
  }
}

const transform = map => {
  return entry => {
    let cs = new CollectStream()
    const [dir, filename] = entry.path.split('/')
    map.set(filename, cs)
    return cs
  }
}

const streamToBuffer = cs => {
  if (!cs._chunks.length) {
    return null
  }
  return cs.collect().toString('utf8')
} 

// extract file contents into memory from a tar stream
const files = (archive_stream, file_names) => {
  return new Promise((resolve, reject) => {
    const streams = new Map()

    const options = {
      cwd: process.env['TMPDIR'],
      filter: filter_name(file_names),
      transform: transform(streams)
    }

    const tar_stream = archive_stream.pipe(tar.x(options))

    // convert each file stream into a buffer
    // and resolve promise with all file contents
    const collect_streams = () => {
      const files_contents = {}
      for (let [filename, stream] of streams) {
        files_contents[filename] = streamToBuffer(stream)
      }
      resolve(files_contents)
    }
     
    tar_stream.on('end', collect_streams)
    tar_stream.on('error', reject)
  })
}

module.exports = { files }

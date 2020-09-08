#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const { createServer } = require('http')
const { spawn } = require('child_process')

const port = 8080

;(() => {
  try {
    const [, , srcpath, outpath] = process.argv

    console.log(process.argv)

    if (srcpath === undefined) {
      throw new Error('Path to KML not supplied.')
    }

    const kmlpath = path.resolve(process.cwd(), srcpath)

    if (!fs.existsSync(kmlpath)) {
      throw new Error('Path to KML does not exists.')
    }

    console.log(`Local server starting with KML ${kmlpath}`)

    const server = createServer((_, response) => {
      response.setHeader('Access-Control-Allow-Origin', '*')
      response.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
      )
      response.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml')

      response.statusCode = 200

      const kml = fs.readFileSync(kmlpath, 'utf8') // serve supplied KML
      response.write(kml)

      return response.end()
    })

    server.listen(port, (err) => {
      if (err) {
        throw new Error(`Error starting server on ${port}`, err)
      }

      console.log(`Local server started on port ${port}`)
    })

    console.log('Ngrok tunnel starting')

    const tunnel = (url) => {
      const kml = `<?xml version="1.0" encoding="UTF-8" ?>
    <kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">
        <NetworkLink>
            <name>Tunn Tunn</name>
            <visibility>1</visibility>
            <open>1</open>
            <refreshVisibility>1</refreshVisibility>
            <flyToView>1</flyToView>
            <Link>
                <href>${url}</href>
                <refreshMode>onInterval</refreshMode>
                <refreshInterval>5</refreshInterval>
            </Link>
        </NetworkLink>
    </kml>`

      let distpath = outpath === undefined ? '' : outpath
      let tunnelname = ''

      if (path.extname(distpath) == '') {
        tunnelname = 'tunnel.kml'
      }

      const tunnelpath = path.resolve(process.cwd(), distpath, tunnelname)

      fs.writeFile(tunnelpath, kml, (err) => {
        if (err) {
          throw new Error(`Error writting tunnel file`)
        }

        console.log(`Generated ${tunnelpath}`)
      })
    }

    const ngrok = spawn('ngrok', [
      // spawn ngrok instance with json logging
      'http',
      port,
      '--log',
      'stdout',
      '--log-format',
      'json',
    ])

    ngrok.stdout.on('data', (data) => {
      const messages = data.toString('utf8').split('\n') // ngrok logs to stdout in JSON format so we split up the individual messages

      messages
        .filter((message) => message.length > 1) // filter empty line breaks
        .forEach((message) => {
          const log = JSON.parse(message)
          if (log.name == 'command_line') {
            // iterate over ngrok logs until tunnel url is logged
            console.log(`Ngrok tunnel started with url ${log.url}`)
            tunnel(log.url)
          }
        })
    })

    ngrok.on('error', (error) => {
      throw new Error(`error: ${error.message}`)
    })

    ngrok.on('close', (code) => {
      throw new Error(`child process exited with code ${code}`)
    })

    process.on('uncaughtException', () => {
      ngrok.kill()
      process.exit(1)
    })
  } catch (error) {
    console.error(`${error}`)
    process.exit(1)
  }
})()

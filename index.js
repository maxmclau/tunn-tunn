'use strict'

const fs = require('fs')
const http = require('http')
const port = 8080

let stdin = ''  // store string piped in from jq
let tunnel = '' // ngrok tunnel URL

process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => {
    stdin += chunk
})

process.stdin.on('end', () => {
    try {
        tunnel = new URL(stdin);
        tunnel.protocol = 'https:'
    } catch (_) {
        console.log('Ngrok url parsing error. Check that tunnel is running.')
        process.exit()
    }

    const kml =
    `<?xml version="1.0" encoding="UTF-8" ?>
    <kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">
        <NetworkLink>
            <name>Sandbox</name>
            <visibility>1</visibility>
            <open>1</open>
            <refreshVisibility>1</refreshVisibility>
            <flyToView>1</flyToView>
            <Link>
                <href>${tunnel.href}</href>
                <refreshMode>onInterval</refreshMode>
                <refreshInterval>5</refreshInterval>
            </Link>
        </NetworkLink>
    </kml>`

    fs.writeFile('tunnel.kml', kml, (err) => {
        if (err) {
            console.log('Error writing tunnel file')
            process.exit()
        }

        console.log(`Generated tunnel.kml with network link ${tunnel.href}`)
    })
})

const requestHandler = (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    response.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml')

    response.statusCode = 200
    response.write(`<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2"><Placemark><visibility>1</visibility><open>1</open><name>Simple placemark</name><description>Attached. Intelligently places itself at the height of the terrain.</description><Point><coordinates>-122.0922035425683,37.42228990140251,0</coordinates></Point></Placemark></kml>`)
    return response.end()
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
    if (err) {
        return console.log(`Error starting server on ${port}`, err)
    }

    console.log(`Server listening on ${port}`)
})
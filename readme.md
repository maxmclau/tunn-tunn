# KML Sandbox

Sandbox environment for playing with KMLs in Google Earth

*Not recommended for use outside of Urban Sky yet. This package is highly subject to change and very early stage.*

## Install

```
$ npm install
```

You must also install and configure [ngrok](https://ngrok.com/) before use.

## Tunneling

```
$ npm run tunnel
```

Google Earth Web is a little specific with how it like to take in Network Linked kmls. To get around this we use [ngrok](https://ngrok.com/) to tunnel traffic between our local http server a random url they provide on startup. This means you must first run ```npm tunnel``` in a seperate terminal before moving to the next step.

## Usage

```
$ npm start
```

This is will startup a web server locally and generate a **tunnel.kml**, the file you import into Google Earth to display the current contents of index.kml. Changes made to index.kml will be displayed on every *refreshInterval* (defaulting to 5 seconds).
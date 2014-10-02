var url = require('url')
var http = require('http')
var qs = require('querystring')
var fs = require('graceful-fs')
var path = require('path')

var ms = function ms(ms, limit) { //split into different module
	var times = [
		{ms: 86400000, name: 'day'},
		{ms: 3600000, name: 'hour'},
		{ms: 60000, name: 'minute'},
		{ms: 1000, name: 'second'},
		{ms: 1, name: 'millisecond'}
	]
	function stringize(ms, time, mod) {
		if (ms < time.ms) { return [] }
		var result = [
			Math.floor(ms / time.ms),
			Math.floor((ms % mod) / time.ms)
		]
		return [ '' + result[0] + ' ' + time.name + ((result[0] !== 1)? 's' : ''),
			'' + result[1] + ' ' + time.name + ((result[1] !== 1)? 's' : '')
		]
	}
	if (typeof limit === 'undefined')
		limit = 2

	return times.map(function (time, ind) {
		var mod = times[ind>0? ind-1 : 0].ms
		return stringize(ms, time, mod)
	}).reduce(function (memo, curr) {
		if ((!limit || memo.length < limit) && curr.length) {
			memo.push( curr[(memo.length === 0)? 0 : 1] )
		}
		return memo
	}, []).join(', ')
}

function getOn(link, endCb) {
	http.get(link, function (res) {
		var combined = ''
		res.on('data', function data(chunk) {
			combined += chunk.toString()
		}).on('end', function () {
			endCb(combined) //do not bind 'combined', or it will bind an empty string
		}).on('error', function (err) {
			throw err
		})
	}).on('error', function (err) {
		throw err
	})
}

function linkify(str) {
	var start = str.indexOf('http')
	var end = str.indexOf('"', start)
	return str.slice(start, end)
}

function endOfLink(str) {
	return str.split('/').pop()
}

function getLinks(data) {
	var findUrlRe = /(?:"smil_url"\s*:\s*"(http[^"]+)")/g
	return data
		.toString()
		.split(',')
		.filter(findUrlRe.test.bind(findUrlRe))
		.map(linkify)
		.map(function (s) {return s.replace('.smil', '')})
}

function getCorrectLink(vidLink, links) {
	return links.reduce(function (memo, curr) {
		if (memo.length === 0 || endOfLink(curr) === vidLink) {
			return curr //if not found a link yet, OR found real one now
		}
		return memo
	}, '')
}

function createFilename(specs) {
	return (
		(specs.caption? specs.caption.replace(/( |\.)/g, '') + '-' : '') + //caption w/o spaces and periods
		(specs.broadcast_id? specs.broadcast_id + '-' : '') + //id
		new Date().getTime() + //time
		'.mp4' //ext
	)
}

function logInfo(filename, specs) {
	console.log('Name:', specs.caption)
	console.log('Saving as:', filename)
	if (specs.asset && specs.asset.qualities) {
		var qual = specs.asset.qualities
		if (qual.bitrate && specs.duration) {
			console.log('Size:', (qual.bitrate * specs.duration / (1000 * 8000)), 'megabytes')
		} else {
			console.log('Unknown size')
		}
		if (qual.width && qual.height) {
			console.log('Resolution:', qual.width, 'x', qual.height)
		} else {
			console.log('Unknown resolution')
		}
	}
	if (specs.duration) {
		console.log('Length:', ms(specs.duration, 3))
	} else {
		console.log('Unknown length')
	}
}

function logPercent(sizeWas, sizeIs, onePercent) {
	var lastPct = Math.floor(sizeWas/onePercent)
	var nowPct = Math.floor(sizeIs/onePercent)
	if (nowPct > lastPct) {
		console.log('' + nowPct + '%')
	}
}

(function main() {
	var vid = process.argv[2] //looks like "http://new.livestream.com/vrctv6/2014-vrwc-arts-hs/videos/49012052"

	getOn(vid, function end(pageText) {
		var links = getLinks(pageText)
		var vidLinkEnd = endOfLink(vid) //split with '/', get last element
		var jsonLink = getCorrectLink(vidLinkEnd, links)
		getOn(jsonLink, function (pageText) {
			var specs = JSON.parse(pageText)
			var filename = createFilename(specs)
			var actualSizePct = parseInt(specs.asset.qualities.bitrate) * parseInt(specs.duration) / 100
			var downloadSize = 0

			logInfo(filename, specs)

			http.get(specs.progressive_url, function (res) {
				res.on('data', function data(chunk) {
					var lastDownloadSize = downloadSize
					downloadSize += chunk.length
					logPercent(lastDownloadSize, downloadSize, actualSizePct)
					fs.appendFile(filename, chunk, function (err) {
						if (err) throw err
					})
				}).on('end', function () {
					console.log('Downloaded:', downloadSize)
					console.log('Finished!')
				}).on('error', function (err) {
					throw err
				})
			})
		})
	})
})()


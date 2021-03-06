const http = require('http');
const fs = require('fs');
const url = require('url');

const channel = require('./channel');

http.createServer(function(from, out){
	const urlParsed = url.parse(from.url);
	out.setHeader('Content-Type', 'application/json');

	switch (urlParsed.pathname) {
		
		case '/':
			out.setHeader('Content-Type', 'text/html');
			render('index.html', out);
			break;
		case '/channel-client.js':
			out.setHeader('Content-Type', 'application/javascript');
			render('channel-client.js', out);
			break;

		case '/channel':
			channel.subscribe(out);
			break;

		case '/post':
			var answer = '';

			from
				.on('readable', function(){
					var msg = from.read();
					answer += msg || '';
				})
				.on('end', function(){
					answer = JSON.parse(answer);
					channel.post(answer.message);

					out.end('{ "status": "published" }');
					answer = null;
				});
			break;

		default:
			out.statusCode = 404;
			out.end('{ "status": "Not Found" }');
	}
}).listen(3000);

function render(fileName, out) {
	var fileStream = fs.createReadStream(fileName);
	fileStream
		.on('error', function() {
			out.statusCode = 500;
			out.end('{ "status": "Server error" }');
		})
		.pipe(out)
		.on('close', function() {
			fileStream.destroy();
		});
}
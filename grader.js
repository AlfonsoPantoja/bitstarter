#!/usr/bin/env node


/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2


Modified by: Alfonso Pantoja 2013.07.12

*/

var fs = require('fs');
var url = require('url');
var rest = require('restler');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
//var URL_DEFAULT = "http://nameless-brook-6546.herokuapp.com/";
var URL_DEFAULT = null;

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.error("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertUrlExists = function(inUrl) {
    if (inUrl === null) {
        console.error("URL is missing");
        process.exit(1);
    }
    return inUrl.toString();
};

var getWebPage = function(url, callback){
    rest.get(url).on('complete', function(result) {
	if (result instanceof Error) {
	    console.error('Error: ' + result.message);
	    callback(result, null);
	} else {
	    //console.log('Content has been received from %s', url);
	    callback(null, result);
	}
    });
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var cheerioHtmlContent = function(htmlContent) {
    return cheerio.load(htmlContent);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};



var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    return doChecks(checksfile, $);
};


var checkHtmlContent = function(htmlContent, checksfile) {

    $ = cheerioHtmlContent(htmlContent);
    return doChecks(checksfile, $);  
};

var doChecks = function(checksfile, cheerioSelector) {
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for (var ii in checks) {
       var present = cheerioSelector(checks[ii]).length > 0;
       out[checks[ii]] = present;
    }
    return out;
};


var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};


var checkHtml = function(file, url, checks, callback){

    var checksJson = null;
    var outJson = null;
    if (!url) {
        //console.log('Checking html from file %s...', file);
	   checkJson = checkHtmlFile(file, checks);
	   outJson = JSON.stringify(checkJson, null, 4);
	   return callback(null, outJson);
    }
    else {
       //console.log('Checking html from URL %s ...', url); 
       getWebPage(url, function(error, result) {
    	    if (error) {
                console.error('Error when getting content from URL %s', error.message);
                return callback(error, null);
    	    }
    	    else {
                checkJson = checkHtmlContent(result, checks);
                outJson = JSON.stringify(checkJson, null, 4);
                return callback(null, outJson);
    	    }
    	}); 
    }
}




if(require.main == module) {
    program
        .option('-c, --checks <checks>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	    .option('-u, --url <url>', 'URL to web page (overrides -f option)', clone(assertUrlExists), URL_DEFAULT)
        .parse(process.argv);


    checkHtml(program.file, program.url, program.checks, function(error, output){
        if (error) { console.error(error.message); }
        console.log(output);
    });

    
} else {
    exports.checkHtmlFile = checkHtmlFile;
    exports.checkHtmlContent = checkHtmlContent;
}


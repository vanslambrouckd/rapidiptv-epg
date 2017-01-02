(function () {
    var Item = require('./item');
    var _ = require('./libs/lodash');
    var fs = require('fs');
    var xml2js = require('xml2js');
    var parseString = require('xml2js').parseString;
    var parser = new xml2js.Parser();
    var util = require('util');
    var path = require('path');

    function M3U() {    
        this.items = [];    
        this.properties = {};
    }

    M3U.prototype.add = function item(item) {
        this.items.push(item);
        return this;
    }

    M3U.prototype.getItems = function() {
        return this.items;
    }

    M3U.prototype._loadFromFile = function(filePath, callback) {
        //ASYNC
        // var deferred = new $.Deferred();
        var stream = fs.createReadStream(filePath);
        stream.setEncoding('utf8');
        this.lines = [];
        var self = this;
        
        var items = [];

        stream.on('data', newLineStream( function (message) {
            item = self.parseLine(message);
            if (item) {
                items.push(item);
            }
            self.lines.push(message);
        }));
        // stream.on('data', function(chunk) {
        //      data += chunk;
        // });

        stream.on('end', function() {
            callback(items);
        });
        // return deferred.promise();
    }

    M3U.prototype.link = function(list_holland, list_rapid) {
        
    }

    M3U.prototype.loadFromFile = function(filePath, clientportal_file = false, callback) {
        //https://github.com/maxogden/art-of-node#callbacks
        //ASYNC
        // var deferred = new $.Deferred();

        filePathOrig = filePath;
        filename = path.basename(filePath);
        pathname = path.dirname(filePath);
        filePath = pathname + '/'+filename+'.tmp';
        var fs = require('fs-extra');
        fs.copySync(filePathOrig, filePath);

        // fs.createReadStream(filePathOrig).pipe(fs.createWriteStream(filePath));
        
        fd = fs.openSync(filePath, 'a');
        fs.writeSync(fd, "\r\n");
        fs.closeSync(fd);

        self = this;
        this._loadFromFile(filePath, function(ret) {
            self.items = ret;
            if (clientportal_file) {
                self.lines.forEach(function(line, index) {
                    var str_client = 'http://clientportal.link:8080';
                    if (line.substr(0, str_client.length) == str_client) {
                        
                        prev_line = index-1;
                        item = self.parseLine(self.lines[prev_line]);
                        
                        if (item != null) {
                            match = self._findByTag('name', item.get('name'));
                            if (match) {
                                match.set('clientportal_link', line);
                                // console.log(match);

                                //update collection item
                                index = _.findIndex(self.items, function(o) { return o.get('name') == item.get('name'); });
                                if (index != -1) {
                                    self.items[index] = match;
                                } else {
                                    console.log('item not found');
                                }
                            } else {
                                console.log("name '"+item.get('name')+"' not found");    
                            }
                        } else {
                            console.log('prev item not found');
                        }
                    }
                });
            }
            callback();
        });
    }

    M3U.prototype.loadPerfectPlayerXML = function(filename, callback) {
        fs.readFile(filename, 'utf8', function(err, data) {
            parser.parseString(data, function (err, result) {
                result = jQuery.parseJSON(JSON.stringify(result));
                channels = [];
                result.Settings.ChannelInfo.forEach(function(item, index) {
                    channel = {};
                    channel['tvg-id'] = item.$['tvg-id'];
                    channel['tvg-logo'] = item.$['tvg-logo'];
                    channel['tvg-name'] = item.$['tvg-name'];
                    channel['clientportal_link'] = item.$['line2'];
                    channel['tvg-shift'] = item.$['tvg-shift'];
                    // console.log(channel);
                    channels.push(channel);
                });
                callback(channels);
            });
        });
    }

    M3U.prototype.loadTVGuideJSON = function(filename, callback) {
        //https://www.thepolyglotdeveloper.com/2015/01/parse-xml-response-nodejs/
        fs.readFile(filename, 'utf8', function(err, data) {
            parser.parseString(data, function (err, result) {
                tvguide = jQuery.parseJSON(JSON.stringify(result));
                channels = [];
                tvguide.tv.channel.forEach(function(item) {
                    channel = {};
                    channel['id'] = item.$.id;
                    channel['display-name'] = item['display-name'][0]._;
                    channel['url'] = item.url
                    channels.push(channel);
                });
                callback(channels);
            });
        });
    }

    var propertyMap = [
        'tvg-id',
        'tvg-name',
        'tvg-logo',
        'group-title',
        'clientportal_link',
    ];

    M3U.prototype.set = function(key, value) {
        this.properties[key] = value;
    }

    M3U.prototype._getClientPortalLink = function() {
        self.lines.forEach(function(line, index) {
            var str_client = 'http://clientportal.link:8080';
            if (line.substr(0, str_client.length) == str_client) {
                prev_line = index-1;
                item = self.parseLine(self.lines[prev_line]);
            } 
        });
    }

    M3U.prototype._findIndexByTag = function(tag, value) {
        return _.findIndex(self.getItems(), function(o) {
            if (o.get(tag) != null) {
                if (tag == 'clientportal_link') {
                    return o.get(tag).indexOf(value) != -1;
                }
                return o.get(tag) == value;
            }
            return -1;
        });
    }

    M3U.prototype._findByTag = function(tag, value) {
        return _.find(self.getItems(), function(o) {
            if (o.get(tag) != null) {
                if (tag == 'clientportal_link') {
                    return o.get(tag).indexOf(value) != -1;
                }
                return o.get(tag) == value;
            }
            return false;
        });
    }

    M3U.prototype.parseLine = function(line) {
        const pattern_exif = /(#EXTINF:-1,*)(.*)"/gm;
        if (pattern_exif.test(line)) {
            line = line.replace(/(#EXTINF:-1,*)/gm, '');
            
            const pattern = /(.*?)="(.*?)"/gm;
            tags = [];
            var match;
            while (match = pattern.exec(line)){
              tag = {
                 key: match[1].trim(),
                 value: match[2],
              };
              tags.push(tag);
            }

            //channel name
            const re = /,\s*(.+)/gm
            match = re.exec(line);
            var item = new Item();

            if (match) {
                channel_name = match[1];
                item.set('name', channel_name);
            }
            tags.forEach(function(tag) {
                item.set(tag.key, tag.value);
            });

            return item;
        }
        return null;
    }

    function newLineStream(callback) {
        var buffer = '';
        return (function (chunk) {
            var i = 0, piece = '', offset = 0;
            buffer += chunk;
            while ( (i = buffer.indexOf('\n', offset)) !== -1) {
                piece = buffer.substr(offset, i - offset);
                offset = i + 1;
                callback(piece);
            }
            buffer = buffer.substr(offset);
        });
    }
    module.exports = M3U;
}());
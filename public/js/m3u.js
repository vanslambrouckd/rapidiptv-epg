(function () {
    var Item = require('./item');
    var _ = require('./libs/lodash');

    function M3U() {    
        this.naam = 'david';
        this.test = [];
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

    M3U.prototype._loadFromFile = function(filePath) {
        //ASYNC
        var deferred = new $.Deferred();

        var fs = require('fs');         
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
           deferred.resolve(items);    
        });
        return deferred.promise();
    }

    M3U.prototype.link = function(list_holland, list_rapid) {
        
    }

    M3U.prototype.loadFromFile = function(filePath, clientportal_file = false) {
        //ASYNC
        var deferred = new $.Deferred();

        self = this;
        $.when(this._loadFromFile(filePath)).done(function(ret) {
            self.items = ret;
            if (clientportal_file) {
                self.lines.forEach(function(line, index) {
                    var str_client = 'http://clientportal.link:8080';
                    if (line.substr(0, str_client.length) == str_client) {
                        //console.log(index + 'clientportal regel');
                        prev_line = index-1;
                        item = self.parseLine(self.lines[prev_line]);
                        // console.log(item.get('name'));
                        // console.log(line);
                        if (item != null) {
                            match = self._findByTag('name', item.get('name'));
                            if (match) {
                                match.set('clientportal_link', line);

                                //update collection item
                                index = _.findIndex(self.items, function(o) { return o.get('tvg-id') == 'NPO 3 HD'; });
                                if (index != -1) {
                                    self.items[index] = match;
                                    // console.log(index);
                                    // console.log(match.get('clientportal_link'));
                                }
                            }
                        }
                    } 
                });
            }
            deferred.resolve(self.items);    
            // console.log(self.items.length);
        });        
        return deferred.promise();
    }

    // M3U.prototype._updateArrayObject = function() {
    //     //helper function

    // }

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
                //console.log(index + 'clientportal regel');
                prev_line = index-1;
                item = self.parseLine(self.lines[prev_line]);
                //console.log(item);
                // console.log(item.get('name'));
                // console.log(line);

            } 
        });
    }

    M3U.prototype._findByTag = function(tag, value) {
        return _.find(self.getItems(), function(o) {
            return o.get(tag) == value;
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
            //console.log(item.get('name'));

            return item;
        } else {
            var str_client = 'http://clientportal.link:8080';
            if (line.substr(0, str_client.length) == str_client) {
                //console.log('clientportal regel');
            } else {
                //console.log('ongeldige regel:'+line);    
            }
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

    // function M3UParser(data) {

    // }

    module.exports = M3U;
}());
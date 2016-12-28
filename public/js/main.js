(function() {
    const electron = require('electron')
    ipcRenderer = electron.ipcRenderer;

    var _ = require('./public/js/libs/lodash'); 
    var m3u = require('./public/js/m3u');
    var inspect = require('eyes').inspector({maxLength: false});
    var fs = require('fs');

    lijst_holland = new m3u();
    lijst_rapid = new m3u();

    // $('#btn-load-xml').on('click', function(event) {
    //     event.preventDefault();
    //     event.stopImmediatePropagation();
    //     filename = ($('#xml').val());

    //     filename = './public/output/source.m3u';
    //     loadFile(lijst_rapid, filename, true, function() {
    //         populateChannels(lijst_rapid.getItems());

    //         loadFile(lijst_holland, './public/output/EXTINF.m3u', false, function() {
    //         });
    //     });

    //     ipcRenderer.send('read-source-xml', 'david');
    //     ipcRenderer.send('async', 1);
    //     ipcRenderer.once('read-source-xml-status', function(event, arg) {
    //      console.log('response='+arg);
    //  });
    // });


    $('#btn-load-rapid').on('click', function(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        filename_rapid_m3u = $('#rapidm3u').val();
        filename_perfectplayer_xml = $('#perfectplayer').val();
        updateRapidList(filename_rapid_m3u, filename_perfectplayer_xml, exportRapidList.bind(null, './public/output/output.m3u'))

        $('.js-status').hide();
        $('#warning').show();
    });
    
    

   function exportRapidList(filename) {
        lines = [];
        
        lijst_rapid.getItems().forEach(function(rapiditem, index) {
            // console.log(line);
            item = [];
            item['tvg-id'] = rapiditem.get('tvg-id') !== null?rapiditem.get('tvg-id'):'';
            item['tvg-name'] = rapiditem.get('tvg-name') !== null?rapiditem.get('tvg-name'):'';
            item['tvg-logo'] = rapiditem.get('tvg-logo') !== null?rapiditem.get('tvg-logo'):'';
            item['tvg-shift'] = rapiditem.get('tvg-shift') !== null?rapiditem.get('tvg-shift'):'';
            item['group-title'] = rapiditem.get('group-title') !== null?rapiditem.get('group-title'):'';
            item['name'] = rapiditem.get('name') !== null?rapiditem.get('name'):'';

            line = '#EXTINF:-1 tvg-id="'+item['tvg-id']+'" tvg-name="'+item['tvg-name']+'" tvg-logo="'+item['tvg-logo']+'"';
            if (item['tvg-shift']) {
                line += ' tvg-shift="'+item['tvg-shift']+'"';
            }
            line += ' group-title="'+item['group-title']+'",'+item['name'];
            lines.push(line);
            // output += "\r\n";
            if (rapiditem.get('clientportal_link') !== null) {
                lines.push(rapiditem.get('clientportal_link'));
            }
        });
       
        var file = fs.createWriteStream(filename);
        file.on('error', function(err) { 
            /* error handling */ 
        });
        lines.forEach(function(line) { 
            file.write(line + '\n'); 
        });
        file.end(function() {
            msg = 'Bestand ' + filename + ' geconverteerd';
            $('.js-status').hide();
            $('#success').html(msg).show();
        });
    }

    function updateRapidList(filename_rapid_m3u, filename_perfectplayer_xml, callback) {
        /*
        via perfect player kan je epg aan source list van rapidiptv m3u koppelen
        in perfectplayer kan je dit enkel saven als xml, niet als m3u
        deze functie leest die xml in, en wijzigt de bron m3u die je van rapidiptv kreeg, met de nieuwe data
        configuratie perfect player:
        epgurl = http://epg.kodi-forum.nl/tvguide.xml
        providers playlist = http://clientportal.link:8080/get.php?username=XXXXX&password=XXXXX&type=m3u_plus&output=ts
        */

        loadFile(lijst_rapid, filename_rapid_m3u, true, function() {
            // console.log(lijst_rapid.getItems());
            lijst_holland.loadPerfectPlayerXML(filename_perfectplayer_xml, function(channels) {
                channels.forEach(function(channel, index) {
                    //in rapidlijst item met zelfde clientportal link opzoeken
                    match = lijst_rapid._findByTag('clientportal_link', channel['clientportal_link']);
                    if (match) {
                        match.set('tvg-id', channel['tvg-id']);
                        match.set('tvg-id', channel['tvg-id']);
                        match.set('tvg-name', channel['tvg-name']);
                        match.set('tvg-shift', channel['tvg-shift']);
                      //channels[index] = match;

                      lijst_rapid._findIndexByTag('clientportal_link', channel['clientportal_link']);
                      if (index != -1) {
                        // console.log(match);
                        lijst_rapid.items[index] = match;
                    } else {
                        console.log(channel['clientportal_link']+" INDEX not found!\r\n");
                    }                        
                } else {
                    console.log(channel['clientportal_link']+" not found!\r\n");
                }    
            });
                // console.log(lijst_rapid.getItems());
                callback();
            });
        });
    }
 
    function loadFile(m3u, filename, client_portal, callback) {
        m3u.loadFromFile(filename, client_portal, callback);
    }

    // lijst_rapid.loadTVGuideJSON('./public/output/tvguide.xml', function(channels) {
    //     populateEPG(channels);
    // });

    // updateRapidList('./public/output/perfectplayer.xml', exportRapidList.bind(null, './public/output/output.m3u'));
    // function populateChannels(channels) {
    //     $('#source_channels').html('');
    //     channels.forEach(function(item) {
    //         $('#source_channels').append('<option value="' + item.get('name') + '">' + item.get('name') + '</option>');
    //         // console.log(item);
    //     });
    // }

    // function populateEPG(channels) {
    //     $('#ddl_epg').html('');
    //     channels.forEach(function(item) {
    //         $('#ddl_epg').append('<option value="' + item.id + '">' + item['display-name'] + '</option>');
    //             // console.log(item.id);
    //         });
    // }
})();
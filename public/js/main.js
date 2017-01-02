(function() {
    const electron = require('electron');
    ipcRenderer = electron.ipcRenderer;

    var _ = require('./public/js/libs/lodash');
    var m3u = require('./public/js/m3u');
    var inspect = require('eyes').inspector({maxLength: false});
    var fs = require('fs');
    db_filename = 'rapidiptv.sqlite';
    var database = require('./public/js/db');
    var dbo = new database(db_filename);
    var xml2js = require('xml2js');
    var parser = new xml2js.Parser();
    const storage = require('electron-storage');
    const path_localstorage = 'localstorage.json';
    localstorage = {};

    lijst_holland = new m3u();
    lijst_rapid = new m3u();

    var group = '';
    var source_folder_epg_xml = './public/webgrabplus/';

    function changeGroup(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        group = $(this).val();
        populateChannels(lijst_rapid.getItems(), group);
        populateOrderedChannels(group);
    }

    // storage.get(path_localstorage, function(err, data) {
    //     if (err) {
    //         console.error(err);
    //     } else {
    //         localstorage = data;
    //     }
    //     console.log(localstorage);
    // });
    // localstorage.naam = 'david';
    // storage.set(path_localstorage, localstorage);


    $('#btn-load-xml').on('click', function(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        filename = $('#rapidm3u').val();

        //filename = './public/output/source.m3u';
        loadFile(lijst_rapid, filename, true, function() {
            populateGroups(lijst_rapid.getItems());

            $('#groups').on('change', changeGroup);
            item = _.first(lijst_rapid.getItems());

            group = $('#groups').val();

            populateChannels(lijst_rapid.getItems(), group);
            populateOrderedChannels(group);
            // populateOrderedChannelsEpg(group);

            $('#channel_editor').show();
        });

        ipcRenderer.send('read-source-xml', 'david');
        ipcRenderer.send('async', 1);
        ipcRenderer.once('read-source-xml-status', function(event, arg) {
           console.log('response='+arg);
       });
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

            lines.push('#EXTM3U');
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
                callback();
            });
        });
    }

    function loadFile(m3u, filename, client_portal, callback) {
        m3u.loadFromFile(filename, client_portal, callback);
    }

    // updateRapidList('./public/output/perfectplayer.xml', exportRapidList.bind(null, './public/output/output.m3u'));o

    function filterBy(arr, prop) {
        var added = [];
        return arr.filter(function(item) {
            if (_.indexOf(added, item.get(prop)) == -1) {
                added.push(item.get(prop));
                return true;
            }

            return false;
        });
        console.log(added);
    }
    function populateGroups(channels) {
        $('#groups').html('');
        groups = filterBy(channels, 'group-title');
        groups = _.sortBy(groups, function(item) {
            return item.get('group-title');
        });

        group_title = item.get('group-title');
        group_title = group_title.replace('#', '');
        item.set('group-title', group_title);
        groups.forEach(function(item) {
            $('#groups').append('<option value="' + item.get('group-title') + '">' + item.get('group-title') + '</option>');
        });
    }

    function populateChannels(channels, group) {
        $('#source_channels').html('');

        channels = _.filter(channels, function(item) {
            return item.get('group-title') == group;
        });
        channels.forEach(function(item) {
            $('#source_channels').append('<option value="' + item.get('name') + '">' + item.get('name') + '</option>');
        });
    }

    function getOrderedChannels(group) {
        var stmt = dbo.db.prepare("SELECT * FROM channels WHERE groupname = :groupname ORDER BY sortorder ASC", {':groupname' : group});
        channels = [];
        while (stmt.step()) {
            channel = stmt.getAsObject();
            channels.push(channel);
        }
        stmt.free();
        return channels;
    }

    function populateOrderedChannels(group) {

        $('#ordered_channels').html('');

        getOrderedChannels(group).forEach(function(channel, index) {
            addOrderedChannelItem(channel.name);
        });
        setOrderedChannelsSortable();
        updateSourceChannels();
        initializeSelects();
    }

    function populateOrderedChannelsEpg(group) {
        $('#ordered_channels_epg').html('');
        getOrderedChannels(group).forEach(function(channel, index) {
            addOrderedChannelEpgItem(channel.name);
        });

        $ordered_channels = $( "#ordered_channels_epg");
        $ordered_channels.sortable();
        $ordered_channels.disableSelection();
    }

    $('#source_channels').on('dblclick', function(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        channel = $(this).val()[0];
        addChannel(channel, 0, group);
        updateSourceChannels();
        initializeSelects();
    });

    function updateSourceChannels() {
        //de sourcechannel lijst updaten (reeds gekozen eruit filteren)
        ordered = _.map(getOrderedChannels(group), 'name');

        source = $('#source_channels option').map(function() {
            return $(this).val();
        });

        diff = _.difference(source, ordered);
        $('#source_channels').html('');
        diff.forEach(function(item) {
         $('#source_channels').append('<option value="' + item + '">' + item + '</option>'); 
     })        
    }



    function addChannel(channel, sortorder, groupname) {
        sql_params = [
        channel,
        sortorder,
        groupname,
        ];
        dbo.db.run('INSERT INTO channels(name, sortorder, groupname) VALUES (:name, :sortorder, :groupname)', sql_params);
        dbo.save();
        addOrderedChannelItem(channel);
    }

    function addOrderedChannelItem(name) {
        // $('#ordered_channels').append('<li class="ui-state-default" data-name="'+name+'"><span class="ui-icon ui-icon-arrowthick-2-n-s"></span>'+name+'<i class="fa fa-trash js-delete" aria-hidden="true"></i></li>');
        channel = dbo.getByName(name);
        epg_site = epg_site_id = '';
        if (channel != null) {
            epg_site = channel.epg_site;
            epg_site_id = channel.epg_site_id;
        }

        xmls = loadEpgXmls();
        html = '<li class="ui-state-default"  data-name="'+name+'">';
        html += '<label>';
        html += name;
        html += '<i class="fa fa-trash js-delete" aria-hidden="true"></i>';
        html += '</label>';
        html += '<select name="epg_xml" class="form-control form-control-sm epg_xml">';
        html += '<option value="0">Please choose</option>';
        xmls.forEach(function(xml) {
            str_sel = (epg_site == xml)?' selected="selected"':'';
            // console.log(channel._);
            // console.log(channel.$.site);
            html += '<option value="'+xml+'" '+str_sel+'>'+xml+'</option>';
        });
        html += '</select>';
        html += '<select name="epg_channel" class="form-control form-control-sm epg_channel" id="'+name+'">';

        html += '</select>';
        html += '</li>';
        $('#ordered_channels').append(html);

        if (epg_site != null) {
            //$ddl = $('#ordered_channels').find('[data-name="'+name+'"]').closest('.epg_channel');
            $ddl = $('#ordered_channels').find("li[data-name='"+name+"']").find('.epg_channel');
            populateEpgXmlChannels($ddl, source_folder_epg_xml+epg_site, epg_site_id);
        }
    }

    function addOrderedChannelEpgItem(name) {
        xmls = loadEpgXmls();
        html = '<li data-name="'+name+'">';
        html += name;
        html += '<select name="epg_xml" class="form-control epg_xml">';
        html += '<option value="">Please choose</option>';
        xmls.forEach(function(xml) {
            // console.log(channel._);
            // console.log(channel.$.site);
            // str_sel = epg_site_id == 
            html += '<option value="'+xml+'">'+xml+'</option>';
        });
        html += '</select>';
        html += '<select name="epg_channel" class="form-control epg_channel" id="'+name+'">';

        html += '</select>';
        html += '</li>';
        $('#ordered_channels_epg').append(html);
    }

    $(document).on('change', '.epg_xml', function(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        xml_file = $(this).val();
        $epg_channel = $(this).parent().find('.epg_channel');
        if (xml_file != 0) {
            epg_site = $(this).val();
            populateEpgXmlChannels($epg_channel, source_folder_epg_xml+xml_file, '');
        } else {
            epg_site = xml_file = '';
        }
        name = $(this).parent().attr('data-name');
        
        sql_params = [
        epg_site,
        name,
        ];
        sql = "UPDATE channels SET epg_site = :epg_site, epg_site_id = '' WHERE name = :name";
        dbo.db.run(sql, sql_params);
        dbo.save();
    });


    $(document).on('change', '.epg_channel', function(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        epg_site_id = $(this).val();
        
        name = $(this).parent().attr('data-name');
        sql_params = [
        epg_site_id,
        name,
        ];
        sql = "UPDATE channels SET epg_site_id = :epg_site_id WHERE name = :name";
        dbo.db.run(sql, sql_params);
        dbo.save();
    });

    function populateEpgXmlChannels($ddl, xmlPath, selected_val) {
        $ddl.html('<option></option>');
        getEpgXmlChannels(xmlPath, function(channels) {
            console.log(xmlPath);
            channels.forEach(function(channel, index) {
               str_sel = (selected_val == channel._)?' selected="selected"':'';
               html = '<option value="'+channel._+'" '+str_sel+'>'+channel._+'</option>';
                 // console.log(html);
                 $ddl.append(html);
             });
            // return channels;
        });
        initializeSelects();
    }

    function loadEpgXmls() {
        // $webgrab_xmls = $('#webgrab_xmls');
        // $webgrab_xmls.html('<option>Please choose</option>');
        xmls = [];
        files = fs.readdirSync(source_folder_epg_xml);
        files.forEach(function(file) {
            filter = /\.xml$/;
            if (filter.test(file)) {
                xmls.push(file);
            }
        });
        return xmls;
    }

    function getEpgXmlChannels(xmlPath, callback) {
        try {

            data = fs.readFileSync(xmlPath);
            parser.parseString(data, function (err, result) {
                // console.log(err);
                // console.log(result);
                // return result;
                channels = result.site.channels[0].channel;
                callback(channels);
            });    
        } catch(err) {
            callback([]);
            console.log(err);
        }
        
    }

    // loadEpgConfig(loadEpgChannels);

    function loadEpgConfig() {
        channels = [];
        data = fs.readFileSync('./public/WebGrab++.config.xml');
        parser.parseString(data, function (err, result) {
            //epg_config = result.settings.channel);
            return result;
        });
        // fs.readFileSync('./public/WebGrab++.config.xml', function(err, data) {
        //     parser.parseString(data, function (err, result) {
        //         //epg_config = result.settings.channel);
        //         callback(result);
        //     });
        // });
    }

    function loadEpgChannels(xmldata) {
        // console.log(xmldata);
        channels = xmldata.settings.channel;
        // channels.forEach(function(channel) {
        //     // console.log(channel);
        //     // console.log(channel._);
        //     // console.log(channel.$.site);
        // });
        return channels;
    }
    
    function setOrderedChannelsSortable() {
        $ordered_channels = $( "#ordered_channels" );
        $ordered_channels.sortable();
        $ordered_channels.disableSelection();
        $ordered_channels.on( "sortstop", function( event, ui ) {
            var sortedIDs = $ordered_channels.sortable("toArray", {attribute: 'data-name'});
            // sql = 'DELETE FROM channels WHERE groupname = :groupname';
            // dbo.db.run(sql, [group]);

            sortedIDs.forEach(function(item, index) {
                sql_params = [
                index,
                item,
                group
                ];
                // dbo.db.run('INSERT INTO channels(name, sortorder, groupname) VALUES (:name, :sortorder, :groupname)', sql_params);
                sql = 'UPDATE channels SET sortorder = :sortorder WHERE name = :name AND groupname = :groupname';
                dbo.db.run(sql, sql_params);
            });
            dbo.save();
        });

        $(document).on('click', "#ordered_channels li .js-delete", function(event){
            event.preventDefault();
            event.stopImmediatePropagation();
            //console.log($(this));
            $(this).closest('li').remove();
            sql = 'DELETE FROM channels WHERE groupname = :groupname AND name = :name';
            dbo.db.run(sql, [group, $(this).parent().attr('data-name')]);
            dbo.save();
        });
    }

    function initializeSelects() {
        $(".epg_xml, .epg_channel, #groups").select2({
            width: "100%"
        });    
    }


    // $('#collapse-ordered').on('click', function(event) {
    //     event.preventDefault();
    //     console.log('jaa');
    //     // $('#ordered_channels_epg').find('.epg_xml').hide();
    //     console.log($('#ordered_channels_epg').find('.epg_xml'));
    // });

    initializeSelects();
    
})();
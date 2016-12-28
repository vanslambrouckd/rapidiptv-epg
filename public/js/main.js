(function() {
    const electron = require('electron')
    ipcRenderer = electron.ipcRenderer;

    
    var m3u = require('./m3u');
    lijst_holland = new m3u();
    lijst_rapid = new m3u();

    $('#btn-load-xml').on('click', function(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        filename = ($('#xml').val());
        loadFiles(filename);
        //loadFile('./public/output/source.m3u');
        //event.stopPropagation();
        ipcRenderer.send('read-source-xml', 'david');
       // ipcRenderer.send('async', 1);
       ipcRenderer.once('read-source-xml-status', function(event, arg) {
           console.log('response='+arg);
       });
    });
    
    filename = ($('#xml').val());

    loadFiles();

    // $.when(loadFile('./public/output/source.m3u', true)).done(function(ret) {
    //     console.log(ret);
    // });

    function loadFiles() {
      $.when(lijst_holland.loadFromFile('./public/output/EXTINF.m3u')).done(function(ret2) {
        console.log(lijst_holland.getItems().length);
      });

      
    }

    $.when(lijst_rapid.loadFromFile('./public/output/source.m3u')).done(function(ret) {
      console.log(lijst_rapid.getItems().length);
    });
    // function loadFile(filename) {
    //     var deferred = new $.Deferred();
    //     console.log('filename='+filename);
       
    //     // $.when(
    //     //     lijst_holland.loadFromFile(filename, false), 
    //     //     lijst_rapid.loadFromFile('./public/output/source.m3u', true)
    //     // ).done(function(ret_holland, ret_rapid) {
    //     //   console.log(ret_holland.getItems().length);
    //     //   ret_holland.getItems().forEach(function(item) {
    //     //      console.log(item.get('name'));
    //     //   });

    //     //   lijst_merge = new m3u();
    //     //   lijst_merge.link(lijst_holland, lijst_rapid);
    //     //   populateSelects();
    //     //   console.log('done');
    //     // });
    // }
    function populateSelects() {
      lijst_holland.getItems().forEach(function(item, index) {
        $('#holland_channels').append('<option value="' + index + '">' + item.get('name') + '</option>');
         console.log(item.get('name'));
       });
    }
})();
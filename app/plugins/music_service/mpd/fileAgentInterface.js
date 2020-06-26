var unirest = require('unirest');
var libQ = require('kew');

var fileAgentBaseUrl = 'http://localhost:4000';

function FileAgentInterface(context) {

    this.context = context;
    this.commandRouter = this.context.coreCommand;
    this.logger = this.context.logger;

}

FileAgentInterface.prototype.search = function (query) {

}

FileAgentInterface.prototype.handleBrowseUri = function (curUri) {
    var self = this;
    var defer = libQ.defer();

    console.log(curUri);

    if (curUri === 'artists://') {
        return self.listArtists();
    }

    // albums
    else if (curUri.startsWith('albums://')) {
        if (curUri == 'albums://') {			// Just list albums
            return self.listAlbums();
        } else {
            if (splitted.length == 3) {
                return self.listAlbumSongs(curUri, 2, 'albums://');
            } else {
                return self.listAlbumSongs(curUri, 3, 'albums://');
            }
        }
    }

    if (curUri === 'albums://') {
        return self.listAlbums();
    }

    return defer.promise

}

FileAgentInterface.prototype.explodeUri = function(uri) {

}

FileAgentInterface.prototype.listArtists = function() {
    var self = this;
    var defer = libQ.defer();

    var artistsList = self.performFileAgentGetRequest('/browse/artists')
    artistsList.then((data)=>{
        var responseObj = self.getDefaultListObject();
        for (var i in data.artists) {
            try {
                var artist = data.artists[i];
                if (artist.length) {
                    var codedArtist = encodeURIComponent(artist);
                    var artistItem = {
                        service:'mpd',
                        type:'folder',
                        title:artist,
                        albumart:self.getAlbumArt({artist: codedArtist}, undefined, 'users'),
                        uri: 'artists://' + codedArtist
                    }
                    responseObj.navigation.lists[0].items.push(artistItem);
                }
            } catch(e) {
                self.logger.error('Failed to parse artist: ' + e);
            }
        }
        defer.resolve(responseObj);
    })

    return defer.promise
}

FileAgentInterface.prototype.listArtist = function() {
    var self = this;
    var defer = libQ.defer();

    var artistsList = self.performFileAgentGetRequest('/browse/artists')
    artistsList.then((data)=>{
        var responseObj = self.getDefaultListObject();
    for (var i in data.artists) {
        try {
            var artist = data.artists[i];
            if (artist.length) {
                var codedArtist = encodeURIComponent(artist);
                var artistItem = {
                    service:'mpd',
                    type:'folder',
                    title:artist,
                    albumart:self.getAlbumArt({artist: codedArtist}, undefined, 'users'),
                    uri: 'artists://' + codedArtist
                }
                responseObj.navigation.lists[0].items.push(artistItem);
            }
        } catch(e) {
            self.logger.error('Failed to parse artist: ' + e);
        }
    }
    defer.resolve(responseObj);
})

    return defer.promise
}


FileAgentInterface.prototype.listAlbums = function() {
    var self = this;
    var defer = libQ.defer();

    var albumsList = self.performFileAgentGetRequest('/browse/albums')
    albumsList.then((data)=>{
        var responseObj = self.getDefaultListObject();
        for (var i in data.albums) {
            try {
                var album = data.albums[i];
                if (album.title && album.title.length) {
                    var albumName = album.title;
                    var artistName = '';
                    if (album.albumArtist) {
                        artistName = album.albumArtist;
                    } else if (album.artist && album.artists[0]){
                        artistName = album.artists[0];
                    }
                    var path = album.tracksFolders[0];
                    if (album.trackPathWithEmbeddedAlbumart) {
                        var embeddedMetaPath = album.trackPathWithEmbeddedAlbumart;
                    }

                    //todo add embedded to albumart server
                    var album = {
                        service: 'mpd',
                        type: 'folder',
                        title: albumName,
                        artist: artistName,
                        album: '',
                        uri: 'albums://' + encodeURIComponent(artistName) + '/' + encodeURIComponent(albumName),
                        albumart: self.getAlbumArt({artist: artistName, album: albumName}, path, 'dot-circle-o')
                    };
                responseObj.navigation.lists[0].items.push(album);
                }
            } catch(e) {
                self.logger.error('Failed to parse album: ' + e);
            }
        }
        defer.resolve(responseObj);
    })

    return defer.promise
}

FileAgentInterface.prototype.listAlbumSongs = function(uri, index, previous) {
    var self = this;
    var defer = libQ.defer();
    var splitted = uri.split('/');

    if (splitted[0] == 'genres:') { // genre
        var genre = decodeURIComponent(splitted[2]);
        var albumartist = decodeURIComponent(splitted[3]);
        var albumName = decodeURIComponent(splitted[4]);

        var safeGenre = genre.replace(/"/g, '\\"');
        var safeAlbumartist = albumartist.replace(/"/g, '\\"');
        var safeAlbumName = albumName.replace(/"/g, '\\"');

        var request = '/browse/album?artist=' + safeArtist + '&title=' + safeAlbumName;
    } else if (splitted[0] == 'albums:') { // album
        var artist = decodeURIComponent(splitted[2]);
        var albumName = decodeURIComponent(splitted[3]);
        var safeArtist = artist.replace(/"/g, '\\"');
        var safeAlbumName = albumName.replace(/"/g, '\\"');


        var request = '/browse/album?artist=' + safeArtist + '&title=' + safeAlbumName;
    } else { // artist
        var artist = decodeURIComponent(splitted[2]);
        var albumName = decodeURIComponent(splitted[3]);
        var safeArtist = artist.replace(/"/g, '\\"');
        var safeAlbumName = albumName.replace(/"/g, '\\"');

        var request = '/browse/album?artist=' + safeArtist + '&title=' + safeAlbumName;
    }
    console.log(request)
    var albumInfo = self.performFileAgentGetRequest(request)
    albumInfo.then((data)=>{
        console.log(data);

        var artist = '';
        if (data.album.albumArtist) {
            artist = data.album.albumArtist;
        } else if (data.album.artists && data.album.artists[0]) {
            artist = data.album.artists[0];
        }

        
        var response = {
            'navigation': {
                'info': {
                    'uri': 'music-library/',
                    'service': 'mpd',
                    'title': 'title',
                    'artist': 'artist',
                    'album': 'album',
                    'type': 'song',
                    'albumart': 'albumart',
                    'duration': 'time'
                },
                'lists': [
                    {
                        'availableListViews': [
                            'list'
                        ],
                        'items': [

                        ]
                    }
                ],
                'prev': {
                    'uri': previous
                }
            }
        };

        for (var i in data.albums) {
        try {
            var album = data.albums[i];
            if (album.title && album.title.length) {
                var albumName = album.title;
                var artistName = '';
                if (album.albumArtist) {
                    artistName = album.albumArtist;
                } else if (album.artist && album.artists[0]){
                    artistName = album.artists[0];
                }
                var path = album.tracksFolders[0];
                if (album.trackPathWithEmbeddedAlbumart) {
                    var embeddedMetaPath = album.trackPathWithEmbeddedAlbumart;
                }

                //todo add embedded to albumart server
                var album = {
                    service: 'mpd',
                    type: 'folder',
                    title: albumName,
                    artist: artistName,
                    album: '',
                    uri: 'albums://' + encodeURIComponent(artistName) + '/' + encodeURIComponent(albumName),
                    albumart: self.getAlbumArt({artist: artistName, album: albumName}, path, 'dot-circle-o')
                };
                responseObj.navigation.lists[0].items.push(album);
            }
        } catch(e) {
            self.logger.error('Failed to parse album: ' + e);
        }
    }
    defer.resolve(responseObj);
})

    return defer.promise
}


FileAgentInterface.prototype.performFileAgentGetRequest = function(request) {
    var self = this;
    var defer = libQ.defer();

    var requestUrl = fileAgentBaseUrl + request
    var Request = unirest.get(requestUrl);
    Request.end(function (response) {
        if (response && response.body && response.body.success) {
            defer.resolve(response.body);
        } else {
            defer.reject('');
        }
    });

    return defer.promise;
}


FileAgentInterface.prototype.getAlbumArt = function (data, path, icon) {
    if (this.albumArtPlugin == undefined) {
        // initialization, skipped from second call
        this.albumArtPlugin = this.commandRouter.pluginManager.getPlugin('miscellanea', 'albumart');
    }

    if (this.albumArtPlugin) { return this.albumArtPlugin.getAlbumArt(data, path, icon); } else {
        return '/albumart';
    }
};

FileAgentInterface.prototype.getDefaultListObject = function () {
    var responseObj = {
        'navigation': {
            'lists': [{
                'availableListViews': [
                    'list',
                    'grid'
                ],
                'items': [

                ]
            }]
        }
    };

    return responseObj;
};



module.exports=FileAgentInterface;
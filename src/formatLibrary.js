//handles only the authentication and holds tokens
var apiAuth = require('./apiAuthentication');
//handles all api data requests. needs token from apiAuth to work (i think)
var apiRequests = require('./apiRequests');



//FORMATTING LIBRARY
//takes the library returned from axios call in componentDidMount and formats it to
//what I need. Will call several functions within.
async function formatLibrary (preLibrary) {
    let workingLibrary = preLibrary;
    // console.log('am i getting the data tho: ', workingLibrary)

    //parses array and returns array of artist objects
    //will be list of artists with no albums
    let artistListOne =  await getArtists(workingLibrary);
  
    //parses library array and returns array of album objects
    let albumList = getAlbums(preLibrary);
  
    //parses through the album objects and sorts them out to each of the artists
    let masterList = sortAlbums(artistListOne, albumList);
    
    // console.log('after formatting: ', masterList)
    return masterList;
}

//accepts an array of track objects and creates a list of the artist objects 
//within each track, then runs that list through formatArtists to format each obj
//then returns the formatted list
async function getArtists (library) {

    let theseArtists = [];
    let libLength = library.length;

    for (let i = 0; i < libLength; i++) {
        let thisTrack = library[i].track;
        thisTrack.artists.forEach(artist => {
            theseArtists.push(artist);
        })
    }

    let uniqueArtists = theseArtists.filter((artist, index, self) => {
        const _artist = JSON.stringify(artist);
        return index === theseArtists.findIndex(obj => {
            return JSON.stringify(obj) === _artist;
        })
    });

    //gets all the artist id's from the above list and makes
    //axios request on each one, pulls the genres from each artist
    //and adds them to the artist list. returns the updated list
    let officialArtists =  await getGenres(uniqueArtists);
    let artistList = officialArtists.map(artist => createArtistObject(artist));
    return artistList;
}

//accepts an array of track objects and creates a smaller array of album objects
function getAlbums (preLibrary, artistList) {
// console.log('pre: ', preLibrary);
//array of album name strings to ref if album is already on tempAlbumList
let tempAlbumNameList = [];

//will be an array of albums
let tempAlbumList = [];

preLibrary.forEach(item => {
    let newTrack = createTrackObject(item.track);
    if (tempAlbumNameList.includes(item.track.album.name)) {
        let albumPosition = findAlbum(tempAlbumList, item.track.album.name);
        tempAlbumList[albumPosition].tracks.push(newTrack);
        return;
    } else {
        let newAlbum = createAlbumObject(item.track);
        newAlbum.tracks.push(newTrack);
        tempAlbumList.push(newAlbum);
        tempAlbumNameList.push(item.track.album.name);
    }
})

return tempAlbumList;

}

async function getGenres (array) {
    console.log('getGenres running...')

    let artistAPIList = [];

    let artistArray = array.map(artist => {
        return artist.id;
    });

    while (artistArray.length > 0) {
        let artistChunk = 50;
        if (artistArray.length < 50) {
            artistChunk = artistArray.length;
        }

        let splicedArray = artistArray.splice(0, artistChunk);

        let artists = await apiRequests.getMultiple(apiAuth.showToken(), splicedArray, 'artists');
        artists.artists.forEach(artist => {
            artistAPIList.push(artist);
        })
    }
    return artistAPIList;
}

//goes through each album in the album list and matches it to the corresponding artist
//does not filter out singles or compilations (yet)
//TODO: filter out singles and compilations
function sortAlbums (artistList, albumList) {

    let albums = albumList;

    let sortedList = artistList.map(artist => {
        let albumListLength = albums.length;

        for (let i = 0; i < albumListLength; i++) {
            if (albums[i].albumType !== 'compilation' && checkArtistsOnList(artist.name, albums[i].artists)) {
                artist.music.push(albums[i]);
            }
        }
        return artist;
    })
    return sortedList;
    }

    function checkArtistsOnList (artist, list) {
    if (list.includes(artist)) {
        return true;
    } else {
        return false;
    }
}

//just returns the index of the matching album
function findAlbum (tempAlbumList, albumName) {
    for (let i = 0; i < tempAlbumList.length; i++) {
        if (tempAlbumList[i].name === albumName) {
            return i;
        }
    }
}

//accepts an array of artists and formats each one
//TODO: get genres for each artist
function createArtistObject (artist) {
    let formattedArtist = {
        genres: artist.genres,
        href: artist.href,
        id: artist.id,
        music: [],
        name: artist.name,
        popularity: artist.popularity,
        uri: artist.uri,
        images: artist.images,
    }

    return formattedArtist;
}

//accepts a track object and formats it to what I need it to be in this app
function createTrackObject (track) {
    let artists = [];

    track.artists.forEach(artist => {
        artists.push(artist.name);
    })

    let newTrack = {
        albumName: track.album.name,
        artists: artists,
        href: track.href,
        id: track.id,
        name: track.name,
        trackNumber: track.track_number,
        uri: track.uri,
    }

    return newTrack;
}

//accepts a track object and uses that to make an album object containing the track
//TODO: get genres for each album
function createAlbumObject (preTrack) {
    let artists = [];

    preTrack.artists.forEach(artist => {
        artists.push(artist.name);
    })

    let newAlbum = {
        albumType: preTrack.album.album_type,
        artists: artists,
        genres: [],
        href: preTrack.album.href,
        id: preTrack.id,
        name: preTrack.album.name,
        tracks: [],
    }

    return newAlbum;
}

module.exports = {
    formatLibrary: formatLibrary,
}
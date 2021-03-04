var axios = require('axios');


//just a hard coded function that determines which spotify 
//api endpoint i am trying to access
function dataRouter(query) {
    if (query === 'categories') {
        return 'browse/categories';
    } else if (query === 'playlists') {
        return 'me/playlists';
    } else if (query === 'user') {
        return 'me';
    } else if (query === 'library') {
        return 'me/tracks';
    } else if (query === 'artists') {
        return 'artists';
    }
}


///////////////////////////////////////////////////////////////////////////
////GET FUNCTIONS////
///////////////////////////////////////////////////////////////////////////


//gets data from one spotify api endpoint. also
//checks if there are more endpoints within the current
//one (data.next) and if so makes more requests with data.next
async function getData(token, dataQuery) {
    console.log('queried data: ', dataQuery)
    let url = 'https://api.spotify.com/v1/' + dataRouter(dataQuery) + '?offset=0&limit=50';
    let options = createGetOptions(token, url);
    let data = await makeGetRequest(options);
    let response = data.data;
    // if (response.next) {
    //     while (response.next) {
    //         console.log('there are still more items to retrieve')
    //         url = response.next;
    //         options = createGetOptions(token, url);
    //         let newRequest = await makeGetRequest(options);
    //         response.items = response.items.concat(newRequest.data.items);
    //         response.next = newRequest.data.next;
    //     };
    // }
    return response;
}

//gets data from multiple spotify api endpoints
async function getMultiple(token, idArray, dataQuery) {
    let data = {};

    let arrayLength = idArray.length - 1;
    var url = 'https://api.spotify.com/v1/' + dataRouter(dataQuery) + '?ids=';
    for (let i = 0; i < arrayLength; i++) {
        let id = idArray[i];
        id += '%2C';
        url += id;
    };
    url += idArray[arrayLength];

    var options = createGetOptions(token, url);
    data = await makeGetRequest(options);
    data = data.data;
    return data;
}

//creates the options for the get request
function createGetOptions(token, url) {
    var options = {
        method: 'get',
        url: url,
        headers: {
            'Authorization': 'Bearer ' + token,
        },
    };
    return options;
}

//actually makes the get request. this is used in both the 'getData'
//function and also the 'getMultiple' function
function makeGetRequest(options) {
    var request = axios(options).catch(error => {
        if (error) {
            console.log('there was an error in makeGetRequest: ', error.response);
        }
    })
    return request;
}


///////////////////////////////////////////////////////////////////////////
////POST FUNCTIONS////
///////////////////////////////////////////////////////////////////////////


//function SPECIFICALLY for creating a playlist. there will
//be a different function for adding songs to a playlist
async function createPlaylist(token, playlistName, userInfo) {
    let name = {
        name: playlistName,
    };
    let url = 'https://api.spotify.com/v1/users/' + userInfo.toString() + '/playlists';
    let options = createPostOptions(token, url, name)
    let playlist = await makePostRequest(options);
    return playlist.data;
}

//adds songs to previously created playlist in chunks of 100 or less
async function addToPlaylist(token, playlistId, trackList) {
    let newTrackList = trackList;
    let updatedPlaylist;


    while (newTrackList.length > 0) {
        console.log('newTrackList.length: ', newTrackList.length);

        let url = 'https://api.spotify.com/v1/playlists/' + playlistId + '/tracks';
        let tempTrackList;
        let listObj = {uris: []};

        if (newTrackList.length > 100) {
            tempTrackList = newTrackList.splice(0, 100);
        } else {
            tempTrackList = newTrackList.splice(0, newTrackList.length);
        }

        listObj.uris = tempTrackList;
        let options = createPostOptions(token, url, listObj);
        updatedPlaylist = await makePostRequest(options);
    }

    return updatedPlaylist.data;
}

//creates an options object for post requests
function createPostOptions(token, url, postData) {
    var options = {
        method: 'post',
        url: url,
        data: postData ? postData : null,
        headers: {
            'Authorization': 'Bearer ' + token,
        },
    };
    return options;
}

async function makePostRequest(options) {
    let data = axios(options).catch(error => {
        if (error) {
            console.log('there was an error in makePostRequest: ', error.response);
        }
    })
    return data;
}







module.exports = {
    getData: getData,
    getMultiple: getMultiple,
    createPlaylist: createPlaylist,
    addToPlaylist: addToPlaylist,
};
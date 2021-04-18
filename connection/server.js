var express = require('express');
var bodyParser = require('body-parser');

var urlMetadata = require('url-metadata')
var handler = require('./handler')
var cors = require('cors')

var app = express();

app.use(express.static('addSite'));
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

var i = 0
app.get('/getNews',cors(), (req, res) => {
    res.send('Hello frogit');
});

app.get('/getNews20', (req, res) => {
    var body = req.query;

    handler.get20news(body).then((value)=>{
        var data = JSON.stringify(value) 
        res.send(data);
    })
});

//? uid, nId, 
app.get('/clicked', (req, res) => {
    var body = req.query;

    handler.clicked(body).then((value)=>{
        res.send(body);
    })  
});

//? link, interest, tags(array), rating, video(bool)
app.get('/metadata', cors(), (req, res) => {
    var body = req.query;
    body.video = body.video == 'true'?true:false;
    
    console.log(body);

    getMetaNews(body).then((data) => {
        if (data == 'incomplete' || data == 'error') {
            res.send(data);
            return;
        }

        console.log(data);
        handler.addNews(data).then((value) => {
            res.send(data)
        })
    });
});

async function getMetaNews(body) {

    var info = checkMetaNews(body)
    if (!info) return 'incomplete';

    var metaMap = {};
    metaMap.link = body.link;
    metaMap.interest = body.interest;
    metaMap.tags = body.tags
    metaMap.rating = Number(body.rating);
    metaMap.video = body.video;

    try {
        var value = await urlMetadata(body.link);
        console.log(value);

        metaMap.header = value['title'];
        metaMap.image = value['image'];
        metaMap.author = value['author'];
        metaMap.teaser = value['description'];

        var date = new Date(value['article:published_time'])
        if (Number.isNaN(date.getTime())) {
            metaMap.date = 0;
            metaMap.year = 0;
            metaMap.month = 0;
            metaMap.stamp = 0;

        } else {
            metaMap.date = date.getDay();
            metaMap.year = date.getFullYear();
            metaMap.month = date.getMonth();
            metaMap.stamp = date.getTime();
        }

    }
    catch (error) {
        console.log(error);
        return 'error';
    }

    console.log(metaMap);
    return metaMap;
}

function checkMetaNews(body) {
    var array = ["interest", "tags", "rating", "link"];
    var intrest = ['Politics', 'Entertainment', 'Tech', 'Science',
        'Bussiness', 'Sport', 'Misc', 'World', 'Local'];

    var got = false
    for (let i = 0; i < intrest.length; i++) {
        if (body.interest == intrest[i]) got = true;

        if (i < array.length) {
            if (!body.hasOwnProperty(array[i])) {
                return false;
            }
        }
    }

    if (!got) {
        body.interest = 'Misc'
    }
    if (!body.hasOwnProperty('video')) {
        body.video = false;
    }
    return true;
}

//? header, interest, tags(array), rating, image,
//? day, month, year, video(bool) link(news.com), teaser
app.post('/addNews', (req, res) => {
    console.log(req.body)
    var body = req.body;

    if (!checkAddNews(body)) {
        console.log('unable to add news');
        res.send("Could not add news due to incomplete parameters" +
            ' required: ["header", "interest", "tags", "rating", "image", "link"]');
        return;
    }

    handler.addNews(body).then((value) => {
        res.send('news added was ' + value)
    })
});


function checkAddNews(body) {
    var array = ["header", "interest", "tags", "rating", "image", "link"];
    var intrest = ['Politics', 'Entertainment', 'Tech', 'Science',
        'Bussiness', 'Sport', 'Misc', 'World', 'Local'];

    var got = false
    for (let i = 0; i < intrest.length; i++) {
        if (body.interest == intrest[i]) got = true;

        if (i >= array.length) {
            if (!body.hasOwnProperty(array[i])) {
                return false;
            }
        }
    }

    if (!got) {
        body.interest = 'Misc'
    }

    if (!body.hasOwnProperty('day')) {
        body.date = 0;
        body.year = 0;
        body.month = 0;
        body.stamp = 0;
    }
    else {
        var stamp = new Date(body.year, body.month, body.day);
        body.stamp = stamp.getTime()
    }

    if (!body.hasOwnProperty('teaser')) {
        body.teaser = null;
    }
    if (!body.hasOwnProperty('video')) {
        body.video = false;
    }

    return true;
}

//? uid, intrest:[write 3 the user is intrested in]
app.post('/addUser', (req, res) => {
    console.log(req.body)
    var body = req.body;

    if(!checkInterest(req.body)){
        res.send(false);
        return;
    }

    handler.createUser(body).then((value) => {
        res.send(value);
    })
})

function checkInterest(body) {
    var interest = ['Politics', 'Entertainment', 'Tech', 'Science',
        'Bussiness', 'Sport', 'Misc', 'World', 'Local'];

    
    for (let i = 0; i < body.interest.length; i++) {
        var got = false
        for (let r = 0; r < interest.length; r++) {
            if (body.interest[i] == interest[r]) got = true;
        }

        if(!got) return false;
    }

    return true;
}

app.listen(3000, () => {
    console.log('listening on port 3000')
});
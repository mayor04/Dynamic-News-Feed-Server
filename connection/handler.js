const mongo = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/';

exports.createUser = async function (body) {
    var client;
    try {
        var interest = body.interest;

        client = await mongo.connect(url);
        var db = client.db('news');
        var col = db.collection('users');

        var user = await col.findOne({ uid: body.uid });
        console.log('found User', user)
        if (user != null) return true;

        var obj = {
            uid: body.uid,
            interest: {
                Politics: 0,
                Entertainment: 0,
                Tech: 0,
                Science: 0,
                Bussiness: 0,
                Sport: 0,
                Misc: 0,
                World: 0,
                Local: 0
            },
            tags: {
                Politics: [],
                Entertainment: [],
                Tech: [],
                Science: [],
                Bussiness: [],
                Sport: [],
                Misc: [],
                World: [],
                Local: []
            }
        };

        for (var i = 0; i < interest.length; i++) {
            obj.interest[interest[i]] = 20;
        }

        await col.insertOne(obj);
        console.log('user data inserted');
    }
    catch (error) {
        console.log('erorr occured inserting user data', error);
        return false;
    }
    finally {
        client.close();
    }

    return true;
}

exports.addNews = async function (body) {
    var client;
    try {
        client = await mongo.connect(url);
        var db = client.db('news');
        var col = db.collection('content');

        var news = await col.findOne({ link: body.link });
        console.log('News ', news)
        if (news != null) return true;

        var obj = {
            nid: Date.now(),
            header: body.header,
            image: body.image,
            link: body.link,
            interest: body.interest,
            tags: body.tags,
            rating: body.rating,
            teaser: body.teaser,
            clicks: 0,
            author: body.author,
            date: {
                day: body.day,
                month: body.month,
                year: body.year
            },
            video: body.video,
            stamp: body.stamp,
        };

        await col.insertOne(obj);
        console.log('user data inserted');
    }
    catch (error) {
        console.log('erorr occured inserting user data', error);
        return false;
    }
    finally {
        client.close();
    }

    return true;
}

exports.clicked = async function (body) {
    var client;
    try {
        client = await mongo.connect(url);
        var db = client.db('news');
        var newscol = db.collection('content');
        var usercol = db.collection('users')

        console.log('NID',body.nid)
        var nid = Number(body.nid);

        var news = await newscol.findOne({nid: nid });
        console.log('News ', news)
        if (news == null) return true;

        news.clicks += 1;
        var interest = news.interest;
        var tags = news.tags;

        var user = await usercol.findOne({ uid: body.uid });
        console.log('User ', user);
        if (user == null) return true;

        user.interest[interest] += 1;
        for (var i = 0; i < tags.length; i++) {
            user.tags[interest].unshift(tags[i])
            if (user.tags[interest].length > 50) {
                user.tags.pop()
            }
        }

        var one = newscol.replaceOne({ nid: body.nid }, news);
        var two = usercol.replaceOne({ uid: body.uid }, user);

        Promise.all([one, two])
        console.log('user and news data inserted');
    }
    catch (error) {
        console.log('erorr occured inserting user data', error);
        return false;
    }
    finally {
        client.close();
    }

    return true;
}

exports.get20news = async function (body) {

    var client;
    try {
        client = await mongo.connect(url);
        db = client.db('news');

        var newscol = db.collection('content');
        var usercol = db.collection('users');

        var user = await usercol.findOne({ uid: body.uid });
        // console.log('User ', user);
        if (user == null) return true;

        var sort = sortUserInterest(user);
        // console.log(sort);

        var one = await Promise.all([
            getHighestClicks(newscol, 4),
            getLatestRating(newscol, 10),
            getLatestClicks(newscol, 10)]);

        var two = await Promise.all([
            getNewsForTag(user.tags[sort[0]], 7, newscol),
            getNewsForTag(user.tags[sort[1]], 4, newscol),
            getNewsForTag(user.tags[sort[2]], 3, newscol),
            getNewsForTag(user.tags[sort[3]], 2, newscol),
            getNewsForTag(user.tags[sort[4]], 2, newscol)]);


        var highestClicks = one[0];
        var latestRating = one[1];
        var latestClicks = one[2];

        var newsTag1 = two[0];
        var newsTag2 = two[1];
        var newsTag3 = two[2];
        var newsTag4 = two[3];
        var newsTag5 = two[4];

        var first = [...highestClicks,...latestClicks,...latestRating];
        var all = [...first,...newsTag1,...newsTag2,...newsTag3,...newsTag4,...newsTag5];

        all = removeDuplicate(all);
        all = getRandomNews(all,25);
        console.log(all.length);

        return all;  
    }
    catch (error) {
        console.log('erorr occured inserting user data', error);
        return {message:'error'};
    }
    finally {
        client.close();
    }
}

function removeDuplicate(all){
    var nid = [];
    var newAll = [];

    for (var i = 0; i < all.length; i++) {
        var news = all[i];

        if(!nid.includes(news.nid)){
            nid.push(news.nid);
            newAll.push(news);
        }
    }

    return newAll;
}

function getRandomNews(data, count) {
    if(data.length < count){
        return data;
    }
    var newsArray = []
    for (var i = 0; i < count; i++) {
        var length = data.length;
        if (length === 0) {
            return newsArray;
        }
        let random = Math.floor(Math.random() * length)

        newsArray.push(data[random]);
        data.splice(random, 1)
    }
    return newsArray;
}

async function getHighestClicks(newscol, count) {
    var data = await newscol.find({})
        .sort({ clicks: -1 })
        .limit(20)
        .toArray();

    // console.log(data);
    return getRandomNews(data, count)
}

async function getLatestRating(newscol, count) {
    var data = await newscol.find({})
        .sort({ stamp: -1 })
        .limit(100)
        .sort({ rating: -1 })
        .limit(50)
        .toArray();

    // console.log(data);
    return getRandomNews(data, count);
}

async function getLatestClicks(newscol, count) {
    var data = await newscol.find({})
        .sort({ stamp: -1 })
        .limit(100)
        .sort({ clicks: -1 })
        .limit(50)
        .toArray();

    // console.log(data);
    return getRandomNews(data, count);
}

function sortUserInterest(user) {

    var interest = user.interest;
    var top5 = [];
    var no = [];

    console.log(Object.entries(interest))
    // return
    for (let [key, value] of Object.entries(interest)) {

        if (top5.length == 0) {
            top5.push(key);
            no.push(value);

        } else {
            for (let i = 0; i < no.length + 1; i++) {
                if (i == no.length) {
                    top5.push(key);
                    no.push(value);
                    i = 20

                } else if (value > no[i]) {
                    top5.splice(i, 0, key);
                    no.splice(i, 0, value);
                    i = 20
                }
            }
        }
    }

    console.log(top5, no);
    return top5;
}

async function getNewsForTag(allTags, count, newscol) {
    var threeTag = getRandomNews(allTags, 3);
    //get news for each tag add them together and generate random

    var tagNews = [];
    for (let i = 0; i < threeTag.length; i++) {
        var tag = await getForEachTag(threeTag[i], newscol);
        // console.log(tag);
        tagNews = [...tagNews,...tag];
    }

    // console.log(tagNews);
    return getRandomNews(tagNews, count)
}

async function getForEachTag(tag, newscol) {
    var data = await newscol.find({ tags: tag })
        .sort({ clicks: -1 })
        .limit(30)
        .toArray();

    // console.log(data);
    return getRandomNews(data, 10);
}



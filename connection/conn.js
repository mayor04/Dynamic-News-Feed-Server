const mongo = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/';

const handler = require('./handler')
const axios = require('axios');

//"C:\Program Files\MongoDB\Server\4.4\bin\mongo.exe"

// openConn();
async function openConn() {
    var client;
    try {
        client = await mongo.connect(url);
        var db = client.db('news');
        var col = db.collection('customers');

        var obj = { name: 'samuel', ird: 132 };
        await col.insertOne(obj)

        console.log('data inserted');

    }
    catch (error) {
        console.log('erorr occured ', error);
    }
    finally {
        client.close();
    }
}

test()
async function test() {
    // handler.createUser({
    //     uid: 'sammy', interest: ['Entertainment', 'Tech',
    //         'Science',]
    // })
    // handler.clicked({nid:1600853399749,uid:'sammy'})
    // handler.get20news({uid:'reel'});

    var info = checkInterest({interest:['Politics', 'ntertainment', 'Tech', 'Science']})
    console.log(info);
    var axi = await axios.get("https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript");
    console.log(axi);
}

function checkInterest(body) {
    var interest = ['Politics', 'Entertainment', 'Tech', 'Science',
        'Bussiness', 'Sport', 'Misc', 'World', 'Local'];

    
    for (let i = 0; i < body.interest.length; i++) {
        var got = false
        for (let r = 0; r < interest.length; r++) {
            if (body.interest[i] == interest[r]) got = true;
        }
        console.log(got);

        if(!got) return false;
    }

    return true;
}
const mongo = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/';

//"C:\Program Files\MongoDB\Server\4.4\bin\mongo.exe"

openConn();
async function openConn(){
    var client;
    try{
        client = await mongo.connect(url);
        var db = client.db('news');
        var col = db.collection('customers');

        var obj = {name:'samuel',ird:132};
        await col.insertOne(obj)

        console.log('data inserted');

    }
    catch(error){
        console.log('erorr occured ',error);
    }
    finally{
        client.close();
    }
}
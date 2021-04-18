const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios').default;

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/node-intern', (req, res) => {
    payload = req.body.csv;
    console.log(payload);

    if (payload === undefined) {
        //request does not contain a valid payload
        res.send('Invalid Payload or Body')
        return
    }

    getAndParseCsv(payload).then((jsonArray) => {
        res.send(jsonArray);
    })
})

async function getAndParseCsv(payload) {
    var link = payload.url;
    if (link === undefined) {
        return 'Include link to csv file'
    }

    var jsonArray;
    try {
        var csvData = await axios.get(link);
        console.log(csvData.data);
        jsonArray = convertCsv(csvData.data, payload.select_fields)

    } catch (error) {
        return 'Invalid csv file or link'
    }

    console.log(jsonArray);
    return jsonArray;
}

/*
    csv files are string seperatesw by delimeter in most cases ,
    The header is the first line 
    All the subsequent line would be mapped to the header

    all the fields that are not passed would be discarded during 
    conversion
 */

function convertCsv(csv, select_field) {
    //split the array since each data start at a new line
    var csvArray = csv.split("\n");

    //check for " as this would affect parsing to json
    csvArray[0] = csvArray[0].replace(/"/g,'');
    var header = csvArray[0].split(',');

    var modifiedArray = [];

    for (var i = 1; i < csvArray.length - 1; i++) {
        let map = {}

        //split the rows in csv array
        let rowArray = csvArray[i].split(',')

        //run loop to add value to a map
        for (let x in header) {
            //some csv files use spaces so we remove the spaces
            var key = header[x].trim();
            var selectIsNotPassed = select_field === undefined

            //to save time check if select is passed
            //if passed check if the parameters are required if not skip
            //if not passed return all the values
            if (selectIsNotPassed || select_field.includes(key)) {

                //cross checking it is not an empty line for abnormal csv
                if(rowArray.length > x){
                    rowArray[x] = rowArray[x].replace(/"/g,'');
                    map[key] = rowArray[x].trim();
                }
            }
        }

        //after conversion push into the main array
        modifiedArray.push(map);
    }

    var jsonObj = {
        conversion_key: getKey(),
        json: modifiedArray
    }

    //convert to json before returning
    return JSON.stringify(jsonObj);
}

function getKey() {
    return Math.random().toString(36).substring(2);
}

app.listen(3000, () => {
    console.log('listening on port 300')
})
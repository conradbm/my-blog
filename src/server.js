/* Express.js Server

Responds with a message when we request it.

Commands for setup:

npm init
npm install --save express
npm install --save-dev @babel/core @babel/node @babel/preset-env
npx babel-node src/server.js

npm install --save body-parser

npm install --save-dev nodemon
npx nodemon --exec npx babel-node src/server.js

mkdir -p /data/db
# install mongodb
mongod

//Open new terminal
mongo
> use my-blog //create new database
> db.articles.insert([{name:'learn-react',
...         upvotes: 0,
...         comments:[],
...     },
...     {name:'learn-node',
...         upvotes: 0,
...         comments:[],
...     },
...     {name:'my-thoughts-on-resumes',
...         upvotes: 0,
...         comments:[],  
...     }]) //insert our data
> db.articles.find({}).pretty()
> db.articles.find({name:'learn-react'}).pretty()
> db.articles.remove({})

npm install --save mongodb //allows for modifying database in express

*/

import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

// req/request is the input medium with data coming in
// res/response is the output medium to transmit data back
// async/await for database calls


// Express App
const app = express();

// For hosting the site
app.use(express.static(path.join(__dirname, '/build')));

// Provides a body tag for json
app.use(bodyParser.json());

// Function to take care of stand-up/tear-down database calls
const withDB = async (operations, res) => {
    try{

        // await for inline database calls
        const client = await MongoClient.connect('mongodb://localhost:27017', {useNewUrlParser:true})
        const db = client.db('my-blog');
        
        // General call to the database
        await operations(db);

        client.close();
    } catch(error){
        // Send internal server error if fail
        res.status(500).json({message:"Error connecting to db ", error});
    }
}

// GET: Retrieve article data
app.get('/api/articles/:name', async (req, res) => {

    // Start with withDB code, until we hit the parameter `operations`
    // then plug in the argument lines of code, then proceed.
    // This removes all boilerplate database code
    withDB( async (db) => {
        const articleName = req.params.name;

        const articleInfo = await db.collection('articles').findOne({name:articleName});
        res.status(200).json(articleInfo);
    }, res);


})

// POST: Update article upvote/selected data
app.post('/api/articles/:name/upvote', async (req, res) => {
    
    withDB(async (db) => {

        // Get URL parameters
        const articleName = req.params.name;

        // Select statement
        const articleInfo = await db.collection('articles').findOne({name:articleName});

        // Update statement
        await db.collection('articles').updateOne({name: articleName}, {
            /*
            '$inc':{
                upvotes:1,
            }
            */
            '$set':{
                upvotes: articleInfo.upvotes+1,
            }
        });
    
        // Select statement, latest info
        const updatedArticleInfo = await db.collection('articles').findOne({name:articleName});
    
        // Send latest back
        res.status(200).json(updatedArticleInfo);
    }, res)

})

// POST: Update article comment data from users
app.post('/api/articles/:name/add-comment', async (req, res) => {
    
    withDB( async (db) => {

        // Get URL/body parameters
        const articleName = req.params.name;
        const {username, text} = req.body;

        // Select statement
        const articleInfo = await db.collection('articles').findOne({name:articleName});

        // Append statement
        await db.collection('articles').updateOne({name: articleName}, {
            /* 
            '$push':{
                comments: {username, text},
            }
            */
           '$set':{
               comments: articleInfo.comments.concat({username, text}),
           }
        });
    
        // Select statement, latest info
        const updatedArticleInfo = await db.collection('articles').findOne({name:articleName});
    
        // Send latest back
        res.status(200).json(updatedArticleInfo);
    }, res)

});

// For hosting the site @ port 8000
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
});

// Listen to port 8000
app.listen(8000, () => console.log("Listening on port 8000"));

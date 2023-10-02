require('dotenv').config();
const express = require('express');
const fs = require('fs');
const http = require('http');// Import the http module
const app = express();
const httpsOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
};
const server = http.createServer(httpsOptions,app); // Create an HTTP server
const mongoose = require('mongoose')
const Document=require('./Document');
mongoose.set('strictQuery', true);
try {

    mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
}catch (e){
    console.log('not connected  to database',e);
}




const io = require('socket.io')(server,{
    cors: {
        origin: process.env.ORIGIN,
        methods: ['GET', 'POST'],
    },
}); // Attach socket.io to the server

server.listen(3000); // Listen on port 3000

const defaultValue="";

io.on('connection', (socket) => {
    socket.once("get-document",  async (documentId) => {
       const document = await findOrCreateDocument(documentId);
        socket.join(documentId);
        socket.emit("load-document", document.data);

        socket.on("send-changes", (delta) => {
            console.log(delta);
            socket.broadcast.to(documentId).emit("receive-changes", delta);
        })
        socket.on("save-document",async data=>{
            await Document.findByIdAndUpdate(documentId,{ data });
        })

        console.log(documentId);
   })

        console.log('connected');
    });

async function findOrCreateDocument(id){
    if(id===null)return;
    const document=await Document.findById(id);
    if(document)return document;

    return await Document.create({_id:id,data:defaultValue});
}

app.use((req, res) => {
    res.send('Hello, Express is working!');
});

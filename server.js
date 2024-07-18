// Justin K. Pelletier
// CSCI-6655 Final Project Server
// University of New Haven, Fall 2023
// December 6th, 2023

const http = require('http');
const fs = require('fs');
const {MongoClient} = require('mongodb');
const path = require('path');
const PORT = process.env.PORT || 3001;

// create server
const server = http.createServer((req, res) => {

  // assign path extension
  const extension = path.extname(req.url);

  // assign content type
  let contentType;
  switch(extension) {
    case '.css':
        contentType = 'text/css';
        break;
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpeg':
      contentType = 'image/jpeg';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
      default:
        contentType = 'text/html';
  }
  
  // assign file path
  let filePath = path.join(__dirname, "public");
  if(!extension && req.url !== '/' && req.url !== '/api') {
    filePath = path.join(filePath, req.url + ".html");
  } else if(req.url === '/'){
    filePath = path.join(filePath, "index.html");
  } else if(req.url === '/api') {
    filePath = path.join(filePath, 'db.json');
  } else if(req.url !== '/') {
    filePath = path.join(filePath, req.url);
  } else {
    console.log('LOG: Invalid File Path. Directing to index.html');
    filePath = path.join(__dirname, 'public', 'index.html');
  }

  // check if file exists
  const pathExists = fs.existsSync(filePath);

  // serve data
  if(pathExists) {
    req.url === '/api' ? serveAPI(filePath, res) : serveFiles(filePath, contentType, req, res);
  } else {
    res.writeHead(404, { "Content-Type": "text/html"});
    res.write(`<h1>404: File Not Found.</h1>\n\n<h3>The route ${req.url} does not exist.</h3>`);
    res.end();
    console.log(`LOG: Serve failed [404] for ${req.method} (${req.url}) of type ${contentType}.`);
  }
});

// listen to server
server.listen(PORT, (err) => {
  let sub = err ? 'failed to start' : 'successfully started';
  console.log(`Server ${sub} on port ${PORT}`);
  !err ? console.log(`http://localhost:${PORT}\n`) : '';
}); 

// async function to serve static files
async function serveFiles(fPath, cType, request, response) {
  try {
    fs.readFile(fPath, "utf-8", (error, data) => {
      if(!error){
        response.writeHead(200, { "Content-Type" : cType });
        cType === 'application/json' ? response.end(JSON.stringify(data)) : response.end(data);
        console.log(`LOG: Serve successful [200] for ${request.method} (${request.url} - ${cType}) `);
      }
    });
  } catch (error) {
    response.statusCode = 500;
    console.error(error);
    response.end();
    console.log(`LOG: Serve failed for ${request.method} (${request.url} - ${cType}) `);
  }
}

  // async function to fetch and serve data from MongoDB
  async function serveAPI(fPath, response) {
    const uri = 'mongodb+srv://justin:pelletier@playgroundcluster.rcsdgdw.mongodb.net/?retryWrites=true&w=majority';
    const client = new MongoClient(uri);
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Content-Type" : "application/json",
    };

    try {
      await client.connect();
      console.log('LOG: MongoDB connection opened.');

      // read data
      const cursor = client.db("WordsFromWords").collection("words").find({});
      const results = await cursor.toArray();
      const numResults = results.length;
      const data = JSON.stringify(results);
      console.log(`LOG: Fetched ${numResults} results.`);

      // backup last fetch in db.json
      fs.writeFile(fPath, data, (error) => {
        if(error) {
          console.log('LOG: Fetch backup failed to store in .JSON file.');
        } else {
          console.log('LOG: Fetch backup stored successfully in .JSON file.');
        }
      });

      // serve data
      response.writeHead(200, headers)
      response.end(data);

    } catch(error) {
      console.log(error);
    } finally {
      client.close();
      console.log('LOG: MongoDB connection closed.');
    }
  }

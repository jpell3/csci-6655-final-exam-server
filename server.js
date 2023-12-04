const http = require('http');
const fs = require('fs');
const {MongoClient} = require('mongodb');
const path = require('path');
const PORT = process.env.PORT || 3000;

// create server
const server = http.createServer((req, res) => {

  console.log('==================================');
  console.log(req.url, req.method);

  // assign path extension, default = .html
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
  console.log(`extension:   ${extension}`);
  if(!extension && req.url !== '/' && req.url !== '/api') {
    filePath = path.join(filePath, req.url + ".html")
    console.log(`no extension:   ${filePath}`);
  } else if(req.url === '/'){
    filePath = path.join(filePath, "index.html")
    console.log(` / :   ${filePath}`);
  } else if(req.url === '/api') {
    filePath = path.join(filePath, 'db.json')
  } else if(req.url !== '/') {
    filePath = path.join(filePath, req.url)
    console.log(` !/ :   ${filePath}`);
  } else {
    console.error('Invalid File Path. Directing to index.html')
    filePath = path.join(__dirname, 'public', 'index.html')
  }

  // check if file exists
  const pathExists = fs.existsSync(filePath);

  // serve file if valid path
  if(pathExists) {
    if(req.url === '/api') {
      serveFiles(filePath, 'application/json', res);
    } else {
      serveFiles(filePath, contentType, res);
    }
  } else {
    res.writeHead(404, { "Content-Type": "text/html"});
    res.write(`<h1>404: File Not Found.</h1>\n\n<h3>The route ${req.url} does not exist.</h3>`);
    res.end();
  }
});

  // listen to server
  server.listen(PORT, (err) => {
    let sub = err ? 'failed to start' : 'successfully started';
    console.log(`Server ${sub} on port ${PORT}`);
    !err ? console.log(`http://localhost:${PORT}`) : '';
  }
); 

// async function to serve static files
async function serveFiles(fPath, cType, response) {
  try {
    fs.readFile(fPath, "utf-8", (error, data) => {
      if(!error){
        console.log(`SERVED: ${fPath} - ${cType}`);
      response.writeHead(200, { "Content-Type" : cType })
      cType === 'application/json' ? response.end(JSON.stringify(data)) : response.end(data);
      }
    });
  } catch (error) {
    response.statusCode = 500;
    console.error(error);
  }
}

// async function to fetch data from MongoDB
async function dataHandler(word, type, func) {
  const uri = 'mongodb+srv://justin:pelletier@playgroundcluster.rcsdgdw.mongodb.net/?retryWrites=true&w=majority';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('LOG:  MongoDB server connection opened.');
    switch(func) {
      case 'fetch':
        await fetchData(client, word, type);
        break;
      case 'add':
        break;
      default:
        console.log('Invalid operation.');
    }
  } catch(error) {
    console.log(error);
  } finally {
    await client.close();
    console.log('LOG:  MongoDB server connection closed.');
  }

}

async function fetchData(client, word, type) {
  const cursor = client.db("WordsFromWords").collection(type).find({});
  const results = await cursor.toArray();
  const js = JSON.stringify(results);
  console.log(js);
}
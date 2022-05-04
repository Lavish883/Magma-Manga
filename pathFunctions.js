const fetch = require('node-fetch'); // fetchs html
const serverName = process.env['SERVERNAME'] || 'http://localhost:5832/';


async function indexHtml(req, res){
  
  /*
    if (!isPupServerLoaded){
    res.render('loading')
    isPupServerLoaded = true;
  }
  */
  
  let fetchAllData = await fetch(serverName + 'api/manga/all')
  let resp = await fetchAllData.json();
  
  return res.render('index', resp)
}




module.exports = {
  indexHtml
  
}
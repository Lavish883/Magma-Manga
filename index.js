const pug = require('pug') // html template
const express = require('express');
const fetch = require('node-fetch');
const mainFunctions = require ('./mainFunctions')

const breakCloudFlare = 'https://letstrypupagain.herokuapp.com/?url=https://mangasee123.com'
// Generate human like headers so site doesn't detect us
const HeaderGenerator = require('header-generator');
const headersGenerator = new HeaderGenerator({
  browsers: [
    {name: "firefox", minVersion: 80},
    {name: "chrome", minVersion: 87},
      "safari"
    ],
    devices: [
      "desktop"
    ],
    operatingSystems: [
      "windows"
    ]
});

// run express at port 8190
const app = express()
const port = process.env.PORT || 8190;
app.set('view engine', 'pug')


app.get('/', (req, res) => {
  const options = {
    title: 'Hey', 
    message: 'Hello there!',
    p1:"<p1>Heyyyyy</p1>"
  }
  res.render('index', options)
})

// given => mangaName?One-Piece
app.get('/mangaName?', async (req, res) => {
  let headers = headersGenerator.getHeaders();
  let mangaName =  req.query.manga;

  if (typeof mangaName === 'undefined'){
    return res.send('not valid')
  }

  let link = breakCloudFlare + '/manga/' + mangaName;  
  let fetchManga = await fetch(link, headers);
  let resp = await fetchManga.text();
  
  return res.send(mainFunctions.scrapeManga(resp))
})

// given => type as hot (popular) and latest
app.get('/manga/main/:type', async (req, res) => {
  let headers = headersGenerator.getHeaders();
  let fetchHot = await fetch(breakCloudFlare, headers);
  let resp = await fetchHot.text();
  
  if (req.params.type == 'hot'){
    return res.send(mainFunctions.scrapeHotManga(resp))
  } else if (req.params.type = 'latest'){
    return res.send(mainFunctions.scrapeLatestManga(resp))
  } 
  
  return res.send('not valid')
})

app.get('/manga/recommend', async (req,res) => {
  let headers = headersGenerator.getHeaders();

  let manga1 = req.query.manga1;
  let manga2 = req.query.manga2;

  let manga1Genres = await mainFunctions.getGenres(manga1, headers);
  let manga2Genres = await mainFunctions.getGenres(manga2, headers);
  
  let allGenres = [...new Set([...manga1Genres,  ...manga2Genres])]

  let similarManga = await mainFunctions.getSimilarManga(allGenres)
  
  return res.send(similarManga)
  
})



app.listen(port)
var express = require('express');
var router = express.Router();
// var Promise = require('promise');
var syllable = require('syllable');
var Sentencer = require('sentencer');
// var WordPOS = require('wordpos'),
//     wordpos = new WordPOS();

var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

const vision = require('@google-cloud/vision');

const client = new vision.ImageAnnotatorClient({
  keyFilename: 'jackie-google-vision-key.json'
});

var multer = require('multer');
var upload = multer({ dest: 'public/images'});

router.post('/', upload.single('avatar'), function (req, res, next) {
  // console.log('req.file ::', req.file);
  // console.log('req.body ::', req.body);
  // console.log('req.file[path]: ', req.file['path']);
  // // res.status(200).send(`${req.file}`)

  const pictureFile = req.file['filename'];
  const webWordBank = webDetect(req.file['path']).then(results => {
    labelDetect(req.file['path']).then(labelResults => {
      const combinedWordBank = sortBySyllable([...new Set(results['arrayOfWords'].concat(labelResults))]);

      // best guess for web but not currently used
      const bestGuessWeb = results['bestGuess'];
      const wordBank = {}
      wordBank['combinedWordBank'] = combinedWordBank;
      // wordBank['wordForAdjective'] = bestGuessWeb;
      let i = 0;
      while( (labelResults[i].indexOf(' ') != -1) && i < labelResults.length) {
        i++
      }

      wordBank['wordForAdjective'] = labelResults[i];

      return wordBank;
    }).then(wordBank => {

      // const adjectives = sortBySyllable(generateAdjectives(10));

      const bestGuessWord = wordBank['wordForAdjective'].trim();
      const adjectiveOfBestWordObjects = makeRequest('GET', `https://api.datamuse.com/words?rel_jjb=${wordBank['wordForAdjective']}`)
        .then(function (result) {
          const arrayOfAdjectives = sortBySyllable(JSON.parse(result).map(wordObject => {
            return wordObject['word'];
          }));

          const mySentence1 = generateSentence(wordBank['combinedWordBank'], 5, arrayOfAdjectives);
          const mySentence2 = generateSentence(wordBank['combinedWordBank'], 7, arrayOfAdjectives);
          const mySentence3 = generateSentence(wordBank['combinedWordBank'], 5, arrayOfAdjectives);

          console.log(mySentence1);
          console.log(mySentence2);
          console.log(mySentence3);

          res.render('index', {
            title: 'Haiku Generated',
            sentence1: mySentence1,
            sentence2: mySentence2,
            sentence3: mySentence3,
            pictureURL: pictureFile,
          })
        })
        .catch(function (err) {
          console.error('Augh, there was a error UGHGHHH!', err);
        })
    })
    .catch(err => {
      console.error('ERROR:', err);
    })
  })
  .catch(err => {
    console.error('ERROR:', err);
  }); 
})


/* GET home page. */
router.get('/', function(req, res, next) {
  const pictureFile = 'cat.jpg';
  const pictureDirectory = `./public/images/${pictureFile}`;

  res.render('index', {
    title: 'Haiku Generator',
    pictureURL: pictureFile
  })
});


function randomKeySelector(wordObj, maxSyllable) {
  // get keys which are all the syllables
  let keys = Object.keys(wordObj);

  // remove all syllables that are over maxSyllable
  for(let i = 0; i < keys.length; i++) {
    if (parseInt(keys[i]) > parseInt(maxSyllable)) {
      keys.splice(i, 1);
      i--;
    }
  }

  // randomly select and return a an array of remaining syllables
  return wordObj[keys[ keys.length * Math.random() << 0]];
}

function generateSentence(words, syllables, adjectives) {
  let sentence = '';

  const firstArray = randomKeySelector(words, syllables);
  const firstArrayRandomNumber = Math.floor(Math.random() * firstArray.length);
  const firstWord = firstArray && firstArray[firstArrayRandomNumber];
  const firstWordSyllables = firstWord && syllable(firstWord);

  // this should remove the word from the word bank
  const firstWordIndex = words[firstWordSyllables] && words[firstWordSyllables].indexOf(firstWord);
  if ((firstWordIndex || firstWordIndex === 0) && (firstWordIndex !== -1)) {
    // console.log('----------------------------------------------');
    // console.log('words: ', words);
    // console.log('words[firstwordSyllables]: ', words[firstWordSyllables]);
    // console.log('firstWordSyllalbes: ', firstWordSyllables);
    // console.log('------------------------------------------------------');
    words[firstWordSyllables].splice(firstWordIndex, 1);
  }
  const remainingSyllables = syllables - firstWordSyllables;
  sentence += firstWord;
  if (remainingSyllables > 0) {
    sentence = `${generateSentence(adjectives || words, remainingSyllables)} ${sentence}`;
  }

  return sentence;
}

function generateAdjectives(amount) {
  let adjectiveList = [];
  for(let i = 0; i < amount; i++) {
    adjectiveList.push(Sentencer.make("{{ adjective }}"));
  }

  return adjectiveList;
}

function sortBySyllable(arrayOfWords) {
  sortedBySyllables = {};

  arrayOfWords.forEach((word) => {
    const numberOfSyllables = syllable(word);
    if(sortedBySyllables[numberOfSyllables]) {
      sortedBySyllables[numberOfSyllables].push(word);
    } else {
      sortedBySyllables[numberOfSyllables] = [word];
    }
  });

  if (!sortedBySyllables['1']) {
    sortedBySyllables['1'] = ['real', 'ill', 'lax', 'coy', 'prime', 'bored', 'fair'];
  }

  if (sortedBySyllables['0']) {
    delete sortedBySyllables['0'];
  }

  return sortedBySyllables;
}

function labelDetect(imagePath) {
  return client
    .labelDetection(imagePath)
    .then(results => {
      const labels = results[0].labelAnnotations;
      const arrayOfWords = [];

      labels.forEach(label => {
        arrayOfWords.push(label.description.toLowerCase());
      });

      return arrayOfWords;
    })
    .catch(err => {
      console.error('ERROR:', err);
    });
}

function webDetect(imagePath) {
  return client
    .webDetection(imagePath)
    .then(results => { 
      const webEntities = results[0].webDetection['webEntities'];
      const bestGuessLabels = results[0].webDetection['bestGuessLabels'];
      const arrayOfWords = [];
      const webWordBank = {};

      console.log('webEntities: ', webEntities);

      webEntities.forEach(entity => {
        arrayOfWords.push(entity.description.toLowerCase());
      });
      webWordBank['arrayOfWords'] = arrayOfWords;
      webWordBank['bestGuess'] = bestGuessLabels[0].label;

      // if best guess label is one word, use best guess label
      // if not use the first word in the web entities
      // if not then use the last word of the first word in best guess label
      if(bestGuessLabels[0].label.indexOf(' ') === -1) {
        webWordBank['bestGuess'] = bestGuessLabels[0].label;
      } else if (arrayOfWords[0].indexOf(' ') === -1) {
        webWordBank['bestGuess'] = arrayOfWords[0];
      } else {
        let bestGuessWordSplit = bestGuessLabels[0].label.split(' ');
        webWordBank['bestGuess'] = bestGuessWordSplit[bestGuessWordSplit.length - 1];
      }

      // return arrayOfWords; 
      return webWordBank; 
    });
}

function httpGet(url, callback) {
  let xmlHttp = new XMLHttpRequest();
  console.log('rjunning');
  xmlHttp.onreadystatechange = function() {
    if(xmlHttp.readyState == 4 && xmlHttp.status == 200) {

      console.log ('i am rest: ', xmlHttp.responseText)
      if(callback) callback(xmlHttp.responseText);
      return null;
    }

  }
  xmlHttp.open('GET', url, true);
  xmlHttp.send( null );
}

function makeRequest(method, url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.responseText);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send();
  });
}

module.exports = router;








// router.post('/:file', upload.single('avatar'), function(req, res) {
//   console.log('i entered here');
//   var contentType = req.headers['content-type'] || ''
//     , mime = contentType.split(';')[0];

//   // if (mime != 'text/plain') {
//   //   return next();
//   // }

//   var data = '';
//   req.setEncoding('utf8');
//   req.on('data', function(chunk) {
//     data += chunk;
//   });
//   req.on('end', function() {
//     req.rawBody = data;

//     console.log('req.rawBody: ', req.rawBody);
//   });

//   console.log('req.params: ', req.params);
//   console.log('req.body: ', req.body);
//   console.log('res.body: ', res.body);
//   console.log('req.fields: ', req.fields);
//   console.log('req.route: ', req.route);
//   console.log('req.file: ', req.file);

//   // res.status(200).send(req.rawBody);
//   res.status(200).send(`${req.rawBody}`);
//   // res.status(200).json({
//   //   json: request
//   // });
// });
var express = require('express');
var router = express.Router();
var Promise = require('promise');
var syllable = require('syllable');
var Sentencer = require('sentencer');
var WordPOS = require('wordpos'),
    wordpos = new WordPOS();

const vision = require('@google-cloud/vision');

const client = new vision.ImageAnnotatorClient({
  keyFilename: 'jackie-google-vision-key.json'
});

var multer = require('multer');
var upload = multer({ dest: 'public/images'});

router.post('/profile', upload.single('avatar'), function (req, res, next) {
  console.log('req.file ::', req.file);
  console.log('req.body ::', req.body);
  console.log('req.file[path]: ', req.file['path']);
  // res.status(200).send(`${req.file}`)

  const pictureFile = req.file['filename'];

  const webWordBank = webDetect(req.file['path']).then(results => {
    labelDetect(req.file['path']).then(labelResults => {
      const combinedWordBank = [...new Set(results.concat(labelResults))];
      return sortBySyllable(combinedWordBank);
    }).then(wordBank => {

      const adjectives = sortBySyllable(generateAdjectives(10));
      const mySentence1 = generateSentence(wordBank, 5, adjectives);
      const mySentence2 = generateSentence(wordBank, 7, adjectives);
      const mySentence3 = generateSentence(wordBank, 5, adjectives);

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
    title: 'HAIKU',
    pictureURL: pictureFile
  })
});

// function generateSentence(words, syllables) {
//   let sentence = '';
//   const firstAdjective = Sentencer.make("{{ adjective }}");
//   console.log('firstAdjective: ', firstAdjective);

//   const firstArray = randomKeySelector(words, syllables);
//   const firstWord = firstArray[Math.floor(Math.random() * firstArray.length)];
//   const firstWordSyllables = syllable(`${firstWord} ${firstAdjective}`);

//   const remainingSyllables = syllables - firstWordSyllables;

//   sentence += `${firstAdjective} ${firstWord}`;

//   if (remainingSyllables > 0) {
//     sentence += ` ${generateSentence(words, remainingSyllables)}`;
//   }

//   return sentence;
// }

function randomKeySelector(wordObj, maxSyllable) {
  // get keys which are all the syllables
  let keys = Object.keys(wordObj);

  // remove all syllables that are over maxSyllable
  for(let i = 0; i < keys.length; i++) {
    // console.log('parseIntKey: ', parseInt(keys[i]), 'maxSyllables: ', parseInt(maxSyllable));
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

  // console.log('words: ', words);

  const firstArray = randomKeySelector(words, syllables);
  // console.log('firstArray: ', firstArray);
  const firstArrayRandomNumber = Math.floor(Math.random() * firstArray.length);
  const firstWord = firstArray && firstArray[firstArrayRandomNumber];
  const firstWordSyllables = firstWord && syllable(firstWord);


  // this should remove the word from the word bank
  const firstWordIndex = words[firstWordSyllables] && words[firstWordSyllables].indexOf(firstWord);
  if ((firstWordIndex || firstWordIndex === 0) && (firstWordIndex !== -1)) {
    words[firstWordSyllables].splice(firstWordIndex, 1);
  }
  const remainingSyllables = syllables - firstWordSyllables;
  sentence += firstWord;
  if (remainingSyllables > 0) {
    sentence = `${generateSentence(adjectives || words, remainingSyllables)} ${sentence}`;
    // sentence = `${generateSentence(words, remainingSyllables)} ${sentence}`;
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

      webEntities.forEach(entity => {
        arrayOfWords.push(entity.description.toLowerCase());
      });
      // wordBank['bestGuess'] = bestGuessLabels[0].label;

      return arrayOfWords; 
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
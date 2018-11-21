document.addEventListener('DOMContentLoaded', function(){ 
  // your code goes here
  console.log('ready to roll');

  // let ImageFile = '';
  // document.getElementById('imageFile').addEventListener('change', loadFile, false);
  document.getElementById('myForm').addEventListener('submit', loading, false);
  document.getElementById('myForm').addEventListener('change', loadPicture, false);

  function loading() {
    console.log('loading');
    document.getElementById('loading-overlay').style.display = 'flex';
  }

  function loadPicture(e) {
    console.log('e: ', e);
    let haikuImage = document.getElementById('haiku-image');
    haikuImage.src = URL.createObjectURL(e.target.files[0]);
  }

  function fileFilter(req, file, cb) {
    console.log('file filter was run');
  }

  // function uploadPicture(e) {
  //   console.log('form: ', e);
  //   e.preventDefault();

  //   sendToBackEnd();
  // }

  // function loadFile(e) {
  //   console.log('e: ', e);
  //   let output = document.getElementById('output');
  //   output.src = URL.createObjectURL(e.target.files[0]);

  //   ImageFile = output.src;

  //   console.log('output: ', output);
  //   // console.log('output files: ', output.files[0]);
  // }

  // function sendToBackEnd() {
  //   var xhttp = new XMLHttpRequest();
  //   xhttp.onreadystatechange = function() {
  //     if (this.readyState == 4 && this.status ==200) {
  //       console.log('responseText: ', this.responseText);
  //       document.getElementById("responseLOL").innerHTML = this.responseText;
  //     }
  //   };

  //   // ImageFile = document.getElementById('imageFile').src;

  //   // let myBlobTest = new Blob(['this is my blob test'], {type : "text/plain"});
  //   // localStorage.myfile = myBlobTest;
  //   // console.log('myBlobTest: ', myBlobTest);

  //   // let formData = new FormData();
  //   // formData.append('picture', ImageFile, 'file.jpg');
  //   // // formData.append('blobText', localStorage.myfile, 'blobby.txt');
  //   // console.log('formData: ', formData);
  //   // console.log('imageFile: ', ImageFile);
  //   // // console.log('imageFile: ', ImageFile.src);

  //   xhttp.open('POST', '/file', true);
  //   // xhttp.setRequestHeader("Content-Type", "image/png");
  //   // xhttp.setRequestHeader("Content-Type", "text/plain");
  //   // xhttp.send(formData);

  //   // xhttp.send('[1, 2, 3]');
  //   xhttp.send();
  // }

}, false);
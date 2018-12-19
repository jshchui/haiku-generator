document.addEventListener('DOMContentLoaded', function(){ 
  // let ImageFile = '';
  // document.getElementById('imageFile').addEventListener('change', loadFile, false);
  document.getElementById('myForm').addEventListener('submit', loading, false);
  document.getElementById('myForm').addEventListener('change', loadPicture, false);

  function loading() {
    console.log('loading');
    document.getElementById('loading-overlay').style.display = 'flex';
  }

  function loadPicture(e) {
    let haikuImage = document.getElementById('haiku-image');
    haikuImage.src = URL.createObjectURL(e.target.files[0]);

    document.getElementById('loading-overlay').style.display = 'flex';
    document.getElementById('myForm').submit();
  }

  function fileFilter(req, file, cb) {
    console.log('file filter was run');
  }
}, false);
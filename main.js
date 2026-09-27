(function(){
 
  var ENDPOINT_URL = "https://formspree.io/f/mljdpody"

  var form = document.getElementById('quoteForm');
  var submitBtn = document.getElementById('submitBtn');
  var formMsg = document.getElementById('formMsg');
  var uploadInput = document.getElementById('photos');
  var uploadBox = document.getElementById('uploadBox');
  var uploadList = document.getElementById('uploadList');
  var selectedFiles = [];
  var isSubmitting = false;

  function setError(name, msg){
    var el = form.querySelector('[data-error-for="'+name+'"]');
    if(el) el.textContent = msg || '';
  }

  function validEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
  function validPhone(v){
    var digits = v.replace(/\D/g,'');
    return digits.length >= 10 && digits.length <= 15;
  }
  function validYear(v){
    var y = parseInt(v,10);
    var now = new Date().getFullYear();
    return /^\d{4}$/.test(v) && y >= 1950 && y <= now + 1;
  }

  function validateForm(){
    var ok = true;
    var vals = {
      fullName: form.fullName.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      vehicleYear: form.vehicleYear.value.trim(),
      vehicleModel: form.vehicleModel.value.trim(),
      serviceType: form.serviceType.value
    };

    if(!vals.fullName){ setError('fullName','Enter your full name.'); ok = false; } else setError('fullName','');
    if(!vals.phone){ setError('phone','Enter a phone number.'); ok = false; }
    else if(!validPhone(vals.phone)){ setError('phone','Enter a valid phone number.'); ok = false; }
    else setError('phone','');

    if(!vals.email){ setError('email','Enter an email address.'); ok = false; }
    else if(!validEmail(vals.email)){ setError('email','Enter a valid email address.'); ok = false; }
    else setError('email','');

    if(!vals.vehicleYear){ setError('vehicleYear','Enter the vehicle year.'); ok = false; }
    else if(!validYear(vals.vehicleYear)){ setError('vehicleYear','Enter a valid 4-digit year.'); ok = false; }
    else setError('vehicleYear','');

    if(!vals.vehicleModel){ setError('vehicleModel','Enter the make and model.'); ok = false; } else setError('vehicleModel','');
    if(!vals.serviceType){ setError('serviceType','Select a service.'); ok = false; } else setError('serviceType','');

    return ok;
  }

  // live-clear errors as the person types
  ['fullName','phone','email','vehicleYear','vehicleModel','serviceType'].forEach(function(name){
    var el = form[name];
    if(!el) return;
    el.addEventListener('input', function(){ setError(name,''); });
    el.addEventListener('change', function(){ setError(name,''); });
  });

  // file upload handling
  function renderFiles(){
    uploadList.innerHTML = '';
    selectedFiles.forEach(function(file, idx){
      var chip = document.createElement('div');
      chip.className = 'upload-chip';
      var img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      var label = document.createElement('span');
      label.textContent = file.name.length > 18 ? file.name.slice(0,15) + '…' : file.name;
      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.setAttribute('aria-label','Remove photo');
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', function(){
        selectedFiles.splice(idx,1);
        renderFiles();
      });
      chip.appendChild(img);
      chip.appendChild(label);
      chip.appendChild(removeBtn);
      uploadList.appendChild(chip);
    });
  }
  uploadInput.addEventListener('change', function(e){
    selectedFiles = selectedFiles.concat(Array.from(e.target.files || []));
    renderFiles();
  });
  ['dragover','dragenter'].forEach(function(evt){
    uploadBox.addEventListener(evt, function(e){ e.preventDefault(); uploadBox.classList.add('drag'); });
  });
  ['dragleave','drop'].forEach(function(evt){
    uploadBox.addEventListener(evt, function(e){ e.preventDefault(); uploadBox.classList.remove('drag'); });
  });
  uploadBox.addEventListener('drop', function(e){
    var dropped = Array.from((e.dataTransfer && e.dataTransfer.files) || []);
    if(dropped.length) selectedFiles = selectedFiles.concat(dropped);
    renderFiles();
  });

  function showMsg(type, text){
    formMsg.className = 'form-msg show ' + type;
    formMsg.textContent = text;
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    if(isSubmitting) return; // prevent duplicate submissions

    formMsg.className = 'form-msg';
    formMsg.textContent = '';

    if(!validateForm()){
      showMsg('error', 'Please fix the highlighted fields and try again.');
      return;
    }

    if(!ENDPOINT_URL){
      // No backend/form service connected yet — do not fake success.
      showMsg('error', 'This form isn\'t connected to a submission service yet, so nothing was sent. Please call 540-219-5891 in the meantime, or connect a form-handling endpoint to enable online requests.');
      return;
    }

    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    var formData = new FormData(form);
    selectedFiles.forEach(function(file, i){
      formData.append('photo_' + i, file);
    });

    fetch(ENDPOINT_URL, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    }).then(function(res){
      if(!res.ok) throw new Error('Submission failed');
      return res.json().catch(function(){ return {}; });
    }).then(function(){
      showMsg('success', "Thanks! Your quote request has been received. We'll review your information and get back to you shortly.");
      form.reset();
      selectedFiles = [];
      renderFiles();
    }).catch(function(){
      showMsg('error', "Something went wrong sending your request. Please try again, or call 540-219-5891 directly.");
    }).finally(function(){
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
    });
  });
})();
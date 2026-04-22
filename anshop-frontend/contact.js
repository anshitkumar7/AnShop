function submitForm(event) {
    event.preventDefault();
  
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const subject = document.getElementById("subject").value;
    const message = document.getElementById("message").value;
  
    const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
    const phonePattern = /^\+?[0-9]{10,13}$/;
  
    if (!email.match(emailPattern)) {
      alert("Please enter a valid email address.");
      return;
    }
  
    if (phone && !phone.match(phonePattern)) {
      alert("Please enter a valid phone number.");
      return;
    }
  
    if (name.length >= 3 && subject.length >= 5 && message.length >= 10) {
      document.getElementById("contactForm").reset();
      showModal();
    } else {
      alert("Please fill out all fields with valid information.");
    }
  }
  
  function showModal() {
    document.getElementById("modal").style.display = "block";
  }
  
  function closeModal() {
    document.getElementById("modal").style.display = "none";
  }
  

let usersUpload = document.querySelector('#usersUpload');



function loadingModal() {
    var modal = document.getElementById("myModal");
    var span = document.getElementsByClassName("close")[0];
    var message = document.getElementById('message');
    console.log("clicked...");
    // When the user clicks the button, open the modal 
    modal.style.display = "block";
    message.innerHTML = 'Loading...';
    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

}


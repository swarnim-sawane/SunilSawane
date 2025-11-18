document.getElementById('inquiry-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    fetch(form.action, {
        method: form.method,
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    }).then(response => {
        if (response.ok) {
            const thankYouModal = new bootstrap.Modal(document.getElementById('thankYouModal'));
            thankYouModal.show();
            form.reset();
        } else {
            alert('Oops! There was a problem submitting your form. Please try again.');
        }
    }).catch(error => {
        alert('Oops! There was a problem submitting your form. Please try again.');
    });
});




document.addEventListener('DOMContentLoaded', function () {
    function getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            email: params.get('email')
        };
    }

    const queryParams = getQueryParams();
    const emailField = document.getElementById('email-field');

    if (queryParams.email) {
        emailField.value = queryParams.email;
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const emailIdSelect = document.getElementById('emailId');

    if (emailIdSelect) {
        // Fetch emails from your backend API
        fetch('/emails', {
            headers: {
                'Accept': 'application/json' // Request JSON format
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(emails => {
            // Check if emails is an array and not empty
            if (Array.isArray(emails) && emails.length > 0) {
                emails.forEach(email => {
                    const option = document.createElement('option');
                    option.value = email.id;
                    option.textContent = email.subject;
                    emailIdSelect.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No emails found';
                option.disabled = true; // Make it unselectable
                emailIdSelect.appendChild(option);
            }
        })
        .catch(error => {
            console.error('Error fetching emails for dropdown:', error);
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Error loading emails';
            option.disabled = true;
            emailIdSelect.appendChild(option);
        });
    }
});
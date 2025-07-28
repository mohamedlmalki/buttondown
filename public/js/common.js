document.addEventListener('DOMContentLoaded', () => {
    const apiAccountSelect = document.getElementById('apiAccountSelect');
    const apiStatusIndicator = document.getElementById('apiStatusIndicator');
    const apiGuidanceMessage = document.getElementById('apiGuidanceMessage');

    // Function to update the connection status visually
    const updateApiStatus = (isConnected, message) => {
        if (apiStatusIndicator) {
            if (isConnected) {
                apiStatusIndicator.className = 'api-status connected';
                apiStatusIndicator.textContent = '● Connected';
                apiStatusIndicator.title = message;
            } else {
                apiStatusIndicator.className = 'api-status disconnected';
                apiStatusIndicator.textContent = '● Disconnected';
                apiStatusIndicator.title = message;
            }
            apiStatusIndicator.style.display = 'inline-block';
        }
    };

    // Function to check API key status
    const checkApiStatus = async (accountName) => {
        if (!accountName) {
            updateApiStatus(false, 'No API account selected.');
            return;
        }
        try {
            const response = await fetch(`/api-test/check?apiAccountName=${encodeURIComponent(accountName)}`);
            const result = await response.json();
            updateApiStatus(result.success, result.message);
        } catch (error) {
            console.error('Error checking API status:', error);
            updateApiStatus(false, 'Network error during API status check.');
        }
    };

    if (apiAccountSelect) {
        // Populate the dropdown with available API keys from a global variable (set by EJS)
        if (window.availableApiAccounts && Array.isArray(window.availableApiAccounts)) {
            window.availableApiAccounts.forEach(account => {
                const option = document.createElement('option');
                option.value = account.name;
                option.textContent = account.name;
                apiAccountSelect.appendChild(option);
            });

            const initialSelectedAccountName = localStorage.getItem('selectedApiAccount') || window.activeApiAccountName;
            
            if (initialSelectedAccountName) {
                apiAccountSelect.value = initialSelectedAccountName;
                checkApiStatus(initialSelectedAccountName);
            } else if (apiAccountSelect.options.length > 0) {
                apiAccountSelect.selectedIndex = 0;
                checkApiStatus(apiAccountSelect.value);
            }
        }

        // Event listener for dropdown change
        apiAccountSelect.addEventListener('change', (event) => {
            const selectedAccountName = event.target.value;
            localStorage.setItem('selectedApiAccount', selectedAccountName);

            // Show the guidance message
            if (apiGuidanceMessage) {
                apiGuidanceMessage.style.display = 'block';
            }
            // Disable dropdown to prevent further changes during the wait
            apiAccountSelect.disabled = true;

            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.delete('apiAccount');
            currentUrl.searchParams.set('apiAccount', selectedAccountName);

            // Delay the page reload for a few seconds so the user can read the message
            setTimeout(() => {
                window.location.href = currentUrl.toString();
            }, 3000); // 3000 milliseconds = 3 seconds
        });

        // Manual "Connect" button functionality
        const connectButton = document.getElementById('connectButton');
        if (connectButton) {
            connectButton.addEventListener('click', () => {
                checkApiStatus(apiAccountSelect.value);
            });
        }
    }
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'makeHttpRequest') {
        fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.data
        })
            .then(response => response.json())
            .then(data => sendResponse({success: true, data: data}))
            .catch(error => sendResponse({success: false, error: error.message}));
        return true;
    }
});

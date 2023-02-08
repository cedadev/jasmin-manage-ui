import Cookies from 'js-cookie';


class HttpError extends Error {
    constructor(status, statusText, responseText) {
        super(statusText);
        this.name = this.constructor.name;
        this.status = status;
        this.statusText = statusText;
        this.responseText = responseText;
    }

    json() {
        return JSON.parse(this.responseText)
    }
}


// Utility function that asynchronously waits for the specified duration
const sleep = (ms) => (new Promise(resolve => setTimeout(resolve, ms)));


const apiFetch = async (url, options) => {
    const { method = 'GET', headers = {}, data, body, ...rest } = options || {};
    // Populate the required headers for the request
    const defaultHeaders = { 'Accept': 'application/json' };
    // For POST/PUT/DELETE, declare the content type and include the CSRF token if present
    if( ['POST', 'PUT', 'DELETE'].includes(method.toUpperCase()) ) {
        defaultHeaders['Content-Type'] = 'application/json';
        const csrfToken = Cookies.get('csrftoken');
        if( csrfToken ) defaultHeaders['X-CSRFToken'] = csrfToken;
    }
    // Make the actual request, injecting the cookie credentials and headers
    const response = await fetch(url, {
        method,
        headers: { ...defaultHeaders, ...headers },
        // If data is given, encode it as JSON and use it as the request body
        // If not, use the given body
        body: data ? JSON.stringify(data) : body,
        // Always include credentials
        credentials: 'include',
        // Forward any other options that were supplied
        ...rest
    });
    // For a 204, just return
    if( response.status === 204 ) return;
    // Any other successful response should be JSON
    if( response.ok ) return await response.json();
    // An error response may not be JSON, so read the response as text
    const responseText = await response.text();
    throw new HttpError(response.status, response.statusText, responseText);
};


// Export method-specific versions of apiFetch
export default apiFetch;

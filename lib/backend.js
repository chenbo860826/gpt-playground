////////////////////////////////////////////////////////////////////////////////
// service API take both input, output and exception as json
async function servicePost(url, data, options) {
    const response = await fetch(url, {
        method: "POST",
        headers: { ...(options && options.headers), 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return await validateServiceResponse(response);
}

async function servicePut(url, data, options) {
    const response = await fetch(url, {
        method: "PUT",
        headers: { ...(options && options.headers), 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return await validateServiceResponse(response);
}

async function serviceGet(url, options) {
    const response = await fetch(url, options);
    return await validateServiceResponse(response);
}

async function serviceDelete(url, options) {
    const response = await fetch(url, { ...options, method: 'DELETE' });
    return await validateServiceResponse(response);
}

function getQueryParams() {
    const url = window.location.href;
    const paramArr = url.slice(url.indexOf('?') + 1).split('&');
    const params = {};
    paramArr.map(param => {
        const [key, val] = param.split('=');
        params[key] = decodeURIComponent(val);
    })
    return params;
};

class ServiceError extends Error {
    constructor(status, message, rawError = undefined) {
        super();
        this.name = 'ServiceError';
        this.status = status;
        this.code = message; // the code equals to message by default
        this.message = message;
        this.rawError = rawError;
    }
}

async function validateServiceResponse(response) {
    let data = await response.json();
    if (response.status != 200) {     
        throw (new ServiceError(response.status, data.message, data));
    }
    return data;
}
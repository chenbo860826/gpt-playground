import { renderField, parseField, loadModel } from './medit.js';

export function clearOutput() {
    $('#output').html('');
}

let chatMeta = {
    "name": "",
    "typeId": "chat",
    "type": "object",
    "array": true,
    "render": {
        "ignorable": true
    },
    "fields": [
        {
            "key": "title",
            "type": "string"
        },
        {
            "key": "model",
            "type": "enum",
            "options": [
                { "key": "gpt-4" },
                { "key": "gpt-4-0613" },
                { "key": "gpt-4-1106-preview" },
                { "key": "gpt-3.5-turbo" },
                { "key": "gpt-3.5-turbo-16k" }
            ]
        },
        {
            "key": "temperature",
            "type": "number"
        },
        {
            "key": "max_tokens",
            "type": "number"
        },
        {
            "key": "system",
            "type": "text"
        },
        {
            "key": "messages",
            "type": "object",
            "array": true,
            "fields": [
                {
                    "key": "role",
                    "type": "enum",
                    "options": [
                        { "key": "user" },
                        { "key": "assistant" }
                    ]
                },
                {
                    "key": "content",
                    "type": "text"
                }
            ]
        }
    ]
}

let entityList;

export async function renderChats() {
    entityList = await loadModel(`localstorage://entities/chats`, chatMeta, null, (data)=>{
        // make it backward compatible for max_tokens, and messages fields (obsolete as maxTokens, prompts)
        if(data.prompts && !data.messages) {
            data.prompts.forEach(i => {i.content = i.prompt; delete i.prompt;})
            data.messages = data.prompts;
            delete data.prompts;
        }
        if(data.maxTokens && !data.max_tokens) {
            data.max_tokens = data.maxTokens;
            delete data.maxTokens;
        }
        return data;
    });
    $('#chatEditor').append(renderField(entityList, null, { writable: true }));
    return entityList;
}

export function addPromptToContext(id, content) {
    let model = entityList.find(i => i._id == id);
    let newPrompt = model.messages.push({role: 'assistant', content});
    newPrompt.getListener().publish({ type: 'focus' })
}

export async function saveAll() {
    await entityList.save();
}

export async function resetAll() {
    await entityList.cancel();
}

let credential;
const SERVER_URL = '';
const CREDENTIAL_STORAGE_KEY = 'openaikey';

export async function login(openaiKey) {
    if (!openaiKey) {
        throw new Error('Invalid OpenAI Key');
    }
    credential = openaiKey; // update credential immediately
    window.localStorage.setItem(CREDENTIAL_STORAGE_KEY, openaiKey); // also update persisted credential
    window.location.reload();
}

export async function logout() {
    credential = undefined; // remove credential immediately
    window.localStorage.removeItem(CREDENTIAL_STORAGE_KEY); // also remove persisted credential
    window.location.reload();
}

export function isLoggedIn() {
    credential = window.localStorage.getItem(CREDENTIAL_STORAGE_KEY); // forced reload
    return !!credential;
}

export function getCredential() {
    // credential compose of 2 parts: appKey@serviceUrl
    let parts = credential.split('@');
    return { appKey: parts[0], url: parts[1] || 'https://api.openai.com/v1/chat/completions' };
}
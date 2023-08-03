import { addPromptToContext } from './util.js';
import { getCredential } from './util.js';
import { getScrollableElem } from './medit.js';

class GPTStreamParser {
    constructor() {
        this.body = '';
        this.decoder = new TextDecoder('utf-8');
    }

    feed(bytesArray) {
        this.body += this.decoder.decode(bytesArray); // append the text
        let pos = this.body.lastIndexOf('\n\n');
        if (pos >= 0) {
            const lines = this.body
                .substring(0, pos)
                .split('\n\n')
                .map(i => i.trim().replace(/^data: /, ''))
                .filter(i => i !== '' && i !== '[DONE]')
                .map(i => JSON.parse(i));
            this.body = this.body.substring(pos + 2);
            return lines;
        }
    }
}

export class ChatResponse {
    create(value, options) {
        return $('<div/>')
            .prop('mid', value._id)
            .append(
                $('<div/>')
                    .append($('<span/>').text(`${value.title} [${this.getTimeStr()}]`))
                    .append(
                        $('<button/>', { style: 'margin-left:auto;', disabled: true })
                            .text('add to prompt')
                            .click(event => getJelem(event.target, ChatResponse).wrap().addToPrompt())
                    )
                    .append(
                        $('<img/>', { src: 'pic/close.png', style: 'height: 16px; argin-left:10px; margin-left:10px; cursor:hand' })
                            .click(event => getJelem(event.target, ChatResponse).remove())
                    )
            )
            .append($('<div/>', { style: 'display:none' }))
            .append(
                $('<div/>', { style: 'background: url("pic/downArrow.png") no-repeat center; height:16px; border:1px solid gray; margin:5px; transform:none' })
                    .click((event) => getJelem(event.target, ChatResponse).wrap().switchHstory())
            )
            .append(ChatResponse.makePiece('assistant', ''))
    }

    css() {
        return {
            '': 'border: 1px solid #999999; margin: 10px 5px 10px 5px; background-color: white',
            '>div:first-child': 'background-color:#CCCCCC; display:flex; align-items:center; padding:2px; background-color:#CCCCCC;',
            '.chatPiece': 'padding: 5px 5px 5px 37px; background-repeat: no-repeat; min-height:22px; margin:5px'
        }
    }

    static makePiece(role, content) {
        let pic = role == 'user' ? 'user' : (role == 'system' ? 'info' : 'robot');
        return $('<div/>', { class: 'chatPiece', style: `background-image: url("./pic/${pic}.png")` }).text(content);
    }

    getTimeStr() {
        let date = new Date();
        return this.getAlignedStr(date.getMonth() + 1, '00') + '-' +
            this.getAlignedStr(date.getDate(), '00') + ' ' +
            this.getAlignedStr(date.getHours(), '00') + ':' +
            + this.getAlignedStr(date.getMinutes(), '00') + ':'
            + this.getAlignedStr(date.getSeconds(), '00')
    }

    getAlignedStr(str, template) {
        str = str.toString();
        return template.substring(str.length) + str;
    }

    wrap() {
        return class {
            async run(postData) {
                let outputter = this.children(':last-child');
                const start = Date.now();
                let parsedBody = '';

                // append history information
                let historyZone = outputter.prev().prev();
                historyZone.html('').append(postData.messages.map(i => ChatResponse.makePiece(i.role, i.content)));

                try {
                    // make the raw request for streaming purpose
                    let response = await fetch(`https://api.openai.com/v1/chat/completions`, {
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + getCredential()
                        },
                        body: JSON.stringify(postData)
                    });

                    if (response.status != 200) {
                        throw (new Error(await response.text()));
                    }

                    // keep reading the response stream
                    const reader = response.body.getReader();
                    let parser = new GPTStreamParser();
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) {
                            break;
                        }

                        // check if scrollable container currently at bottom (tolerant the float gap)
                        let scrollable = getScrollableElem(this.get(0));
                        let atBottom = (scrollable.scrollHeight - scrollable.scrollTop - scrollable.clientHeight) < 1;

                        let lines = parser.feed(value);
                        if (lines) {
                            parsedBody += lines.map(i => i.choices[0].delta.content).filter(i => !!i).join('');
                            outputter.text(parsedBody + '▌');
                            
                            // try to scroll to bottom 
                            if(atBottom) {
                                scrollable.scrollTop = scrollable.scrollHeight;
                            }
                        }
                    }

                    // enable the add button, finally
                    outputter.text(parsedBody);
                    this.children(':first-child').children('button').attr('disabled', false);
                }
                catch (e) {
                    outputter.text(parsedBody).append($('<div/>', { style: 'color:red' }).text(e.toString()));
                }
                this.children(':first-child').children(':first-child').append(` (${((Date.now() - start) / 1000).toFixed(1)}s)`);
            }

            async addToPrompt() {
                //console.log('addToPrompt');
                addPromptToContext(this.prop('mid'), this.children(':last-child').text());
            }

            switchHstory() {
                let switchBtn = this.children(':last-child').prev();
                let historyZone = switchBtn.prev();
                let switchBtnDown = switchBtn.css('transform') != 'none';
                switchBtn.css('transform', switchBtnDown ? '' : 'rotate(180deg)');
                historyZone.css('display', switchBtnDown ? 'none' : 'block');
            }
        }
    }
}
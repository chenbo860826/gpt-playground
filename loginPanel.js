import { login } from './util.js';

export class LoginPanel {
    create(gameUri) {
        // create the panel
        let panel = $('<dialog/>', { style: 'display:flex; flex-direction: column; width:400px; overflow:hidden' })
            .append($('<div/>', { style: 'display: none; align-items: center; justify-content: center; background-color: #f50057; color: white' }))
            .append($('<div/>', { style: '' }).text('OpenAI Key'))
            .append($('<input/>'))
            .append($('<button/>', { style: '' }).text('Log In').click((event) => getJelem(event.target).wrap().login()))
            .on('close', (event) => getJelem(event.target).remove()) // remove itself when closed

        // then return the panel
        return panel;
    }

    css() {
        return {
            '': 'font-size: 14px; font-weight: bold; border: 0; border-radius: 10px; padding: 20px; box-shadow: 0 2px 15px 0 rgba(0, 0, 0, 0.1);',
            '::backdrop': 'background: rgba(0, 0, 0, 0.7)',
            'div': 'height: 30px; display: flex; align-items: end',
            'input': 'font-size: 16px; height: 30px',
            'button': 'border: 1px solid gray; border-radius: 3px; height:30px; font-size: 16px; margin-top: 30px'
        }
    }

    wrap() {
        return class {
            show() {
                $(document.body).append(this);
                this.get()[0].showModal();
            }

            close() {
                this.get()[0].close();
            }

            async login() {
                let inputs = this.children('input');
                let openaiKey = inputs[0].value.trim();

                try {
                    await login(openaiKey);
                    this.close(); // simply close itself, and make user operatable
                }
                catch (e) {
                    this.children(':first-child').css('display', '').text(e.message);
                }
            }
        }
    }
}
import { registerFieldHandler, renderObject, parseObject, getObjectLabel, CSS } from './medit.js';
import { ChatResponse } from './chatResponse.js';

class ChatContext {
  create(meta, value, options) {
    return $('<div/>')
      .prop('meta', meta)
      .prop('entity', value)
      .append(renderObject(meta, value, Object.assign({}, options, { model: null })))
      .append($('<div/>', { style: 'white-space: pre-wrap' }))
      .append($('<div/>', { style: 'text-align: right; padding: 2px;' })
        .append($('<button/>', { class: CSS.BUTTON_H2H, style: 'padding-left:20px; padding-right: 20px; background-color: #00CC00' })
          .text('try')
          .click((event) => getJelem(event.target).wrap().test())
        )
      )
  }

  shortcuts(containerJelem, jelem) {
    containerJelem.append($('<button/>', { class: CSS.BUTTON_H2H, style: 'padding-left:20px; padding-right: 20px; background-color: #00CC00' })
      .text('try')
      .mousedown(() => jelem.wrap().test())
    )
  }

  wrap() {
    return class {
      parse() {
        return parseObject(this.children(':first-child').get(0), this.prop('meta'));
      }

      async test() {
        let entity = this.prop('entity');
        let messages = entity.messages.map(i => ({ role: i.role, content: i.content }));
        if(entity.system) {
          messages.unshift({ role: 'system', content: entity.system });
        }
        let responseJelem = createJelem(ChatResponse, entity).appendTo($('#output'));
        responseJelem.get(0).scrollIntoView(); // focus the new ChatResponse
        await responseJelem.wrap().run({
          model: entity.model,
          stream: true,
          temperature: entity.temperature !== null ? entity.temperature : undefined, // 0 shall be allowed
          max_tokens: entity.max_tokens || undefined,
          messages
        });
      }
    }
  }
}

registerFieldHandler('chat', ChatContext);
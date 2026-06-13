import { createElement, nest, component } from "../framework/index.js";

const Card = component({
    render: (props) => {
        const cardElement = createElement('div', { className: 'card'});
        nest(cardElement, props.title);
        return cardElement;
    }
})

const cardInstance = Card({ title: 'hello-dot.js' });

cardInstance.mount(document.getElementById('app'));

setTimeout(() => {
    cardInstance.__update({ title: 'Updated title' });
}, 2000);
const propertyList = new Set([ 'value', 'checked', 'selected', 'disabled', 'textContent']);
let weakMap = new WeakMap();

export const createElement = (tagName, props = {}) => {
    if (props === null) {
        props = {};
    }

    const newElement = document.createElement(tagName);
    
    for (const key in props) {
        if (!Object.hasOwn(props, key)) continue;
        
        if (key === 'events') {
            // INTEGRATION (B): delegate to bindEvents(newElement, props.events) from events.js
            // props.events shape: { eventName: handler }  OR  { eventName: { handler, delegate, prevent, stop } }
            // Do NOT use addEventListener directly — all event registration goes through bindEvents/on
            // bindEvents returns a cleanup fn; listener teardown on unmount relies on B's MutationObserver (see component.js unmount)
            // TODO Day 2: import bindEvents and wire this in
        }

        else if (key === 'style') {
            for (const styleKey in props.style) {
                newElement.style[styleKey] = props.style[styleKey];
            }
        }
        
        else if (key === 'className') {
            newElement.className = props[key];
        }

        else if (propertyList.has(key)) {
            newElement[key] = props[key];
        }

        else { newElement.setAttribute(key, props[key]) };
    }

    return newElement;
}

export const nest = (parentElement, ...children) => {
    const flatChildArray = children.flat();

    for (const element of flatChildArray) {
        if (element === null || element === undefined) {
            continue;
        }
        else if (typeof element === 'string') {
            parentElement.append(document.createTextNode(element));
        }
        else if (element instanceof Element) {
            parentElement.appendChild(element);
        }
        else {
            throw new Error("nest() received an unsupported child type: " + element);
        }
    };

    return parentElement;
}
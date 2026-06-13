import { onMount as observeMount, onDestroy as observeDestroy } from './events.js';

export const component = (definition) => {
    
    const render = definition.render;
    const onMount = definition.onMount;
    const onDestroy = definition.onDestroy;

    return (props = {}) => {

        if (props === null) { props = {} };

        const instance = {
            __props: props,
            element: render(props),

            // LIFECYCLE: the definition's onMount/onDestroy are the PUBLIC API.
            // Developers never call B's element-level onMount/onDestroy (events.js) directly.
            // We register them with B's observer here, keyed on the element. The observer:
            //   - fires onMount when the node actually enters the document
            //   - fires onDestroy AND calls offAll (listener cleanup) when the node leaves
            // Registering through B's onMount/onDestroy also calls ensureObserver(), which
            // guarantees the observer is active — this is what makes unmount()'s cleanup work.

            mount(container) {
                if (onMount) { observeMount(this.element, onMount) };
                if (onDestroy) { observeDestroy(this.element, onDestroy) };
                container.appendChild(this.element);
            },

            // CLEANUP DEPENDENCY (B): we do NOT call onDestroy or offAll here.
            // B's MutationObserver fires onDestroy and calls offAll automatically on node removal.
            // The observer is guaranteed active because mount() registered via B's onMount/onDestroy.
            // Calling onDestroy here too would double-fire it.
            unmount() {
                this.element.remove();
            },

            __update(newProps) {
                this.__props = { ...this.__props, ...newProps};
                const newElement = render(this.__props);
                this.element.replaceWith(newElement);
                this.element = newElement;
                // TODO Day 3 (A): replace crude full re-render above with vDOM diff/patch.
                // REACTIVE WIRING (A-owned): this slot is the target of
                //   store.subscribe(key, () => instance.__update(...)).
                // Subscription is set up in mount() and torn down in unmount(), using B's subscribe primitive.
                // Store stays component-agnostic; all component awareness lives here.

            }
        }

        return instance;
    }
}
export const component = (definition) => {
    
    const render = definition.render;
    const onMount = definition.onMount;
    const onDestroy = definition.onDestroy;

    return (props = {}) => {

        if (props === null) { props = {} };

        const instance = {
            __props: props,
            element: render(props),

            mount(container) {
                container.appendChild(this.element);
                if (onMount) { onMount() };
            },

            unmount() {
                if (onDestroy) { onDestroy() };
                this.element.remove();
            },

            __update(newProps) {
                this.__props = { ...this.__props, ...newProps};
                const newElement = render(this.__props);
                this.element.replaceWith(newElement);
                this.element = newElement;
            }
        }

        return instance;
    }
}
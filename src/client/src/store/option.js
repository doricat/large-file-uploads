const initOption = "init_option";
const setOption = "set_option";
const localStorageKeyName = "requestModel";

const initState = {
    model: null
};

const actions = {
    initOption: (model) => ({
        type: initOption,
        payload: { model }
    }),
    setOption: (model) => ({
        type: setOption,
        payload: { model }
    })
};

const reducer = (state = initState, action) => {
    if (action.type === initOption || action.type === setOption) {
        if (!window.localStorage) {
            throw new Error();
        }

        let model = action.payload.model;
        if (action.type === initOption) {
            const current = window.localStorage.getItem(localStorageKeyName);
            if (!current || current < 1 || current > 3) {
                window.localStorage.setItem(localStorageKeyName, model);
            } else {
                model = Number.parseInt(current);
            }
        } else {
            window.localStorage.setItem(localStorageKeyName, model);
        }

        return { ...state, model: model };
    }

    return state;
};

export { actions, reducer, localStorageKeyName };
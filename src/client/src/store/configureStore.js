import { applyMiddleware, compose, createStore } from 'redux';
import { createRootReducer } from './reducers';
import thunk from 'redux-thunk';
import { createLogger } from 'redux-logger';

const middleware = [thunk];
if (process.env.NODE_ENV !== 'production') {
    middleware.push(createLogger())
}

function configureStore(preloadedState) {
    const store = createStore(
        createRootReducer(),
        preloadedState,
        compose(
            applyMiddleware(
                ...middleware
            )
        )
    );

    return store
};

export { configureStore };
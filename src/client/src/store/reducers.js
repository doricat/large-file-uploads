import { combineReducers } from 'redux';
import { reducer } from './file';

const createRootReducer = () => combineReducers({
    file: reducer
});

export { createRootReducer };
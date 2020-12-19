import { combineReducers } from 'redux';
import { reducer as fileReducer } from './file';
import { reducer as optionReducer } from './option';

const createRootReducer = () => combineReducers({
    file: fileReducer,
    option: optionReducer
});

export { createRootReducer };
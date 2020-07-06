const beginBlockUploading = "begin_block_uploading";
const endBlockUploading = "end_block_uploading";
const dispatchFileInfo = "dispatch_file_info";
const removeFile = "remove_file";
const setLatestId = "set_latest_id";

const initState = {
    fileInfo: null,
    blocks: [],
    latestId: null
};

const actions = {
    dispatchFileInfo: (name, size, type, blockSize) => ({
        type: dispatchFileInfo,
        payload: {
            name,
            size,
            type,
            blockSize
        }
    }),
    removeFile: () => ({ type: removeFile }),
    beginBlockUploading: (id) => ({ type: beginBlockUploading, payload: { id } }),
    endBlockUploading: (id) => ({ type: endBlockUploading, payload: { id } }),
    setLatestId: (id) => ({ type: setLatestId, payload: { id } })
};

const reducer = (state = initState, action) => {
    if (action.type === dispatchFileInfo) {
        let count = Math.floor(action.payload.size / action.payload.blockSize);
        if (action.payload.size % action.payload.blockSize !== 0) {
            count++;
        }
        const blocks = [];
        for (let i = 0; i < count; i++) {
            blocks.push({ state: null });
        }
        return { ...state, fileInfo: action.payload, blocks: blocks };
    }

    if (action.type === removeFile) {
        return { ...state, fileInfo: null, blocks: [] };
    }

    if (action.type === beginBlockUploading) {
        let blocks = [...state.blocks];
        blocks[action.payload.id] = "begin";
        return { ...state, blocks };
    }

    if (action.type === endBlockUploading) {
        let blocks = [...state.blocks];
        blocks[action.payload.id] = "end";
        return { ...state, blocks };
    }

    if (action.type === setLatestId) {
        return { ...state, latestId: action.payload.id };
    }

    return state;
};

export { actions, reducer };
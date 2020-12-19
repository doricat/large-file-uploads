import React, { useState, useRef, useEffect } from 'react';
// import jsSHA from 'jssha';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../store/file';
import * as signalR from '@microsoft/signalr';

const blockSize = 1024 * 1024 * 5;

let connectionId = null;

const taskStates = {
    uploading: 0,
    paused: 1,
    canceled: 2,
    completed: 3
};

// block = {
//     id: number,
//     offset: number
// }

class TaskData {
    constructor(model) {
        if (model < 1 || model > 3) {
            throw new Error();
        }

        this.#uploadModel = model;
        if (this.#uploadModel === 1) {
            this.#concurrenceCount = 1;
        }

        if (this.#uploadModel === 2 || this.#uploadModel === 3) {
            this.#concurrenceCount = 5; // FIXME
        }
    }

    state = null;
    buffer = null;
    fileId = null;
    blocks = [];
    fetchCount = 0;
    #blocks = undefined;
    #blockReadIndex = 0;
    #uploadModel = undefined;
    #concurrenceCount = undefined;

    getBlock() {
        if (this.fetchCount < this.#concurrenceCount && this.#blockReadIndex < this.blocks.length) {
            const index = this.#blockReadIndex++;
            this.fetchCount++;

            if (this.#uploadModel === 1 || this.#uploadModel === 2) {
                return this.blocks[index];
            }

            if (this.#uploadModel === 3) {
                if (this.#blocks === undefined) {
                    this.randomizeBlocks();
                }

                return this.#blocks[index];
            }
        }

        return null;
    }

    randomizeBlocks() {
        this.#blocks = [];
        this.blocks.map(x => this.#blocks.push(x));

        for (let i = 0; i < this.#blocks.length; i++) {
            const element = this.#blocks[i];
            const j = this.getRandomInt(i, this.#blocks.length);
            this.#blocks[i] = this.#blocks[j];
            this.#blocks[j] = element;
        }
    }

    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    initBlocks(blockSize) {
        let count = Math.floor(this.buffer.byteLength / blockSize);
        if (this.buffer.size % blockSize !== 0) {
            count++;
        }

        let offset = 0;
        for (let i = 0; i < count; i++) {
            this.blocks.push({
                id: i,
                offset: offset
            });

            offset += blockSize;
        }
    }
}

let taskData = undefined;
function resetTaskData(model) {
    taskData = new TaskData(model);
}

let headers = {};
headers["Content-Type"] = "application/json";

function arrayBufferToBase64(buffer) {
    let binary = "";
    let bytes = new Uint8Array(buffer);
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

const UploadForm = () => {
    const [file, setFile] = useState(null);
    const [taskState, setTaskState] = useState(null);
    const fileInput = useRef(null);
    const dispatch = useDispatch();
    const model = useSelector(state => state.option.model);

    useEffect(() => {
        let connection = new signalR.HubConnectionBuilder()
            .withUrl("/api/notification_hub")
            .configureLogging(signalR.LogLevel.Information)
            .build();

        connection.on("ReceiveBlockId", args => {
            if (taskData.state === taskStates.canceled) {
                return;
            }

            const id = args.blockId;
            dispatch(actions.endBlockUploading(id));

            if (args.latest === true) {
                taskData.state = taskStates.completed;
                setTaskState(taskStates.completed);
                dispatch(actions.setLatestId(taskData.fileId));
            }
        });

        connection.start().then(() => {
            connectionId = connection.connectionId;
        });

        return () => connection.stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const change = (evt) => {
        const files = evt.target.files;
        if (files.length === 0) {
            setFile(null);
            dispatch(actions.removeFile());
            return;
        }

        const file = files[0];
        setFile(file);
        dispatch(actions.dispatchFileInfo(file.name, file.size, file.type, blockSize));
    };

    const removeSelected = () => {
        setTaskState(null);
        setFile(null);
        fileInput.current.value = null;
        dispatch(actions.removeFile());
    };

    const upload = async () => {
        resetTaskData(model);
        taskData.state = taskStates.uploading;
        setTaskState(taskStates.uploading);

        let response = await fetch(`/api/files/${connectionId}`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                filename: file.name,
                size: file.size,
                contentType: file.type
            })
        });

        if (!response.ok) {
            console.error(response);
            throw new Error();
        }

        const json = await response.json();

        const fileReader = new FileReader();
        fileReader.readAsArrayBuffer(file);
        fileReader.onloadend = function () {
            if (this.readyState === FileReader.DONE) {
                taskData.buffer = fileReader.result;
                taskData.fileId = json.id;
                taskData.initBlocks(blockSize);
                doUpload(taskData);
            }
        };
    };

    const doUpload = (state) => {
        if (connectionId === null) {
            throw new Error();
        }

        let block = null;
        while ((block = state.getBlock()) !== null) {
            dispatch(actions.beginBlockUploading(block.id));
            const buffer = state.buffer.slice(block.offset, block.offset + blockSize);
            const base64 = arrayBufferToBase64(buffer);
            fetch(`/api/files/${state.fileId}`, {
                method: "PATCH",
                headers: headers,
                body: JSON.stringify({
                    fileStream: base64,
                    id: block.id,
                    offset: block.offset
                })
            }).then(response => {
                if (!response.ok) {
                    console.error(response);
                    throw new Error();
                }

                state.fetchCount--;
                if (state.state !== taskStates.paused && state.state !== taskStates.canceled) {
                    doUpload(state);
                }
            });
        }
    };

    const pause = () => {
        if (taskData.state === taskStates.uploading) {
            taskData.state = taskStates.paused;
            setTaskState(taskStates.paused);
        } else if (taskData.state === taskStates.paused) {
            taskData.state = taskStates.uploading;
            setTaskState(taskStates.uploading);
            doUpload(taskData);
        }
    };

    const cancel = () => {
        taskData.state = taskStates.canceled;
        setTaskState(taskStates.canceled);
        removeSelected();
        // TODO 删除服务器文件
    };

    const hasFile = file !== null;
    const filename = hasFile ? file.name : "选择文件";
    const running = taskState === taskStates.uploading || taskState === taskStates.paused;
    const btnContent = taskState === taskStates.paused ? "继续" : "暂停";

    return (
        <form>
            <div className="input-group mb-3">
                <div className="custom-file">
                    <input type="file"
                        className="custom-file-input"
                        id="inputGroupFile02"
                        onChange={change}
                        ref={fileInput}
                        disabled={running}
                    />
                    <label className="custom-file-label" htmlFor="inputGroupFile02">{filename}</label>
                </div>
                <div className="input-group-append">
                    <button type="button" className="btn btn-secondary" onClick={removeSelected} disabled={!hasFile || running}>移除</button>
                    <button type="button" className="btn btn-primary" onClick={upload} disabled={!hasFile || taskState !== null}>上传</button>
                    <button type="button" className="btn btn-primary" onClick={pause} disabled={!hasFile || !running}>{btnContent}</button>
                    <button type="button" className="btn btn-primary" onClick={cancel} disabled={!hasFile || !running}>取消</button>
                </div>
            </div>
        </form>
    );
};

export { UploadForm };
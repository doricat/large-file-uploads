import React, { useState, useRef, useEffect } from 'react';
// import jsSHA from 'jssha';
import { useDispatch } from 'react-redux';
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

let taskData = {};
function resetTaskData() {
    taskData = {
        state: null,
        buffer: null,
        index: 0,
        blockId: 0,
        fileId: null
    }
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

            if (args.last === true) {
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

        setFile(files[0]);
        dispatch(actions.dispatchFileInfo(files[0].name, files[0].size, files[0].type, blockSize));
    };

    const removeSelected = () => {
        setTaskState(null);
        setFile(null);
        fileInput.current.value = null;
        dispatch(actions.removeFile());
    };

    const upload = async () => {
        resetTaskData();
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
        fileReader.onloadend = async function () {
            if (this.readyState === FileReader.DONE) {
                taskData.buffer = fileReader.result;
                taskData.fileId = json.id;
                await doUpload(taskData);
            }
        };
    };

    const doUpload = async (state) => {
        if (connectionId === null) {
            throw new Error();
        }

        for (let i = state.index, blockId = state.blockId; i < state.buffer.byteLength; i += blockSize, blockId++) {
            dispatch(actions.beginBlockUploading(blockId));
            let block = state.buffer.slice(i, i + blockSize);
            // const hash = new jsSHA("SHA-1", "ARRAYBUFFER", { numRounds: 1 });
            // hash.update(block);
            // const sha1 = hash.getHash("HEX");
            let base64 = arrayBufferToBase64(block);
            let response = await fetch(`/api/files/${state.fileId}`, {
                method: "PATCH",
                headers: headers,
                body: JSON.stringify({
                    fileStream: base64,
                    id: blockId,
                    offset: i
                })
            });

            if (!response.ok) {
                console.error(response);
                throw new Error();
            }

            if (taskData.state === taskStates.paused) {
                taskData.index = i += blockSize;
                taskData.blockId = ++blockId;
                break;
            }

            if (taskData.state === taskStates.canceled) {
                break;
            }
        }
    };

    const pause = async () => {
        if (taskData.state === taskStates.uploading) {
            taskData.state = taskStates.paused;
            setTaskState(taskStates.paused);
        }
        else if (taskData.state === taskStates.paused) {
            taskData.state = taskStates.uploading;
            setTaskState(taskStates.uploading);
            await doUpload(taskData);
        }
    };

    const cancel = () => {
        taskData.state = taskStates.canceled;
        setTaskState(taskStates.canceled);
        removeSelected();
        // TODO 删除文件
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
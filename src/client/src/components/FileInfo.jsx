import React from 'react';
import { useSelector } from 'react-redux';

const FileInfo = () => {
    const fileInfo = useSelector(state => state.file.fileInfo);

    if (fileInfo) {
        return (
            <table className="table table-bordered">
                <tbody>
                    <tr>
                        <th scope="row">文件名</th>
                        <td>{fileInfo.name}</td>
                        <th scope="row">大小</th>
                        <td>{fileInfo.size} bytes</td>
                        <th scope="row">类型</th>
                        <td>{fileInfo.type}</td>
                    </tr>
                </tbody>
            </table>
        );
    }

    return null;
};

export { FileInfo };
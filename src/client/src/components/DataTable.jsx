import React, { useEffect, useState } from 'react';
import { Table } from 'reactstrap';

const DataTable = (props) => {
    const [state, setState] = useState([]);
    useEffect(() => {
        async function fetchData() {
            const response = await fetch(`/api/files`, {
                method: "GET",
            });

            if (response.ok === true) {
                const json = await response.json();
                setState(json);
            }
            else {
                throw new Error();
            }
        }

        fetchData();
    }, [props.id]);

    const rows = state.map(x => {
        const link = `/api/files/${x.id}`;
        return (
            <>
                <tr key={x.id}>
                    <td><a href={link} target="_blank" rel="noopener noreferrer">{x.rawName}</a></td>
                    <td>{x.size}</td>
                    <td>{x.contentType}</td>
                    <td>{x.createdAt}</td>
                </tr>
            </>
        )
    });

    return (
        <>
            <Table striped>
                <thead>
                    <tr>
                        <th>文件名</th>
                        <th>大小</th>
                        <th>类型</th>
                        <th>上传时间</th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </Table>
        </>
    );
};

export { DataTable };
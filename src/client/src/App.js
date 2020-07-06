import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { InputGroup, Button } from 'reactstrap';
import { DataTable } from './components/DataTable';
import { UploadModal } from './components/UploadModal';
import { useSelector } from 'react-redux';

function App() {
    const [modal, setModal] = useState(false);
    const fileId = useSelector(state => state.file.latestId);

    const toggle = () => {
        setModal(!modal);
    };

    return (
        <Layout>
            <InputGroup className="mb-3">
                <Button color="primary" onClick={toggle}>上传</Button>
            </InputGroup>

            <DataTable id={fileId} />
            <UploadModal modal={modal} toggle={toggle} />
        </Layout>
    );
}

export { App };

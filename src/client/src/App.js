import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { InputGroup, Button } from 'reactstrap';
import { DataTable } from './components/DataTable';
import { UploadModal } from './components/UploadModal';
import { OptionModal } from './components/OptionModal';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from './store/option';

function App() {
    const [uploadModal, setUploadModal] = useState(false);
    const [optionModal, setOptionModal] = useState(false);
    const fileId = useSelector(state => state.file.latestId) ?? '';
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(actions.initOption(1));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleUploadModal = () => {
        setUploadModal(!uploadModal);
    };

    const toggleOptionModal = () => {
        setOptionModal(!optionModal);
    };

    return (
        <Layout>
            <InputGroup className="mb-3">
                <Button color="primary" onClick={toggleUploadModal}>上传</Button>
                <Button color="secondary" onClick={toggleOptionModal}>设置</Button>
            </InputGroup>

            <DataTable id={fileId} />
            <UploadModal modal={uploadModal} toggle={toggleUploadModal} />
            <OptionModal modal={optionModal} toggle={toggleOptionModal} />
        </Layout>
    );
}

export { App };

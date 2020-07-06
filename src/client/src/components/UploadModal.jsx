import React from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { UploadForm } from './UploadForm';
import { FileInfo } from './FileInfo';
import { Progress } from './Progress';
import { useDispatch } from 'react-redux';
import { actions } from '../store/file';

const UploadModal = ({ modal, toggle }) => {
    const dispatch = useDispatch();
    const closeModal = () => {
        toggle();
        dispatch(actions.removeFile());
    };

    return (
        <>
            <Modal isOpen={modal}
                toggle={closeModal}
                backdrop="static"
                keyboard={false}
                className="modal-content modal-xl">
                <ModalHeader toggle={closeModal}>上传</ModalHeader>
                <ModalBody>
                    <UploadForm />
                    <FileInfo />
                    <Progress />
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={closeModal}>关闭</Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export { UploadModal };
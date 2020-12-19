import React, { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../store/option';

const OptionModal = ({ modal, toggle }) => {
    const [selected, setSelected] = useState(null);
    const model = useSelector(state => state.option.model);
    const dispatch = useDispatch();

    useEffect(() => {
        setSelected(model);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [model]);

    const closeModal = () => {
        toggle();
    };

    const saveChanges = () => {
        dispatch(actions.setOption(selected));
        toggle();
    };

    const active = (value) => {
        return selected === value;
    };

    const setColor = (value) => {
        return active(value) ? "primary" : "light";
    };

    return (
        <>
            <Modal isOpen={modal}
                toggle={closeModal}
                backdrop="static"
                keyboard={false}
                className="modal-content">
                <ModalHeader toggle={closeModal}>上传设置</ModalHeader>
                <ModalBody>
                    <ButtonGroup>
                        <Button color={setColor(1)} onClick={() => setSelected(1)} active={active(1)}>顺序单请求</Button>
                        <Button color={setColor(2)} onClick={() => setSelected(2)} active={active(2)}>顺序多请求</Button>
                        <Button color={setColor(3)} onClick={() => setSelected(3)} active={active(3)}>乱序多请求</Button>
                    </ButtonGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={saveChanges}>保存</Button>
                    <Button color="secondary" onClick={closeModal}>关闭</Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export { OptionModal };
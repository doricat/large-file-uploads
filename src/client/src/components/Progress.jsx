import React from 'react';
import './Progress.css';
import { useSelector } from 'react-redux';

const Progress = () => {
    const blocks = useSelector(state => state.file.blocks);

    if (blocks.length === 0) {
        return null;
    }

    const elements = [];
    for (let i = 0; i < blocks.length; i++) {
        const state = blocks[i];
        let className = "box";
        if (state) {
            if (state === "begin") {
                className += " uploading";
            } else if (state === "end") {
                className += " success";
            }
        }
        elements.push(<div className={className} key={i}></div>);
    }

    return (
        <>
            <div className="wrapper">
                {elements}
            </div>
        </>
    );
};

export { Progress };
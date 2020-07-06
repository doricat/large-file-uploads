import React, { useState } from 'react';
import { Collapse, Container, Navbar, NavbarBrand, NavbarToggler } from 'reactstrap';
import './NavMenu.css';

const NavMenu = () => {
    const [collapsed, setState] = useState(true);

    return (
        <header>
            <Navbar className="navbar-expand-sm navbar-toggleable-sm ng-white border-bottom box-shadow mb-3" light>
                <Container>
                    <NavbarBrand to="/">Example</NavbarBrand>
                    <NavbarToggler onClick={() => setState(!collapsed)} className="mr-2" />
                    <Collapse className="d-sm-inline-flex flex-sm-row-reverse" isOpen={!collapsed} navbar>
                        <ul className="navbar-nav flex-grow">
                        </ul>
                    </Collapse>
                </Container>
            </Navbar>
        </header>
    );
};

export { NavMenu };
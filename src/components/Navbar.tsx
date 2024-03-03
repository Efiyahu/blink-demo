import KlipsLogo from '../assets/klips-ligh-desktop.svg';

import React from 'react';

const Navbar = () => {
  return (
    <div className="navbar">
      <img className="logo" src={KlipsLogo} alt="klips-logo" />
      <h1 className="title">Payment Verification</h1>
    </div>
  );
};

export default Navbar;

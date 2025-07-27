import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Header.css";

const Header = ({ userName, onLogout }) => {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(window.scrollY);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 10) {
        setVisible(true);
        lastScrollY.current = window.scrollY;
        return;
      }
      if (window.scrollY > lastScrollY.current) {
        setVisible(false); // scrolling down
      } else {
        setVisible(true); // scrolling up
      }
      lastScrollY.current = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`header dashboard-header${visible ? "" : " header-hidden"}`}> 
      <div className="header-content" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="header-logo">
            <span className="logo-text">saha<span style={{ color: '#43e97b' }}>YOG</span></span>
          </div>
          {userName && (
            <div className="header-welcome">
              Welcome, {userName}!
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {userName ? (
            <button className="header-logout" onClick={onLogout}>Logout</button>
          ) : (
            <>
              <Link to="/login" className="header-link">Login</Link>
              <Link to="/register" className="header-link">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

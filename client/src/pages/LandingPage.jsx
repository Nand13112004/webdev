import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-bg">
      <div className="landing-container">
        <nav className="landing-navbar">
          <div className="landing-logo">
            <span className="logo-icon">
              <span className="logo-color1"></span>
              <span className="logo-color2"></span>
              <span className="logo-color3"></span>
            </span>
            <span className="logo-text">sahaYOG</span>
          </div>
          <ul className="landing-navlinks">
            <li onClick={() => navigate("/login")}>LOGIN</li>
            <li onClick={() => navigate("/register")}>SIGN UP</li>
            
            
          </ul>
        </nav>
        <div className="landing-content">
          <div className="landing-left">
            <h2>
              Subscribe Now <br />
              <span className="newsletter-blue">to Our Newsletter</span>
            </h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum
              suspendisse ultrices gravida. Risus commodo viverra maecenas
              accumsan lacus vel facilisis.
            </p>
            <div className="landing-url">www.graphicsfamily.com</div>
          </div>
          <div className="landing-right">
            <div className="landing-image-bg">
              <img
                src="https://img.freepik.com/free-photo/businessman-working-office_23-2148170208.jpg?w=740"
                alt="Newsletter"
                className="landing-image"
              />
              <div className="landing-shape"></div>
              <div className="landing-shape-outline"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

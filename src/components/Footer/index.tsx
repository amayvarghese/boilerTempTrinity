import React from "react";
import LOGO from "../../assets/.png";
import Icons from "../Icons";

const Footer = () => {
  return (
    <>
      <div className="bg-black grid gap-5 ">
        <div className=" flex md:flex-row flex-col justify-between text-white items-center lg:px-20 px-10 py-10 border-b border-white ">
          {/* <img src={LOGO} alt="" /> */}

          <div className=" gap-10 flex  ">
            <div className="flex flex-col mt-px max-md:mt-12">
              <a href="..." className="text-white text-opacity-70 text-xs">
                Product
              </a>
              <a href="..." className="text-white tracking-normal text-lg mt-8">
                Features
              </a>
              <a href="..." className="text-white tracking-normal text-lg mt-7">
                Benefits
              </a>
              <a
                href="..."
                className="text-white tracking-normal text-base mt-7"
              >
                Try Now
              </a>
            </div>
            <div className="flex flex-col mt-px max-md:mt-12">
              <a href="..." className="text-white text-opacity-70 text-xs">
                Explore
              </a>
              <a
                href="..."
                className="text-white tracking-normal text-base mt-8"
              >
                Events
              </a>
              <a href="..." className="text-white tracking-normal text-lg mt-7">
                Blog
              </a>
            </div>
            <div className="flex flex-col max-md:mt-12">
              <a href="..." className="text-white text-opacity-70 text-xs">
                Company
              </a>
              <a href="..." className="text-white tracking-normal text-lg mt-8">
                About us
              </a>
              <a
                href="..."
                className="text-white tracking-normal text-base mt-7"
              >
                Contact us
              </a>
            </div>
          </div>
        </div>
        <div className="text-white flex md:flex-row flex-col justify-between w-full p-10 items-center ">
          <div className=" flex md:gap-10 gap-2 md:flex-row flex-col max-md:text-center ">
            <div>© 2023 All right reserved.</div>
            <div>Privacy Policy</div>
            <div>Terms of Service</div>
          </div>
          <div className=" flex gap-4 items-center justify-center ">
            <Icons variant="Youtube" Link="https://www.youtube.com" />
            <Icons variant="Twitter" Link="https://www.twitter.com" />
            <Icons variant="LinkedIn" Link="https://www.linkedin.com" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Footer;

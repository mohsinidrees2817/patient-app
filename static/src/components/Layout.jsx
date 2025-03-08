import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout = ({ children }) => {
  return (
    <div className="flex relative bg-[#f2f3f4]">
      <Sidebar />
      <div className="flex-1   ">
        <div className="static w-full">
          <Header />
        </div>
        <div className="mt-4 py-6 mx-4 px-4 bg-white rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;

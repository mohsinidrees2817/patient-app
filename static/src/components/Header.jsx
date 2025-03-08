"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { id: 1, name: "Dashboard", path: "/" },
  { id: 2, name: "History", path: "/history/" }, 
];

const Header = () => {
  const pathname = usePathname();

  return (
    <div className="shadow-sm shadow-[#f2f3f4]">
      <div className="flex justify-between items-center   w-full bg-white py-3 px-8">
        <div className="flex items-center space-x-2 w-full ">
          {tabs.map((tab) => (
            <Link key={tab.id} href={tab.path} className="">
              <span
                className={`px-2
                  ${
                    pathname === tab.path
                      ? "text-sm font-medium text-[#1e7be7] cursor-pointer  border-b-3 border-[#1e7be7] py-4.5"
                      : "text-sm font-medium text-black cursor-pointer py-4"
                  }
                `}
              >
                {tab.name}
              </span>
            </Link>
          ))}
        </div>
        <div className="flex items-center space-x-6 mr-4 ">
          <p className="font-light text-sm ">Notifications</p>{" "}
          <img
            className="size-8 rounded-full"
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt=""
          />
        </div>
      </div>
    </div>
  );
};

export default Header;

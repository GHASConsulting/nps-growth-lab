import React from "react";
import Header from "./Header";
import SecondaryNav from "./SecondaryNav";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SecondaryNav />
      <main>{children}</main>
    </div>
  );
};

export default Layout;

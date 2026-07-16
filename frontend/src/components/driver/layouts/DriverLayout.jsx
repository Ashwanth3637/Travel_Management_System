import { Outlet } from "react-router-dom";
import DriverNavbar from "../driver/DriverNavbar";
import DriverSidebar from "../driver/DriverSidebar";

const DriverLayout = () => {
    return (
        <div className="app-container" style={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
            {/* Sidebar */}
            <DriverSidebar />

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: 'calc(100% - 260px)' }}>
                <DriverNavbar />
                <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DriverLayout;
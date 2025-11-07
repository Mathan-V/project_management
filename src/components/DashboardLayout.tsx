// // src/components/DashboardLayout.tsx
// import React, { useState } from 'react';
// import { Outlet, useNavigate } from 'react-router-dom';
// import Sidebar from '../../src/components/layout/Sidebar';

// const DashboardLayout: React.FC = () => {
//   const [activeKey, setActiveKey] = useState('dashboard');
//   const [openKeys, setOpenKeys] = useState<string[]>([]);
//   const [expanded, setExpanded] = useState(true);
//   const navigate = useNavigate();

//   const handleSelect = (key: string) => {
//     setActiveKey(key);
//     navigate(`/${key}`); // navigate to route based on sidebar key
//   };

//   return (
//     <div style={{ display: 'flex' }}>
//       <Sidebar
//         activeKey={activeKey}
//         openKeys={openKeys}
//         expanded={expanded}
//         onExpand={setExpanded}
//         onOpenChange={setOpenKeys}
//         onSelect={handleSelect}
//       />
//       <div style={{ flex: 1, padding: 20 }}>
//         <Outlet /> {/* renders routed pages */}
//       </div>
//     </div>
//   );
// };

// export default DashboardLayout;
